// Lists of html attributes that can contain one or more URLs.

import tryParseUrl from '../try-parse-url'
import { splitByWhitespace, splitByComma, splitByCommaPickFirstTokens } from './split-token-list'
import { omit } from './util'
import type { UrlString } from '../../../types'
import type { AttributeInfo, AttributeInfoDict } from './types'

// Default properties for the attributes listed below.
const defaultItem: Omit<AttributeInfo, 'attribute'> = {
    // attribute: (no default value, required)
    elements: ['*'],
    parse: value => {
        // Default is to expect a single URL (+ possibly whitespace).
        const url = value.trim()
        if (url.length === 0) return []
        const index = value.indexOf(url[0]!) // probably 0; otherwise the number of leading spaces.
        return [ { token: url, index } ]
    },
    isSubresource: false,
    subresourceType: undefined,
    makeAbsolute(
        url,
        element,
        // We allow the caller to override the document's URL and base URL.
        baseUrl = element.baseURI as UrlString,
        documentURL = (element.ownerDocument !== null)
            ? element.ownerDocument.URL as UrlString
            : undefined,
    ) {
        // Normally, the URL is simply relative to the document's base URL.
        return tryParseUrl(url, baseUrl)
    },
}

// Helper for URL attributes that are defined to be relative to the element's 'codebase' attribute.
const makeAbsoluteUsingCodebase: AttributeInfo['makeAbsolute'] = (url, element, ...etc) => {
    // Read the value of the codebase attribute, and turn it into an absolute URL.
    const codebaseValue = element.getAttribute('codebase')
    if (codebaseValue) {
        const [ codebaseUrlLocation ] = html40.codebase.parse(codebaseValue)
        if (codebaseUrlLocation) {
            const codebaseUrl = codebaseUrlLocation.token
            const codebaseAbsoluteUrl = html40.codebase.makeAbsolute(codebaseUrl, element, ...etc)
            return tryParseUrl(url, codebaseAbsoluteUrl)
        }
    }
    // If there is no (valid) codebase attribute, interpret relative URLs as usual.
    return defaultItem.makeAbsolute(url, element, ...etc)
}

// HTML 4.0
// Mostly derived from https://www.w3.org/TR/REC-html40/index/attributes.html
export const html40: AttributeInfoDict<
    | 'action'
    | 'applet_archive'
    | 'object_archive'
    | 'background'
    | 'cite'
    | 'classid'
    | 'codebase'
    | 'data'
    | 'href'
    | 'link_icon_href'
    | 'link_stylesheet_href'
    | 'longdesc'
    | 'profile'
    | 'img_src'
    | 'frame_src'
    | 'script_src'
    | 'param_ref_value'
    | 'meta_refresh_content'
