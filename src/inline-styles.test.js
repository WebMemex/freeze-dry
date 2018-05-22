/* eslint-env jest */

import inlineStyles from './inline-styles'
import * as common from './common'
import { dataURLToBlob } from 'blob-util'


const imageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg=='
const styleSheet = 'div{background-image: url("public/image/background.jpeg");}'
// The same stylesheet, with the image above inlined as data URL, then altogether encoded as data URL.
const styleSheetAsDataUrl = 'data:text/css;base64,ZGl2e2JhY2tncm91bmQtaW1hZ2U6IHVybCgiZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBRUFBQUFCQ0FBQUFBQTZmcHRWQUFBQUNrbEVRVlI0bkdOaUFBQUFCZ0FETmpkOHFBQUFBQUJKUlU1RXJrSmdnZz09Iik7fQ=='

beforeEach(() => {
    jest.resetAllMocks()
})

describe('inlineStyles', () => {
    const baseURI = 'https://example.com/test/page'
    const parser = new DOMParser()
    let urlToDataUrlSpy

    beforeAll(() => {
        urlToDataUrlSpy = jest.spyOn(common, 'urlToDataUrl')
    })

    test('should convert the href of a <link rel="stylesheet"> to a data URL', async () => {
        fetch.mockResponseOnce(new Blob([styleSheet], {type: 'text/css'}))
        urlToDataUrlSpy.mockReturnValue(imageDataUrl)
        const doc = parser.parseFromString(
            `<html>
                <head>
                    <link rel="stylesheet" type="text/css" href="theme.css">
                </head>
            </html>`,
            'text/html'
        )
        await inlineStyles({rootElement: doc.documentElement, baseURI})
        const link = doc.querySelector('link')
        expect(link.getAttribute('href')).toBe(styleSheetAsDataUrl)
        expect(link.getAttribute('data-original-href')).toBe('theme.css')
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
        await inlineStyles({rootElement: doc.documentElement, baseURI})
        expect(urlToDataUrlSpy).toHaveBeenCalled()
        expect(doc.querySelector('style').innerHTML.trim())
            .toBe(`div{background-image: url("${imageDataUrl}");}`)
    })

    test('should convert the urls in a style attribute to data URLs', async () => {
        urlToDataUrlSpy.mockReturnValue(imageDataUrl)
        const doc = parser.parseFromString(
            '<html><div style="background-image: url(\'public/image/background.jpeg\');"></div></html>',
            'text/html'
        )
        await inlineStyles({rootElement: doc.documentElement, baseURI})
        expect(urlToDataUrlSpy).toHaveBeenCalled()
        expect(doc.querySelector('div').getAttribute('style'))
            .toBe(`background-image: url("${imageDataUrl}");`)
    })
})
