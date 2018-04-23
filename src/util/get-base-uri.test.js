import getBaseURI from './get-base-uri'

describe('getBaseURI', () => {
    const parser = new DOMParser()

    test('should work without <base> tag', async () => {
        const parser = new DOMParser()

        const doc = parser.parseFromString(
            '<html><head></head><body></body></html>',
            'text/html'
        )

        const baseURI = getBaseURI(doc, 'https://example.com/test/page')
        expect(baseURI).toBe('https://example.com/test/page')
    })

    test('should work with an absolute href in a <base> tag', async () => {
        const doc = parser.parseFromString(
            '<html><head><base href="https://base.example.com/"></head><body></body></html>',
            'text/html'
        )

        const baseURI = getBaseURI(doc, 'https://example.com/test/page')
        expect(baseURI).toBe('https://base.example.com/')
    })

    test('should work with a relative href in a <base> tag', async () => {
        const doc = parser.parseFromString(
            '<html><head><base href="/other/path/"></head><body></body></html>',
            'text/html'
        )

        const baseURI = getBaseURI(doc, 'https://example.com/test/page')
        expect(baseURI).toBe('https://example.com/other/path/')
    })
})
