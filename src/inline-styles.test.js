/* eslint-env jest */

import inlineStyles from './inline-styles'
import * as common from './common'
import { dataURLToBlob } from 'blob-util'


const imageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg=='

beforeEach(() => {
    jest.resetAllMocks()
})

describe('inlineStyles', () => {
    const parser = new DOMParser()
    let imageBlob
    let urlToDataUrlSpy

    beforeAll(async () => {
        imageBlob = await dataURLToBlob(imageDataUrl)
        urlToDataUrlSpy = jest.spyOn(common, 'urlToDataUrl')
    })

    test('should return <style> tag with the fetched stylesheet', async () => {
        const styleSheet = 'div{background-image: url("public/image/background.jpeg");}'
        fetch.mockResponseOnce(new Blob([styleSheet]))
        fetch.mockResponseOnce(imageBlob)
        const doc = parser.parseFromString(
            `<html>
                <head>
                    <link
                        rel="stylesheet"
                        type="text/css"
                        href="https://example.com/theme.css"
                    >
                </head>
            </html>`,
            'text/html'
        )
        const docUrl = 'https://example.com'
        await inlineStyles({rootElement: doc.documentElement, docUrl})
        expect(doc.querySelector('style').innerHTML)
            .toBe(`div{background-image: url(${imageDataUrl});}`)
    })

    test('should convert urls in <style> contents to dataUrls', async () => {
        urlToDataUrlSpy.mockReturnValue(imageDataUrl)
        const doc = parser.parseFromString(
            `<html>
                <head>
                    <style type="text/css">
                        div{background-image: url("public/image/background.jpeg");}
                    </style>
                </head>
                <div>
                </div>
            </html>`,
            'text/html'
        )
        const docUrl = 'https://example.com'
        await inlineStyles({rootElement: doc.documentElement, docUrl})
        expect(urlToDataUrlSpy).toHaveBeenCalled()
        expect(doc.querySelector('style').innerHTML.trim())
            .toBe(`div{background-image: url(${imageDataUrl});}`)
    })

    test('should convert the urls in a style attribute to data URLs', async () => {
        urlToDataUrlSpy.mockReturnValue(imageDataUrl)
        const doc = parser.parseFromString(
            '<html><div style="background-image: url(\'public/image/background.jpeg\');"></div></html>',
            'text/html'
        )
        const docUrl = 'https://example.com'
        await inlineStyles({rootElement: doc.documentElement, docUrl})
        expect(urlToDataUrlSpy).toHaveBeenCalled()
        expect(doc.querySelector('div').getAttribute('style'))
            .toBe(`background-image: url(${imageDataUrl});`)
    })
})
