import { syncingParsedView } from './parse-tools.js'

/**
 * Extract links from a stylesheet.
 * @param options
 * @param {() => string} options.get - getter to obtain the current content of the stylesheet.
 * @param {string => void} options.set - setter that is called, whenever a link is modified, with
 * the new value of the whole stylesheet.
 * @param {string} options.baseUrl - the absolute URL for interpreting any relative URLs in the
 * stylesheet.
 * @returns {Object[]} The extracted links. Each link provides a live, editable view on one URL
 * inside the stylesheet.
 */
export function extractLinksFromCss({ get, set, baseUrl }) {
    const parsedStylesheetView = syncingParsedView({
        parse: parseUrlsFromStylesheet,
        get,
        set,
    })

    const links = parsedStylesheetView.map(tokenView => ({
        get target() { return tokenView.token },
        set target(newUrl) { tokenView.token = newUrl },
        get absoluteTarget() {
            const target = tokenView.token
            return new URL(target, baseUrl).href
        },
        get isSubresource() { return tokenView.note.isSubresource },
        get subresourceType() { return tokenView.note.subresourceType },

        get from() {
            const index = tokenView.index
            return {
                range: [index, index + tokenView.token.length],
            }
        },
    }))

    return links
}

export function parseUrlsFromStylesheet(stylesheetText) {
    // TODO replace regex-based extractor with actual CSS parser.
    const cssExtractUrlPattern = /(url\s*\(\s*('|")?\s*)([^"')]+?)\s*\2\s*\)/i
    // TODO capture @import and @font-face statements

    const urls = []
    let remainder = stylesheetText
    let remainderIndex = 0
    while (remainder.length > 0) {
        const match = remainder.match(cssExtractUrlPattern)
        if (!match) break

        const url = match[3]
        urls.push({
            token: url,
            index: remainderIndex + match.index + match[1].length,
            note: {
                isSubresource: true, // each URL in a stylesheet defines a subresource
                subresourceType: 'image', // or 'font' or 'style' (for @import)
            },
        })
        const charactersSeen = match.index + match[0].length
        remainder = remainder.slice(charactersSeen, )
        remainderIndex += charactersSeen
    }
    return urls
}
