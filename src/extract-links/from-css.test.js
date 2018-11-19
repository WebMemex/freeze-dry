import postcss from 'postcss'

import { extractLinksFromCss, extractLinksFromCssSynced } from './from-css.js'

const exampleCssString = `
    @import 'sheet2.css' screen and orientation('landscape');
    @font-face {
        font-family: "My Font";
        src: url("/fonts/myfont.woff2") format("woff2"),
             url("/fonts/myfont.woff") format("woff");
    }
    body {
        color: rgba(255, 128, 255, 0.5);
        background: url('https://example.org/image.png');
    }
    p {
        background-image: url('background.png');
    }
`

const exampleCssStringWithReplacedUrls = `
    @import 'new-target0' screen and orientation('landscape');
    @font-face {
        font-family: "My Font";
        src: url("new-target1") format("woff2"),
             url("new-target2") format("woff");
    }
    body {
        color: rgba(255, 128, 255, 0.5);
        background: url('new-target3');
    }
    p {
        background-image: url('new-target4');
    }
`

describe('extractLinksFromCss', () => {
    test('should find all URLs in a typical example', () => {
        const parsedCss = postcss.parse(exampleCssString)

        const links = extractLinksFromCss(parsedCss, 'https://base.url/stylesheet.css')

        expect(links.length).toEqual(5)

        expect(links[0].subresourceType).toEqual('style')
        expect(links[1].subresourceType).toEqual('font')
        expect(links[2].subresourceType).toEqual('font')
        expect(links[3].subresourceType).toEqual('image')
        expect(links[4].subresourceType).toEqual('image')

        expect(links[0].target).toEqual('sheet2.css')
        expect(links[0].absoluteTarget).toEqual('https://base.url/sheet2.css')

        expect(links[1].target).toEqual('/fonts/myfont.woff2')
        expect(links[1].absoluteTarget).toEqual('https://base.url/fonts/myfont.woff2')

        expect(links[4].target).toEqual('background.png')
        expect(links[4].absoluteTarget).toEqual('https://base.url/background.png')
    })

    test('should correctly update URLs in a typical example', () => {
        const parsedCss = postcss.parse(exampleCssString)

        const links = extractLinksFromCss(parsedCss, 'https://base.url/stylesheet.css')

        links[0].target = 'new-target0'
        links[1].target = 'new-target1'
        links[2].target = 'new-target2'
        links[3].target = 'new-target3'
        links[4].target = 'new-target4'

        expect(parsedCss.toResult().css).toEqual(exampleCssStringWithReplacedUrls)
    })

    test('should work given only the contents within a rule', () => {
        const cssString = `
            background-image: url('background.png');
            color: blue;
            cursor: url('cursor.png'), pointer
        `
        const parsedCss = postcss.parse(cssString)

        const links = extractLinksFromCss(parsedCss, 'https://base.url/')

        expect(links).toHaveLength(2)
        expect(links[0].target).toEqual('background.png')
        expect(links[1].target).toEqual('cursor.png')
    })

    test('should find any @import link', () => {
        const cssString = `
            @charset "utf-8";
            @import "other-sheet0.css";
            @import url(other-sheet1.css);
            @import url("other-sheet2.css");
            @import url('other-sheet3.css');
        `
        const parsedCss = postcss.parse(cssString)

        const links = extractLinksFromCss(parsedCss, 'https://base.url/stylesheet.css')

        expect(links).toHaveLength(4)
        expect(links[0].target).toBe('other-sheet0.css')
        expect(links[1].target).toBe('other-sheet1.css')
        expect(links[2].target).toBe('other-sheet2.css')
        expect(links[3].target).toBe('other-sheet3.css')
    })

    test('should find any image link', () => {
        const cssString = `
            body {
                background: no-repeat center/80% url("bg.png"),
                            url(bg2.png) cover, rgba(0,0,0,0.5);
                cursor: url('cursor.png'), pointer;
            }
        `
        const parsedCss = postcss.parse(cssString)

        const links = extractLinksFromCss(parsedCss, 'https://base.url/stylesheet.css')

        expect(links).toHaveLength(3)
        expect(links[0].target).toBe('bg.png')
        expect(links[1].target).toBe('bg2.png')
        expect(links[2].target).toBe('cursor.png')

        expect(links[0].isSubresource).toEqual(true)
        expect(links[0].subresourceType).toEqual('image')
    })

    test('should find any @font-face link', () => {
        const cssString = `
            @font-face {
                font-family: "My Font";
                src: url("/fonts/myfont.woff2") format("woff2"),
                     url('/fonts/myfont.woff') format("woff"),
                     url(/fonts/myfont.ttf) format("ttf");
            }
        `
        const parsedCss = postcss.parse(cssString)

        const links = extractLinksFromCss(parsedCss, 'https://base.url/stylesheet.css')

        expect(links).toHaveLength(3)
        expect(links[0].target).toBe('/fonts/myfont.woff2')
        expect(links[1].target).toBe('/fonts/myfont.woff')
        expect(links[2].target).toBe('/fonts/myfont.ttf')

        expect(links[0].isSubresource).toEqual(true)
        expect(links[0].subresourceType).toEqual('font')
    })
})

describe('extractLinksFromCssSynced', () => {
    let cssString
    let links

    beforeEach(() => {
        cssString = `p { background-image: url('background.png'); }`
        links = extractLinksFromCssSynced({
            get: () => { return cssString },
            set: v => { cssString = v },
            baseUrl: 'https://base.url/',
        })
    })

    test('should give the current link target', () => {
        const firstLink = links[0]

        expect(firstLink.target).toEqual('background.png')

        cssString = `p { background-image: url('another.png'); }`

        // Check via both the previous and current value of links[0]
        expect(firstLink.target).toEqual('another.png')
        expect(links[0].target).toEqual('another.png')
    })

    test('should give new additional links', () => {
        const firstLink = links[0]

        cssString = `
            div { background-image: url('newUrl.png'); }
            p { background-image: url('background.png'); }
        `

        expect(links).toHaveLength(2)
        expect(links[0].target).toEqual('newUrl.png')
        expect(links[1].target).toEqual('background.png')

        // Note that firstLink always points to what is *currently* the first link. We do not do any
        // smart diffing to follow the 'same' link from one cssString to the next.
        expect(firstLink.target).toEqual('newUrl.png')
    })

    test('should throw when accessing a removed link', () => {
        cssString = `
            div { background-image: url('newUrl.png'); }
            p { background-image: url('background.png'); }
        `

        const secondLink = links[1]

        cssString = `
            div { background-image: url('newUrl.png'); }
        `

        expect(links).toHaveLength(1)
        expect(() => secondLink.target).toThrow(TypeError)
    })

    test('should update the CSS string', () => {
        links[0].target = 'other.png'

        expect(links[0].target).toEqual('other.png')
        expect(cssString).toEqual(`p { background-image: url('other.png'); }`)
    })

    test('should simply pretend corrupt CSS contains no links', () => {
        cssString = `p { bla url(blub); }`

        expect(links).toHaveLength(0)
        // ..and should not accidentally change the string either.
        expect(cssString).toEqual(`p { bla url(blub); }`)
    })
})
