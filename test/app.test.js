/* eslint-env jest */

import fs from 'fs'
import freezeDry from '../src/index'
import { dataURLToBlob } from 'blob-util'

const imageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg=='

describe('App Test', () => {
    const parser = new DOMParser()
    let imageBlob, htmlString

    beforeAll(async () => {
        htmlString = await fs.readFileSync('test/example.html', 'utf8')
        imageBlob = await dataURLToBlob(imageDataUrl)
    })

    test('should test against the freeze dried page', async () => {
        fetch.mockResponse(imageBlob)
        const docUrl = 'https://example.com'
        const doc = parser.parseFromString(htmlString, 'text/html')
        const html = await freezeDry(doc, docUrl)
        expect(html).toMatchSnapshot()
    })
})
