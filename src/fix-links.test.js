/* eslint-env jest */

import fixLinks, { replaceStrings } from './fix-links'

describe('replaceStrings', () => {
    test('should work', () => {
        const string = 'fluffy clouds in a deep blue sky.'
        const replacements = [
            { index: 7, length: 6, value: 'fish' },
            { index: 29, length: 3, value: 'sea' },
        ]
        const newString = replaceStrings(string, replacements)
        expect(newString).toBe('fluffy fish in a deep blue sea.')
    })
})

describe('fixLinks', () => {
    test('should make relative URLs absolute', async () => {
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = '<a href="otherpage#home">Link</a>'
        await fixLinks({rootElement})
        expect(rootElement.querySelector('*[href]').getAttribute('href'))
            .toBe('https://example.com/test/otherpage#home')
        // note: window.document.URL is configured to be https://example.com/test/page
    })

    test('should work on various URL-containing attributes', async () => {
        // Testing just a few attributes here.
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = `
            <meta http-equiv="refresh" content="0; url=redirection">
            <img src="image" srcset="4x 2x, 2x 4x"><!--indeed a confusing srcset-->
        `
        await fixLinks({rootElement})
        expect(rootElement.querySelector('meta').getAttribute('content'))
            .toBe('0; url=https://example.com/test/redirection')
        expect(rootElement.querySelector('img').getAttribute('src'))
            .toBe('https://example.com/test/image')
        expect(rootElement.querySelector('img').getAttribute('srcset'))
            .toBe('https://example.com/test/4x 2x, https://example.com/test/2x 4x')
    })

    test('should not alter within-documents URLs', async () => {
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = '<a href="#section4">Link</a>'
        await fixLinks({rootElement})
        expect(rootElement.querySelector('*[href]').getAttribute('href'))
            .toBe('#section4')
    })

    test('should take baseURI into account', async () => {
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = '<a href="otherpage#home">Link</a>'
        await fixLinks({rootElement, baseURI: 'https://example.com/newpath/page'})
        expect(rootElement.querySelector('*[href]').getAttribute('href'))
            .toBe('https://example.com/newpath/otherpage#home')
    })

    test('should not alter absolute URLs', async () => {
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = '<a href="https://example.com/#home">Link</a>'
        await fixLinks({rootElement})
        expect(rootElement.querySelector('*[href]').getAttribute('href'))
            .toBe('https://example.com/#home')
    })

    test('should not alter inline javascript in href attribute', async () => {
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = `<a href="javascript:alert('Hello');">Link</a>`
        await fixLinks({rootElement})
        expect(rootElement.querySelector('*[href]').getAttribute('href'))
            .toBe(`javascript:alert('Hello');`)
    })

    test('should not alter mailto: URIs in href attribute', async () => {
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = `<a href="mailto:someone@example.com">Link</a>`
        await fixLinks({rootElement})
        expect(rootElement.querySelector('*[href]').getAttribute('href'))
            .toBe(`mailto:someone@example.com`)
    })

    test('should not alter data urls in href attribute', async () => {
        const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg=='
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = `<a href="${dataUrl}">Link</a>`
        await fixLinks({rootElement})
        expect(rootElement.querySelector('*[href]').getAttribute('href')).toBe(dataUrl)
    })
})
