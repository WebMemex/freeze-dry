import getBaseUrl from './get-base-url.js'

describe('getBaseUrl', () => {
    const parser = new DOMParser()

    test('should work without <base> tag', () => {
        const parser = new DOMParser()

        const doc = parser.parseFromString(
            '<html><head></head><body></body></html>',
            'text/html'
        )

        const baseUrl = getBaseUrl(doc, 'https://example.com/test/page')
        expect(baseUrl).toEqual('https://example.com/test/page')
    })

    test('should work with an absolute href in a <base> tag', () => {
        const doc = parser.parseFromString(
            '<html><head><base href="https://base.example.com/"></head><body></body></html>',
            'text/html'
        )

        const baseUrl = getBaseUrl(doc, 'https://example.com/test/page')
        expect(baseUrl).toEqual('https://base.example.com/')
    })

    test('should work with a relative href in a <base> tag', () => {
        const doc = parser.parseFromString(
            '<html><head><base href="/other/path/"></head><body></body></html>',
            'text/html'
        )

        const baseUrl = getBaseUrl(doc, 'https://example.com/test/page')
        expect(baseUrl).toEqual('https://example.com/other/path/')
    })
})
