/* eslint-env jest */

import { dataURLToBlob } from 'blob-util'
import * as responseToDataUrl from 'response-to-data-url'

import {
    removeNode,
    fetchSubresource,
    stringToDataUrl,
    urlToDataUrl,
    inlineUrlsInAttributes,
} from './common'


const imageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg=='
let imageBlob

beforeAll(async () => {
    imageBlob = await dataURLToBlob(imageDataUrl)
})

beforeEach(() => {
    jest.resetAllMocks()
})

describe('removeNode', () => {
    test('should remove the node', () => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(
            '<html><head></head><body></body></html>',
            'text/html'
        )
        removeNode(doc.querySelector('head'))
        expect(doc.querySelector('head')).toBeNull()
    })
})

describe('fetchSubresource', () => {
    test('should call global fetch() with configuration', async () => {
        const url = 'https://example.com/image.png'
        const response = await fetchSubresource(url)
        expect(fetch).toHaveBeenCalledWith(url, expect.objectContaining({
            // Keeping it flexible, not checking each option and value.
            redirect: expect.any(String),
        }))
    })

    test('should return response from fetch', async () => {
        const mockResponse = new Response()
        fetch.mockReturnValue(mockResponse)
        const response = await fetchSubresource('some://url')
        expect(response).toBe(mockResponse)
    })
})

describe('stringToDataUrl', () => {
    test('should return the string as a base64-encoded data URLs', async () => {
        const someString = 'Just some arbirtary string.'
        const someStringAsDataUrl = 'data:text/plain;base64,SnVzdCBzb21lIGFyYmlydGFyeSBzdHJpbmcu'

        const dataUrl = await stringToDataUrl(someString, 'text/plain')
        expect(dataUrl).toBe(someStringAsDataUrl)
    })

    test('should default to mime type text/plain', async () => {
        const dataUrl = await stringToDataUrl('bla bla')
        expect(dataUrl).toMatch(/^data:text\/plain/)
    })

    test('should keep the given mime type', async () => {
        const dataUrl = await stringToDataUrl('bla bla', 'text/html')
        expect(dataUrl).toMatch(/^data:text\/html/)
    })
})

describe('urlToDataUrl', () => {
    let responseToDataUrlSpy

    beforeAll(() => {
        responseToDataUrlSpy = jest.spyOn(responseToDataUrl, 'default')
    })

    afterAll(() => {
        responseToDataUrlSpy.mockRestore()
    })

    test('should return a dataUrl given a URL', async () => {
        responseToDataUrlSpy.mockImplementation(async () => {
            return imageDataUrl
        })
        const dataUrl = await urlToDataUrl('https://example.com/page')
        expect(dataUrl).toBe(imageDataUrl)
    })

    test('should return a "about:invalid" upon failure', async () => {
        responseToDataUrlSpy.mockImplementation(async () => {
            throw new Error('mock error')
        })
        const dataUrl = await urlToDataUrl('http://example.com')
        expect(dataUrl).toBe('about:invalid')
    })

    test('should return a "about:invalid" when fetching fails', async () => {
        fetch.mockReject()
        const dataUrl = await urlToDataUrl('http://example.com')
        expect(dataUrl).toBe('about:invalid')
    })
})

describe('inlineUrlsInAttributes', () => {
    const docUrl = 'https://example.com/page'
    const parser = new DOMParser()

    test('should convert the specified attribute to a dataUrl', async () => {
        fetch.mockResponse(imageBlob)
        const doc = parser.parseFromString(
            '<html><body><img src="public/image/background.png" alt="background" /></body></html>',
            'text/html'
        )
        const rootElement = doc.documentElement
        await inlineUrlsInAttributes({elements: 'img', attributes: 'src', rootElement, docUrl})
        expect(rootElement.querySelector('img').getAttribute('data-original-src')).toBe('public/image/background.png')
        expect(rootElement.querySelector('img').getAttribute('src')).toBe(imageDataUrl)
    })

    test('should remove the integrity attribute from the tag when requested', async () => {
        fetch.mockResponse(new Blob(['body {color: blue;}'], {type: 'text/css'}))
        const doc = parser.parseFromString(
            `<html>
                <head>
                    <link
                        href="https://example.com/style.css"
                        rel="stylesheet"
                        integrity="sha256-tyOenI/NYVBQ/s8utU625f5ThA88VvIio7IrLMqtdTw="
                    >
                </head>
            </html>`,
            'text/html'
        )
        const rootElement = doc.documentElement
        await inlineUrlsInAttributes({elements: 'link', attributes: 'href', fixIntegrity: true, rootElement, docUrl})
        expect(rootElement.querySelector('link').getAttribute('integrity')).toBeNull()
    })
})
