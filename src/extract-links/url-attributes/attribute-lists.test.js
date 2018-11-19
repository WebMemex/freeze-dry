import { html40, html52, whatwg } from './attribute-lists.js'

describe('default parser', () => {
    test('should strip whitespace', () => {
        const href = ' https://example.com  '
        const result = html40.href.parse(href)
        expect(result).toEqual([
            { token: 'https://example.com', index: 1 },
        ])
    })
})

describe('default makeAbsolute', () => {
    test('should interpret relative URLs normally', () => {
        const element = window.document.createElement('a')
        const href = 'somewhere'
        const result = html40.href.makeAbsolute(href, element)
        expect(result).toEqual('https://example.com/test/somewhere')
    })

    test('should interpret URLs relative to given baseUrl', () => {
        const element = window.document.createElement('a')
        const href = 'somewhere'
        const result = html40.href.makeAbsolute(href, element, 'https://baseurl.example/')
        expect(result).toEqual('https://baseurl.example/somewhere')
    })
})

describe('html40.meta_refresh_content.parse', () => {
    test('should extract the URL', () => {
        const content = '5; url=https://example.com/'
        const result = html40.meta_refresh_content.parse(content)
        expect(result).toEqual([
            { token: 'https://example.com/', index: 7 },
        ])
    })

    test('should ignore whitespace', () => {
        const content = ' 5 ;\t url =  https://example.com/ '
        const result = html40.meta_refresh_content.parse(content)
        expect(result).toEqual([
            { token: 'https://example.com/', index: 13 },
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
            { token: 'https://example.com/background1.jpg', index: 0 },
            { token: 'https://example.com/background2.jpg', index: 42 },
            { token: 'background3.jpg', index: 82 },
        ])
    })
})

describe('whatwg.itemprop.parse', () => {
    test('should omit tokens that are not absolute URLs', () => {
        const itemprop = 'someName https://example.com/ns/myProp otherName'
        const result = whatwg.itemprop.parse(itemprop)
        expect(result).toEqual([
            { token: 'https://example.com/ns/myProp', index: 9 },
        ])
    })
})

describe('html40.data.makeAbsolute', () => {
    test('should interpret URLs as relative to its codebase attribute', () => {
        const element = window.document.createElement('object')
        element.setAttribute('codebase', '/code_path/')
        const result = html40.data.makeAbsolute('the_data', element)
        expect(result).toEqual('https://example.com/code_path/the_data')
    })

    test('should work normally without a codebase attribute', () => {
        const element = window.document.createElement('object')
        const result = html40.data.makeAbsolute('the_data', element)
        expect(result).toEqual('https://example.com/test/the_data')
    })
})

describe('html52.manifest.makeAbsolute', () => {
    test('should ignore the <base href="...">.', () => {
        // TODO (easier with the non-broken document.clone() of jsdom≥1.9.0; may be in jest soon)
        // (probably nobody ever uses both a <base> tag and an appcache manifest, but still..)
    })

    test('should use manually overridden document URL', () => {
        const manifest = 'manifest.appcache'
        const element = window.document.createElement('html')
        const result = html52.manifest.makeAbsolute(
            manifest,
            element,
            'https://baseUrl.example/', // override base URL (should be ignored)
            'https://domain.example/path/page' // override document URL (should be used)
        )
        expect(result).toEqual('https://domain.example/path/manifest.appcache')
    })
})
