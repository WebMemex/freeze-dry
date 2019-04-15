import fs from 'fs'
import { JSDOM, ResourceLoader } from 'jsdom'
import jestFetchMock from 'jest-fetch-mock' // magically polyfills Response, Request, ...
import { dataURLToBlob } from 'blob-util'
import freezeDry from '../src/index.js'

global.fetch = jestFetchMock
global.AbortController = new JSDOM().window.AbortController

beforeEach(() => {
    fetch.mockImplementation(mockFetch)
})

jest.useFakeTimers()

const setResponseURL = (response, url) => {
    Object.defineProperty(response, "url", {value:url})
}



test('should freeze-dry an example page as expected', async () => {
    const doc = await getExampleDoc()

    // Run freeze-dry, while passing a fixed date for reproducability.
    const result = await freezeDry(doc, { now: new Date(1534615340948) }).text()

    expect(result).toMatchSnapshot() // compares to (or creates) snapshot in __snapshots__ folder
})

test('should capture current state of documents inside frames', async () => {
    const doc = await getExampleDoc()

    // Modify the iframe contents; the capture should include the modifications.
    const innerDoc = doc.getElementsByTagName('iframe')[0].contentDocument
    innerDoc.body.appendChild(innerDoc.createElement('hr'))

    const result = await freezeDry(doc, { now: new Date(1534615340948) }).text()

    const dryDoc = await makeDom(result)
    const dryInnerDoc = dryDoc.querySelector('iframe').contentDocument
    expect(dryInnerDoc.querySelector('hr')).not.toBeNull()
})

test('should be idempotent', async () => {
    const doc = await getExampleDoc()
    const dryHtml = await freezeDry(doc, { now: new Date(1534615340948) }).text()
    const docUrl = 'https://url.should.be/irrelevant'
    const dryDoc = await makeDom(dryHtml, docUrl)

    // Freeze-dry the freeze-dried page. Adding metadata would of course break idempotency.
    const extraDryHtml = await freezeDry(dryDoc, { addMetadata: false }).text()

    expect(extraDryHtml).toEqual(dryHtml)
})

test('should return the incomplete result when abort signalled', async () => {
    const doc = await getExampleDoc()

    const controller = new AbortController()
    const resultP = freezeDry(doc, {
        now: new Date(1534615340948),
        signal: controller.signal
    }).text()
    controller.abort()

    const result = await resultP

    expect(result).toMatchSnapshot()
})

test('should use the given docUrl', async () => {
    const docUrl = 'https://example.com/main/page.html'
    const docHtml = await (await fetch(docUrl)).text()
    // This time, we use a DOMParser, and create a Document that lacks a URL.
    const doc = new DOMParser().parseFromString(docHtml, 'text/html')

    const result = await freezeDry(doc, { docUrl }).text()

    const dryDoc = await makeDom(result)
    expect(dryDoc.querySelector('a').getAttribute('href'))
        .toEqual('https://example.com/main/something')
    expect(dryDoc.querySelector('img').getAttribute('src'))
        .toMatch(/^data:/)
})

test('should respect the addMetadata option', async () => {
    const testWithOption = async addMetadata => {
        const doc = await getExampleDoc()

        const result = await freezeDry(doc, { addMetadata }).text()

        const dryDoc = await makeDom(result)
        expect(dryDoc.querySelector('link[rel=original]')).not.toBeNull()
        expect(dryDoc.querySelector('meta[http-equiv=Memento-Datetime]')).not.toBeNull()
    }
    await expect(testWithOption(true)).resolves.toEqual(undefined)
    await expect(testWithOption(false)).rejects.toEqual(expect.anything())
    await expect(testWithOption()).resolves.toEqual(undefined) // option should default to true
})

test('should respect the keepOriginalAttributes option', async () => {
    const testWithOption = async keepOriginalAttributes => {
        const doc = await getExampleDoc()

        const result = await freezeDry(doc, { keepOriginalAttributes }).text()

        const dryDoc = await makeDom(result)
        expect(dryDoc.querySelector('img[data-original-src]')).not.toBeNull()
    }
    await expect(testWithOption(true)).resolves.toEqual(undefined)
    await expect(testWithOption(false)).rejects.toEqual(expect.anything())
    await expect(testWithOption()).resolves.toEqual(undefined) // option should default to true
})

test('should use the custom fetchResource function', async () => {
    const now = new Date(1545671350764)
    const doc = await getExampleDoc()
    const expectedResult = await freezeDry(doc, { now }).text()

    fetch.mockClear() // Clear the invocation count.
    const fetchResource = jest.fn(mockFetch) // Create a second mock using the same implementation.

    const result = await freezeDry(doc, { now, fetchResource }).text()

    // We should have got the same result as usual, without the global fetch having been invoked.
    expect(result).toEqual(expectedResult)
    expect(fetchResource).toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
})