> = {
    action: {
        ...defaultItem,
        attribute: 'action',
        elements: ['form'],
    },
    applet_archive: {
        ...defaultItem,
        attribute: 'archive',
        elements: ['applet'],
        parse: splitByComma,
        isSubresource: true,
        // subresourceType? No idea.
        makeAbsolute: makeAbsoluteUsingCodebase,
        // See https://www.w3.org/TR/REC-html40/struct/objects.html#adef-archive-APPLET
    },
    object_archive: {
        ...defaultItem,
        attribute: 'archive',
        elements: ['object'],
        parse: splitByWhitespace,
        isSubresource: true,
        // subresourceType? No idea.
        makeAbsolute: makeAbsoluteUsingCodebase,
        // See https://www.w3.org/TR/REC-html40/struct/objects.html#adef-archive-OBJECT
    },
    background: {
        ...defaultItem,
        attribute: 'background',
        elements: ['body'],
        isSubresource: true,
        subresourceType: 'image',
    },
    cite: {
        ...defaultItem,
        attribute: 'cite',
        elements: ['blockquote', 'q', 'del', 'ins'],
    },
    classid: {
        ...defaultItem,
        attribute: 'classid',
        elements: ['object'],
        isSubresource: true, // I guess?
        // subresourceType? No idea.
        makeAbsolute: makeAbsoluteUsingCodebase,
    },
    codebase: {
        ...defaultItem,
        attribute: 'codebase',
        elements: ['object', 'applet'],
    },
    data: {
        ...defaultItem,
        attribute: 'data',
        elements: ['object'],
        isSubresource: true,
        subresourceType: 'object',
        makeAbsolute: makeAbsoluteUsingCodebase,
        // See https://www.w3.org/TR/REC-html40/struct/objects.html#adef-data
    },
    href: {
        ...defaultItem,
        attribute: 'href',
        elements: ['a', 'area', 'base', 'link:not([rel~=icon i]):not([rel~=stylesheet i])'],
        // Note: some links are resources, see below.
    },
    link_icon_href: {
        ...defaultItem,
        attribute: 'href',
        elements: ['link[rel~=icon i]'],
        isSubresource: true,
        subresourceType: 'image',
    },
    link_stylesheet_href: {
        ...defaultItem,
        attribute: 'href',
        elements: ['link[rel~=stylesheet i]'],
        isSubresource: true,
        subresourceType: 'style',
    },
    longdesc: {
        ...defaultItem,
        attribute: 'longdesc',
        elements: ['img', 'frame', 'iframe'],
    },
    profile: {
        ...defaultItem,
        attribute: 'profile',
        elements: ['head'],
    },
    img_src: {
        ...defaultItem,
        attribute: 'src',
        elements: ['img', 'input[type=image i]'],
        isSubresource: true,
        subresourceType: 'image',
    },
    frame_src: {
        ...defaultItem,
        attribute: 'src',
        elements: ['frame', 'iframe'],
        isSubresource: true,
        subresourceType: 'document',
    },
    script_src: {
        ...defaultItem,
        attribute: 'src',
        elements: ['script'],
        isSubresource: true,
        subresourceType: 'script',
    },
    // It seems usemap can only contain within-document URLs; hence omitting it from this list.
    // usemap: {
    //     ...defaultItem,
    //     attribute: 'usemap',
    //     elements: ['img', 'input', 'object'],
    // },

    // Some attributes that are not listed as Type=%URI in
    // <https://www.w3.org/TR/REC-html40/index/attributes.html>, but seem to belong here.
    param_ref_value: {
        ...defaultItem,
        attribute: 'value',
        elements: ['param[valuetype=ref i]'],
        // Note: "The URI must be passed to the object as is, i.e., unresolved."
        // See https://www.w3.org/TR/REC-html40/struct/objects.html#adef-valuetype
    },
    meta_refresh_content: {
        ...defaultItem,
        attribute: 'content',
        elements: ['meta[http-equiv=refresh i]'],
        parse: value => {
            // Example: <meta http-equiv="refresh" content="2; url=http://www.example.com">
            // To match many historical syntax variations, we try to follow whatwg's algorithm.
            // See <https://html.spec.whatwg.org/multipage/semantics.html#shared-declarative-refresh-steps>
            const match = value.match(/^(\s*[\d.]+\s*[;,\s]\s*(?:url\s*=\s*)?('|")?\s*)(.+)/i)

            if (!match) return [] // Probably a normal refresh that stays on the same page.

            // If the URL was preceded by a quote, truncate it at the next quote.
            const quote = match[2]!
            let url = match[3]!
            if (quote && url.includes(quote)) {
                url = url.slice(0, url.indexOf(quote))
            }

            const index = match[1]!.length
            url = url.trim() // url could not start with whitespace, so index remains correct.
            return [{ token: url, index }]
        },
    },
}

// HTML 5.2.
// Derived from https://www.w3.org/TR/2017/REC-html52-20171214/fullindex.html#attributes-table
export const html52: AttributeInfoDict<
| 'action'
| 'cite'
| 'href'
| 'link_icon_href'
| 'link_stylesheet_href'
| 'img_src'
| 'script_src'
| 'meta_refresh_content'
| 'data'
| 'formaction'
| 'longdesc'
| 'manifest'
| 'poster'
| 'audio_src'
| 'embed_src'
| 'frame_src'
| 'track_src'
| 'video_src'
| 'srcset'
> = {
    action: html40.action,
    cite: html40.cite,
    data: {
        ...html40.data,
        makeAbsolute: defaultItem.makeAbsolute, // html5 drops the codebase attribute
    },
    formaction: {
        ...defaultItem,
        attribute: 'formaction',
        elements: ['button', 'input'],
    },
    href: html40.href,
    // See https://www.w3.org/TR/2017/REC-html52-20171214/links.html#sec-link-types
    link_icon_href: html40.link_icon_href,
    link_stylesheet_href: html40.link_stylesheet_href,
    longdesc: {
        ...html40.longdesc, // minus frame/iframe
        elements: ['img'],
    },
    manifest: {
        // Note: manifest is deprecated.
        ...defaultItem,
        attribute: 'manifest',
        elements: ['html'],
        isSubresource: true,
        // subresourceType? Maybe 'manifest'? Confusion with <link rel=manifest>
        makeAbsolute(
            url,
            element,
            _,
            documentURL = (element.ownerDocument !== null)
                ? element.ownerDocument.URL as UrlString
                : undefined,
        ) {
            // The manifest is not influenced by a <base href="..."> tag.
            return tryParseUrl(url, documentURL)
        },
    },
    poster: {
        ...defaultItem,
        attribute: 'poster',
        elements: ['video'],
        isSubresource: true,
        subresourceType: 'image',
    },
    audio_src: {
        ...defaultItem,
        attribute: 'src',
        elements: ['audio', 'audio>source'],
        isSubresource: true,
        subresourceType: 'audio',
    },
    embed_src: {
        ...defaultItem,
        attribute: 'src',
        elements: ['embed'],
        isSubresource: true,
        subresourceType: 'embed',
    },
    frame_src: {
        ...html40.frame_src, // minus the <frame> element
        elements: ['iframe'],
    },
    img_src: html40.img_src,
    script_src: html40.script_src,
    track_src: {
        ...defaultItem,
        attribute: 'src',
        elements: ['track'],
        isSubresource: true,
        subresourceType: 'track',
    },
    video_src: {
        ...defaultItem,
        attribute: 'src',
        elements: ['video', 'video>source'],
        isSubresource: true,
        subresourceType: 'video',
    },
    srcset: {
        ...defaultItem,
        attribute: 'srcset',
        elements: ['img', 'picture>source'],
        // Example: <img srcset="http://image 2x, http://other-image 1.5x" ...>
        // TODO implement more sophisticated srcset parsing.
        // See https://html.spec.whatwg.org/multipage/images.html#parsing-a-srcset-attribute
        parse: splitByCommaPickFirstTokens,
        isSubresource: true,
        subresourceType: 'image',
    },

    // Not listed in the attributes index, but seems to belong here.
    meta_refresh_content: html40.meta_refresh_content,
}

// WHATWG as of 2018-04-20
// https://html.spec.whatwg.org/multipage/indices.html#attributes-3 of 2018-04-20
export const whatwg: AttributeInfoDict<
| 'action'
| 'cite'
| 'href'
| 'link_icon_href'
| 'link_stylesheet_href'
| 'img_src'
| 'script_src'
| 'meta_refresh_content'
| 'data'
| 'formaction'
| 'manifest'
| 'poster'
| 'audio_src'
| 'embed_src'
| 'frame_src'
| 'track_src'
| 'video_src'
| 'srcset'
| 'itemprop'
| 'itemtype'
| 'itemid'
| 'ping'
> = {
    // Includes all of HTML 5.2 except longdesc
    ...omit(html52, ['longdesc']),

    itemprop: {
        // Microdata's itemprop can contain absolute URLs, used as identifiers.
        // See https://html.spec.whatwg.org/multipage/microdata.html#names:-the-itemprop-attribute
        ...defaultItem,
        attribute: 'itemprop',
        parse: value => {
            return splitByWhitespace(value)
                .filter(({ token }) => token.includes(':')) // tokens without colon are property names.
        },
        // May only contain absolute URLs, so we merely check whether they are valid URLs.
        makeAbsolute: url => tryParseUrl(url),
    },
    itemtype: {
        // Note: "Except if otherwise specified by that specification, the URLs given as the item
        // types should not be automatically dereferenced."
        // See https://html.spec.whatwg.org/multipage/microdata.html#attr-itemtype
        ...defaultItem,
        attribute: 'itemtype',
        parse: splitByWhitespace,
        // May only contain absolute URLs, so we merely check whether they are valid URLs.
        makeAbsolute: url => tryParseUrl(url),
    },
    itemid: {
        ...defaultItem,
        attribute: 'itemid',
    },
    ping: {
        ...defaultItem,
        attribute: 'ping',
        elements: ['a', 'area'],
    },
}

// Notes to self about link types that declare external resources.
// Regarding link types in the WHATWG spec:
//   The preloading-related links might be nice to archive if we start supporting scripts: we
//   could hardcode their URL:value combination into an injected fetch replacement function.
//   Preloading relation types: modulepreload, preconnect, prefetch, preload, prerender
//   Another type: dns-prefetch; Seems even further off, does not actually load any resource.
//   Also, rel=pingback is listed as an external resource link. No idea why.
//   See https://html.spec.whatwg.org/multipage/links.html#linkTypes
// Other:
//   A few other possibly interesting link relation types to external resources.
//   (hand-picked from <http://microformats.org/wiki/index.php?title=existing-rel-values&oldid=66721>)
//   apple-touch-icon / apple-touch-icon-precomposed / apple-touch-startup-image
//   enclosure (similar to prefetch etc?)
//   pgpkey / publickey
