import { html40, html52, whatwg, splitByComma, splitByWhitespace } from './url-attributes'


describe('splitByComma', () => {
    test('should work for a basic case', () => {
        expect(splitByComma('aaa, bbb, ccc')).toEqual([
            { url: 'aaa', index: 0 },
            { url: 'bbb', index: 5 },
            { url: 'ccc', index: 10 },
        ])
    })

    test('should ignore any whitespace', () => {
        expect(splitByComma(' \taaa, bbb\n,\nccc ')).toEqual([
            { url: 'aaa', index: 2 },
            { url: 'bbb', index: 7 },
            { url: 'ccc', index: 13 },
        ])
    })

    test('should work for a single token', () => {
        expect(splitByComma('aaa')).toEqual([
            { url: 'aaa', index: 0 },
        ])
        expect(splitByComma(' aaa ')).toEqual([
            { url: 'aaa', index: 1 },
        ])
    })

    test('should retain whitespace within tokens', () => {
        // Note that whitespace should not actually occur in URLs, but testing this anyhow.
        expect(splitByComma('aaa aaa, bbb\tbbb\nbbb')).toEqual([
            { url: 'aaa aaa', index: 0 },
            { url: 'bbb\tbbb\nbbb', index: 9 },
        ])
    })

    test('should omit empty tokens', () => {
        // These should probably not occur in valid values, but best to handle them neatly.
        expect(splitByComma('aaa,, , ddd')).toEqual([
            { url: 'aaa', index: 0 },
            { url: 'ddd', index: 8 },
        ])
    })
})

describe('splitByWhitespace', () => {
    test('should work for a basic case', () => {
        expect(splitByWhitespace('aaa bbb ccc')).toEqual([
            { url: 'aaa', index: 0 },
            { url: 'bbb', index: 4 },
            { url: 'ccc', index: 8 },
        ])
    })

    test('should handle any whitespace', () => {
        expect(splitByWhitespace(' \taaa  bbb \nccc ')).toEqual([
            { url: 'aaa', index: 2 },
            { url: 'bbb', index: 7 },
            { url: 'ccc', index: 12 },
        ])
    })

    test('should work for a single token', () => {
        expect(splitByWhitespace('aaa')).toEqual([
            { url: 'aaa', index: 0 },
        ])
        expect(splitByWhitespace(' aaa ')).toEqual([
            { url: 'aaa', index: 1 },
        ])
    })
})

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
