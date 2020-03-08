import { memoizeOne, postcss, postCssValuesParser } from '../package'

import tryParseUrl from './try-parse-url'
import { deepSyncingProxy, transformingCache } from './parse-tools'
import { postcssValuesParser } from 'postcss-values-parser' // seems needed to get the namespace..
import { CssLink, CssStyleLink, CssFontLink, CssImageLink, UrlString } from './types'

/**
 * Extract links from a stylesheet.
 * @param {Object} parsedCss - An AST as produced by postcss.parse()
 * @param {string} baseUrl - the absolute URL for interpreting any relative URLs in the stylesheet.
 * @returns {Object[]} The extracted links. Each link provides a live, editable view on one URL
 * inside the stylesheet.
 */
export function extractLinksFromCss(parsedCss: postcss.Root, baseUrl: UrlString): CssLink[] {
    const links: CssLink[] = []

    // Grab all @import urls
    parsedCss.walkAtRules('import', atRule => {
        let valueAst: postcssValuesParser.Node
        try {
            valueAst = postCssValuesParser(atRule.params).parse()
        } catch (err) {
            return // We ignore values we cannot parse.
        }

        let maybeUrlNode: postcssValuesParser.Node | undefined
        const firstNode = valueAst.nodes[0].nodes[0]
        if (firstNode.type === 'string') {
            maybeUrlNode = firstNode
        }
        else if (firstNode.type === 'func' && firstNode.value === 'url') {
            const argument = firstNode.nodes[1] // nodes[0] is the opening parenthesis.
            if (argument.type === 'string' || argument.type === 'word') {
                maybeUrlNode = argument // For either type, argument.value is our URL.
            }
        }

        if (maybeUrlNode) {
            const urlNode = maybeUrlNode
            const link: CssStyleLink = {
                get target() { return urlNode.value },
                set target(newUrl) {
                    urlNode.value = newUrl
                    atRule.params = valueAst.toString()
                },
                get absoluteTarget() {
                    return tryParseUrl(this.target, baseUrl)
                },
                get isSubresource() { return true as true },
                get subresourceType() { return 'style' as 'style' },
                get from() {
                    // TODO combine atRule.source.start.{line|column} with urlNode.sourceIndex
                    // But.. those numbers are not updated when the AST is mutated. Hopeless.
                    // (if urlNode.type === 'string', offset by 1 to account for the quote)
                    return {}
                },
            }
            links.push(link)
        }
    })

    // Grab every url(...) inside a property value; also gets those within @font-face.
    parsedCss.walkDecls(decl => {
        // TODO Possible future optimisation: only parse props known to allow a URL.
        let valueAst: postcssValuesParser.Node
        try {
            valueAst = postCssValuesParser(decl.value).parse()
        } catch (err) {
            return // We ignore values we cannot parse.
        }

        valueAst.walk(functionNode => { // walkFunctionNodes seems broken? Testing manually then.
            if (functionNode.type !== 'func') return
            if (functionNode.value !== 'url') return

            let subresourceType: 'font' | 'image'
            if (
                decl.prop === 'src'
                && decl.parent.type === 'atrule'
                && decl.parent.name === 'font-face'
            ) {
                subresourceType = 'font'
            } else {
                // As far as I know, all other props that can contain a url specify an image.
                subresourceType = 'image'
            }

            const argument = functionNode.nodes[1] // nodes[0] is the opening parenthesis.
            if (argument.type === 'string' || argument.type === 'word') {
                const urlNode = argument // For either type, argument.value is our URL.

                const link: CssFontLink | CssImageLink = {
                    get target() { return urlNode.value },
                    set target(newUrl) {
                        urlNode.value = newUrl
                        decl.value = valueAst.toString()
                    },
                    get absoluteTarget() {
                        return tryParseUrl(this.target, baseUrl)
                    },
                    get isSubresource() { return true as true },
                    get subresourceType() { return subresourceType },
                    get from() {
                        // TODO combine decl.source.start.{line|column} with urlNode.sourceIndex
                        // But.. those numbers are not updated when the AST is mutated. Hopeless.
                        // (if urlNode.type === 'string', offset by 1 to account for the quote)
                        return {}
                    },
                }
                links.push(link)
            }
        })
    })

    return links
}

/**
 * Create a live&editable view on the links in a stylesheet.
 * @param options
 * @param {() => string} options.get - getter to obtain the current content of the stylesheet. This
 * may be called many times, so keep it light; e.g. just reading a variable or style attribute.
 * @param {string => void} options.set - setter that is called, whenever a link is modified, with
 * the new value of the whole stylesheet.
 * @param {string} options.baseUrl - the absolute URL for interpreting any relative URLs in the
 * stylesheet.
 */
export function extractLinksFromCssSynced({
    get: getCssString,
    set: setCssString,
    baseUrl
}: {
    get: () => string,
    set: (value: string) => void,
    baseUrl: UrlString,
}): CssLink[] {
    // We run two steps: string to AST to links; each getter is cached. Changes to links will
    // update the AST automatically, but we do have to write back the AST to the string.
    // cssString <===|===> parsedCss <------|===> links
    //            set|get             mutate|get

    // Wrap get and set so we can get and set the AST directly, without reparsing when unnecessary.
    const { get: getParsedCss, set: setParsedCss } = transformingCache<string, postcss.Root>({
        get: getCssString,
        set: setCssString,
        transform: cssString => postcss.parse(cssString),
        untransform: parsedCss => parsedCss.toResult().css,
    })

    // Memoise, such that when we get the AST from cache, we get the extracted links from cache too.
    const memoizedExtractLinksFromCss = memoizeOne(extractLinksFromCss)

    // Make a proxy so that `links` is always up-to-date and its modifications are written back.
    // For the curious: note that wrapping {get,set}parsedCss in a deepSyncingProxy would not work:
    // access to its members would be wrapped, but a method like walkAtRules would not wrap the
    // arguments to its callback, so operations performed on them would not be noticed. Therefore,
    // we manually remember currentParsedCss and set() it whenever (any member of) the links object
    // has been operated on.
    let currentParsedCss: postcss.Root | null
    const links: CssLink[] = deepSyncingProxy<CssLink[]>({
        get: () => {
            try {
                currentParsedCss = getParsedCss()
            } catch (err) {
                // Corrupt CSS is treated as containing no links at all.
                currentParsedCss = null
                return []
            }
            return memoizedExtractLinksFromCss(currentParsedCss, baseUrl)
        },
        set: links => {
            // No need to use the given argument; any of links's setters will have already updated
            // the AST (i.e. currentParsedCss), so that is the thing we have to sync now.
            if (currentParsedCss !== null) {
                setParsedCss(currentParsedCss)
            }
        },
    })
    return links
}
