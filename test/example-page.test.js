import fs from 'fs'
import jsdom from 'jsdom/lib/old-api'
import jestFetchMock from 'jest-fetch-mock' // magically polyfills Response, Request, ...
import { dataURLToBlob } from 'blob-util'

import freezeDry from '../src'

global.fetch = jestFetchMock
fetch.mockImplementation(mockFetch)

test('Freeze-dry an example page as expected', async () => {
    const result = await freezeDryExamplePage()

    expect(result).toMatchSnapshot() // compares to (or creates) snapshot in __snapshots__ folder
})

test('Freeze-dry should be idempotent', async () => {
    const dryHtml = await freezeDryExamplePage()
    const docUrl = 'https://url.should.be/irrelevant'
    const dryDoc = await makeDom(dryHtml, docUrl)

    const extraDryHtml = await freezeDry(dryDoc)

    expect(extraDryHtml).toEqual(dryHtml)
})

async function freezeDryExamplePage() {
    const docUrl = 'https://example.com/main/page.html'
    const docHtml = await (await fetch(docUrl)).text()

    const doc = await makeDom(docHtml, docUrl)

    // Modify the iframe contents; the capture should include the modifications.
    const innerDoc = doc.getElementsByTagName('iframe')[0].contentDocument
    innerDoc.body.appendChild(innerDoc.createElement('hr'))

    const result = await freezeDry(doc)

    return result
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
