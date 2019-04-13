import fs from 'fs'
import jsdom from 'jsdom/lib/old-api'
import jestFetchMock from 'jest-fetch-mock' // magically polyfills Response, Request, ...
import { dataURLToBlob } from 'blob-util'

import freezeDry from '../src/index.js'

global.fetch = jestFetchMock
beforeEach(() => {
    fetch.mockImplementation(mockFetch)
})

jest.useFakeTimers()

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

test('should return the incomplete result after given timeout', async () => {
    const doc = await getExampleDoc()

    // Make fetch never resolve
    fetch.mockImplementation(url => new Promise(resolve => {}))

    const resultP = freezeDry(doc, {
        now: new Date(1534615340948),
        timeout: 2000,
    }).text()
    jest.runAllTimers() // trigger the timeout directly.
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
        return {
            url: response.url,
            blob: await response.blob(),
        }
    }

    const result = await freezeDry(doc, { now, fetchResource }).text()

    expect(result).toEqual(expectedResult)
})

async function getExampleDoc() {
    const docUrl = 'https://example.com/main/page.html'
    const docHtml = await (await fetch(docUrl)).text()
    const doc = await makeDom(docHtml, docUrl)
    return doc
}

async function makeDom(docHtml, docUrl) {
    const doc = jsdom.jsdom(docHtml, {
        url: docUrl,
        async resourceLoader({ url }, callback) {
            const response = await mockFetch(url.href)
            const body = await response.text()
            callback(null, body)
            return null
        },
        features: {
            FetchExternalResources: ['link', 'frame', 'iframe'],
        },
    })

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
async function mockFetch(url) {
    const websiteOrigin = 'https://example.com'
    const basedir = __dirname + '/example-page'

    // We simply use the file extension to determine the mime type.
    const extensionTypes = {
        'html': 'text/html',
        'css': 'text/css',
        'png': 'image/png',
        'woff': 'font/woff',
    }

    if (url.startsWith(websiteOrigin)) {
        const path = url.slice(websiteOrigin.length,)
        const content = fs.readFileSync(basedir + path)
        const mimeType = extensionTypes[url.split('.').reverse()[0]]
        const blob = new Blob([content], { type: mimeType })
        const response = new Response(blob, { status: 200 })
        response.url = url
        return response
    }

    if (url.startsWith('data:')) {
        const blob = await dataURLToBlob(url)
        const response = new Response(blob, { status: 200 })
        response.url = url
        return response
    }

    throw new Error(`Trying to fetch unknown URL: ${url}`)
}
