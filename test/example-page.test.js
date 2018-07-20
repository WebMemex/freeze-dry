import fs from 'fs'
import jsdom from 'jsdom/lib/old-api'
import jestFetchMock from 'jest-fetch-mock' // magically polyfills Response, Request, ...

import freezeDry from '../src'

global.fetch = jestFetchMock

beforeEach(() => {
    jest.resetAllMocks()
})

test('Freeze-dry an example page as expected', async () => {
    fetch.mockImplementation(mockFetch)

    const docUrl = 'https://example.com/main/page.html'
    const docHtml = await (await fetch(docUrl)).text()

    const doc = jsdom.jsdom(docHtml, {
        url: docUrl,
        async resourceLoader({ url }, callback) {
            const response = mockFetch(url.href)
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

    // Modify the iframe contents; the capture should include the modifications.
    const innerDoc = doc.getElementsByTagName('iframe')[0].contentDocument
    innerDoc.body.appendChild(innerDoc.createElement('hr'))
    const result = await freezeDry(doc)

    expect(result).toMatchSnapshot() // compares to (or creates) snapshot in __snapshots__ folder
})

// A fetch function that reads the subresources from local files.
function mockFetch(url) {
    const websiteOrigin = 'https://example.com'
    const basedir = __dirname + '/example-page'

    // We simply use the file extension to determine the mime type.
    const extensionTypes = {
        'html': 'text/html',
        'css': 'text/css',
        'png': 'image/png',
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
    throw new Error(`Trying to fetch unknown URL: ${url}`)
}
