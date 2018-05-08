import { html40, html52, whatwg } from './url-attributes'

describe('html52.srcset.parse', () => {
    test('should extract URLs from a srcset attribute', () => {
        const srcset = 'https://example.com/background1.jpg 0.5x, https://example.com/background2.jpg 1x, background3.jpg 2x'
        const result = html52.srcset.parse(srcset)
        expect(result).toEqual([
            { url: 'https://example.com/background1.jpg' },
            { url: 'https://example.com/background2.jpg' },
            { url: 'background3.jpg' },
        ])
    })
})
