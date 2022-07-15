import { memoizeOne, postcss, postCssValuesParser } from '../../package'

import tryParseUrl from './try-parse-url'
import { deepSyncingProxy, transformingCache } from './parse-tools'
import type { postcssValuesParser } from 'postcss-values-parser'
import type { AtRule, Root } from 'postcss'
import type { UrlString } from '../../types'
import type { CssLink, CssStyleLink, CssFontLink, CssImageLink } from './types'

/**
 * Find all links in a parsed stylesheet.
 *
 * @param parsedCss - An AST as produced by `postcss.parse()`
 * @param baseUrl - the absolute URL for interpreting any relative URLs in the stylesheet.
 * @returns The found links. Each {@link Link} provides a live, editable view on one URL inside
 * the stylesheet.
 */
export function findLinksInCss(parsedCss: Root, baseUrl: UrlString): CssLink[] {
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
        const firstNode = valueAst.nodes[0]?.nodes[0]
        if (!firstNode) return
        if (firstNode.type === 'string') {
            maybeUrlNode = firstNode
        }
        else if (firstNode.type === 'func' && firstNode.value === 'url') {
            const argument = firstNode.nodes[1] // nodes[0] is the opening parenthesis.
            if (!argument) return
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
                && decl.parent?.type === 'atrule'
                && (decl.parent as AtRule).name === 'font-face'
            ) {
                subresourceType = 'font'
            } else {
                // As far as I know, all other props that can contain a url specify an image.
                subresourceType = 'image'
            }

            const argument = functionNode.nodes[1] // nodes[0] is the opening parenthesis.
            if (argument === undefined) return
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

    // TODO also grab URLs in the @namespace at-rule.

    return links
}

/**
 * Create a live & editable view on the links in a stylesheet.
 *
 * Conceptually, the stylesheet is a mutable string. Because strings are not mutable, this function
 * takes a getter and a setter method that it uses to read and write the string.
 *
 * @example
 * const linksInStyleAttribute = findLinksInCssSynced({
 *   get: () => element.getAttribute('style'),
 *   set: newValue => { element.setAttribute('style', newValue) },
 *   baseUrl: element.baseURI as UrlString,
 * })
 *
 * @param options.get - Getter to obtain the current content of the stylesheet. This may be called
 * many times, so keep it light; e.g. just reading a variable or style attribute.
 * @param options.set - Setter that is called, whenever a link is modified, with the new value of
 * the whole stylesheet.
 * @param options.baseUrl - The absolute URL for interpreting any relative URLs in the stylesheet.
 */
export function findLinksInCssSynced({
    get: getCssString,
    set: setCssString,
    baseUrl,
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
    const { get: getParsedCss, set: setParsedCss } = transformingCache<string, Root>({
        get: getCssString,
        set: setCssString,
        transform: cssString => postcss.parse(cssString),
        untransform: parsedCss => parsedCss.toResult().css,
    })

    // Memoise, such that when we get the AST from cache, we get the found links from cache too.
    const memoizedfindLinksInCss = memoizeOne(findLinksInCss)

    // Make a proxy so that `links` is always up-to-date and its modifications are written back.
    // For the curious: note that wrapping {get,set}parsedCss in a deepSyncingProxy would not work:
    // access to its members would be wrapped, but a method like walkAtRules would not wrap the
    // arguments to its callback, so operations performed on them would not be noticed. Therefore,
    // we manually remember currentParsedCss and set() it whenever (any member of) the links object
    // has been operated on.
    let currentParsedCss: Root | null
    const links: CssLink[] = deepSyncingProxy<CssLink[]>({
        get: () => {
            let parsedCss
            try {
                parsedCss = getParsedCss()
            } catch (err) {
                // Corrupt CSS is treated as containing no links at all.
                currentParsedCss = null
                return []
            }
            currentParsedCss = parsedCss
            return memoizedfindLinksInCss(parsedCss, baseUrl)
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