test('should work if the custom fetchResource function returns a simple object', async () => {
    const now = new Date(1545671350764)
    const doc = await getExampleDoc()
    const expectedResult = await freezeDry(doc, { now }).text()

    // A fetch-like function, that returns not a Response but a plain object with a blob and a url.
    async function fetchResource(...args) {
        const response = await fetch(...args)
        const result = {
            url: response.url,
            blob: await response.blob(),
        }
        return result
    }

    const result = await freezeDry(doc, { now, fetchResource }).text()

    expect(result).toEqual(expectedResult)
})

async function getExampleDoc() {
    const docUrl = 'https://example.com/main/page.html'
    const response = await fetch(docUrl)
    const docHtml = await response.text()
    const doc = await makeDom(docHtml, docUrl)
    return doc
}

async function makeDom(docHtml, docUrl) {
    const doc = new JSDOM(docHtml, {
        url: docUrl,
        resources: resourceLoader,
        features: {
            FetchExternalResources: ['link', 'frame', 'iframe'],
        },
    }).window.document

    // Wait until JSDOM has completed loading the page (including frames).
    await new Promise(resolve => {
        if (doc.readyState === 'complete') {
            resolve()
        } else {
            doc.addEventListener('load', resolve)
        }
    })

    return doc
}

// A fetch function that reads the subresources from local files.
async function mockFetch(url, options={}) {
    const websiteOrigin = 'https://example.com'
    const basedir = __dirname + '/example-page'

    // We simply use the file extension to determine the mime type.
    const extensionTypes = {
        'html': 'text/html',
        'css': 'text/css',
        'png': 'image/png',
        'woff': 'font/woff',
    }

    if (options.signal && options.signal.aborted) {
        throw new AbortError("The operation was aborted.")
    }

    if (url.startsWith(websiteOrigin)) {
        const path = url.slice(websiteOrigin.length,)
        const content = fs.readFileSync(basedir + path)
        const mimeType = extensionTypes[url.split('.').reverse()[0]]
        
        const blob = new Blob([content], { type: mimeType })
        if (!blob.isAPICompatiblilityFixed) {
            const jsdomBlob = new Blob([])
            const [impl] = Object.getOwnPropertySymbols(jsdomBlob)
            const responseBlob = await new Response([]).blob()
            const [type, BUFFER] = Object.getOwnPropertySymbols(responseBlob)

            Object.defineProperties(Blob.prototype, {
                // https://github.com/bitinn/node-fetch/blob/e996bdab73baf996cf2dbf25643c8fe2698c3249/src/blob.js#L48
                [type]: { get() { return this[impl].type || "application/octet-stream" } },
                // https://github.com/bitinn/node-fetch/blob/e996bdab73baf996cf2dbf25643c8fe2698c3249/src/blob.js#L37
                [BUFFER]: { get() { return this[impl]._buffer } }
            })

            // Patch proto so that in node-fetch blob instanceof Blob is true
            Blob.prototype.__proto__ = responseBlob.__proto__
            // We also need to ensure that response.blob() is instance of Blob
            // expected by jsdom. To accomplish this we patch `Response.prototype`
            // that would return correct blob instead of one that will cause
            // blob instanceof Blob to be false in JSDOM code.
            const Respones$prototype$blob = Response.prototype.blob
            Response.prototype.blob = async function() {
                const source = await Respones$prototype$blob.call(this)
                return new Blob([source[BUFFER]], {type:source.type})
            }
            
            Blob.prototype.isAPICompatiblilityFixed = true
        }
        if (blob.type !== mimeType) {
            console.log("==?", blob.type, mimeType)
        }
        const response = new Response(blob, {
            status: 200,
            headers: { 'content-type': blob.type }
        })

        
        setResponseURL(response, url)
        return response
    }

    if (url.startsWith('data:')) {
        const blob = await dataURLToBlob(url)
        const response = new Response(blob, {
            status: 200,
            headers: { 'content-type': blob.type }
        })
        setResponseURL(response, url)
        return response
    }

    throw new Error(`Trying to fetch unknown URL: ${url}`)
}

class AbortError {
    get name() { return 'AbortError' }
    get code() { return 20 }
}
AbortError.prototype.__proto__ = Error.prototype

function MockResourceLoader (...args) {}
MockResourceLoader.prototype = Object.create(ResourceLoader.prototype)
MockResourceLoader.prototype.fetch = async function(url, options) {
    const response = await mockFetch(url, options)
    const body = await response.text()
    return body
}

const resourceLoader = new MockResourceLoader()