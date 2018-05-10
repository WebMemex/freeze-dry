import { html40, html52, whatwg } from './attribute-lists'


describe('default parser', () => {
    test('should strip whitespace', () => {
        const href = ' https://example.com  '
        const result = html40.href.parse(href)
        expect(result).toEqual([
            { url: 'https://example.com', index: 1 }
        ])
    })
})

describe('html40.meta_refresh_content.parse', () => {
    test('should extract the URL', () => {
        const content = '5; url=https://example.com/'
        const result = html40.meta_refresh_content.parse(content)
        expect(result).toEqual([
            { url: 'https://example.com/', index: 7 }
        ])
    })

    test('should ignore whitespace', () => {
        const content = ' 5 ;\t url =  https://example.com/ '
        const result = html40.meta_refresh_content.parse(content)
        expect(result).toEqual([
            { url: 'https://example.com/', index: 13 }
        ])
    })

    test('should ignore values without a URL', () => {
        const content = '5'
        const result = html40.meta_refresh_content.parse(content)
        expect(result).toEqual([])
    })
})

describe('html52.srcset.parse', () => {
    test('should extract URLs from a srcset attribute', () => {
        const srcset = 'https://example.com/background1.jpg 0.5x, https://example.com/background2.jpg 1x, background3.jpg 2x'
        const result = html52.srcset.parse(srcset)
        expect(result).toEqual([
            { url: 'https://example.com/background1.jpg', index: 0 },
            { url: 'https://example.com/background2.jpg', index: 42 },
            { url: 'background3.jpg', index: 82 },
        ])
    })
})

describe('whatwg.itemprop.parse', () => {
    test('should omit tokens that are not absolute URLs', () => {
        const itemprop = 'someName https://example.com/ns/myProp otherName'
        const result = whatwg.itemprop.parse(itemprop)
        expect(result).toEqual([
            { url: 'https://example.com/ns/myProp', index: 9 },
        ])
    })
})
