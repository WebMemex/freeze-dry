// A list of html attributes that can contain a URL, and tools to extract the URLs.

const _splitByRegex = regex => value => {
    const urls = []
    let remainder = value
    let remainderIndex = 0
    while (remainder.length > 0) {
        const match = remainder.match(regex)
        // No check for match===null needed; the regexes given below produce a match on any string.
        const leadingWhitespace = match[1]
        const url = match[2]
        if (url.length > 0) { // I suppose we can simply omit empty (= invalid?) tokens..
            urls.push({
                url,
                index: remainderIndex + leadingWhitespace.length,
            })
        }
        remainder = remainder.slice(match[0].length,)
        remainderIndex += match[0].length
    }
    return urls
}

// Split by whitespace, return values and their indices
// E.g. 'aaa bbb' => [{ url: 'aaa', index: 0 }, { url: 'bbb', index: 4 }]
const splitByWhitespace = _splitByRegex(/^(\s*)([^]*?)(\s*)(\s|$)/)

// Split string by commas, strip whitespace, and return the index of every found url.
// E.g. splitByComma('aaa, bbb') === [{ url: 'aaa', index: 0 }, { url: 'bbb', index: 5 }]
const splitByComma = _splitByRegex(/^(\s*)([^]*?)(\s*)(,|$)/)

// Split by commas, then split each token by whitespace and only keep the first piece.
// E.g. 'aaa bbb, ccc' => [{ url: 'aaa', index: 0 }, { url: 'ccc', index: 9 }]
// Used for parsing srcset: <img srcset="http://image 2x, http://other-image 1.5x" ...>
const splitByCommaPickFirstTokens = _splitByRegex(/^(\s*)(\S*)([^]*?)(,|$)/)

// XXX Only exported for tests
export { splitByComma, splitByWhitespace }


// Default properties for the attributes listed below.
const defaultItem = {
    // attribute: (required)
    element: '*',
    // Default is to expect a single URL (+ possibly whitespace).
    parse: value => {
        const url = value.trim()
        if (url.length === 0) return []
        const index = value.indexOf(url[0]) // probably 0; otherwise the number of leading spaces.
        return [ { url, index } ]
    },
    isResource: false,
    // TODO relativeTo: node.baseURI
}

// HTML 4.0
// Mostly derived from https://www.w3.org/TR/REC-html40/index/attributes.html
const html40 = {
    action: {
        ...defaultItem,
        attribute: 'action',
        element: ['form'],
    },
    archive_applet: {
        ...defaultItem,
        attribute: 'archive',
        element: ['applet'],
        parse: splitByComma,
        isResource: true,
        // TODO relativeTo: codebase attribute
        // See https://www.w3.org/TR/REC-html40/struct/objects.html#adef-archive-APPLET
    },
    archive_object: {
        ...defaultItem,
        attribute: 'archive',
        element: ['object'],
        parse: splitByWhitespace,
        isResource: true,
        // TODO relativeTo: codebase attribute
        // See https://www.w3.org/TR/REC-html40/struct/objects.html#adef-archive-OBJECT
    },
    background: {
        ...defaultItem,
        attribute: 'background',
        element: ['body'],
        isResource: true,
    },
    cite: {
        ...defaultItem,
        attribute: 'cite',
        element: ['blockquote', 'q', 'del', 'ins'],
    },
    classid: {
        ...defaultItem,
        attribute: 'classid',
        element: ['object'],
        isResource: true, // I guess?
        // TODO relativeTo: codebase attribute
    },
    codebase: {
        ...defaultItem,
        attribute: 'codebase',
        element: ['object', 'applet'],
    },
    data: {
        ...defaultItem,
        attribute: 'data',
        element: ['object'],
        isResource: true,
        // TODO relativeTo: codebase attribute
        // See https://www.w3.org/TR/REC-html40/struct/objects.html#adef-data
    },
    href: {
        ...defaultItem,
        attribute: 'href',
        element: ['a', 'area', 'base', 'link'],
        // Note: some links are resources, see below.
    },
    _resourceLinks: {
        // Links can be external resources, depending on their relation type.
        // Note: overlaps with href above.
        ...defaultItem,
        attribute: 'href',
        element: ['link[rel~=icon i]', 'link[rel~=stylesheet i]'],
        isResource: true,
    },
    longdesc: {
        ...defaultItem,
        attribute: 'longdesc',
        element: ['img', 'frame', 'iframe'],
        isResource: true,
    },
    profile: {
        ...defaultItem,
        attribute: 'profile',
        element: ['head'],
    },
    src: {
        ...defaultItem,
        attribute: 'src',
        element: ['script', 'input', 'frame', 'iframe', 'img'],
        isResource: true,
    },
    // It seems usemap can only contain within-document URIs; hence omitting it from this list.
    // usemap: {
    //     ...defaultItem,
    //     attribute: 'usemap',
    //     element: ['img', 'input', 'object'],
    // },

    // Some attributes that are not listed as Type=%URI in
    // <https://www.w3.org/TR/REC-html40/index/attributes.html>, but seem to belong here.
    param_ref_value: {
        ...defaultItem,
        attribute: 'value',
        element: ['param[valuetype=ref i]'],
        // Note: "The URI must be passed to the object as is, i.e., unresolved."
        // See https://www.w3.org/TR/REC-html40/struct/objects.html#adef-valuetype
        // Note: not listed as Type=%URI in https://www.w3.org/TR/REC-html40/index/attributes.html
        // (as it contains only a URI if the valuetype equals "ref")
    },
    meta_refresh_content: {
        ...defaultItem,
        attribute: 'content',
        element: ['meta[http-equiv=refresh i]'],
        parse: value => {
            // Example: <meta http-equiv="refresh" content="2; url=http://www.example.com">
            // Note: there seem to be various syntax 'variations', we probably do not support all.
            // See for a discussion: http://www.otsukare.info/2015/03/26/refresh-http-header
            // See also: https://html.spec.whatwg.org/multipage/semantics.html#attr-meta-http-equiv-refresh
            const match = value.match(/^(\s*[\d\.]+\s*[;,]?\s*url\s*=\s*('|")?)(\S+)\2/i)
            if (!match) return [] // Probably a normal refresh that stays on the same page.
            return [{
                url: match[3],
                index: match[1].length,
            }]
        },
    }
}

// HTML 5.2.
// Derived from https://www.w3.org/TR/2017/REC-html52-20171214/fullindex.html#attributes-table
const html52 = {
    action: html40.action,
    cite: html40.cite,
    data: {
        ...defaultItem,
        attribute: 'data',
        element: ['object'],
        isResource: true,
    },
    formaction: {
        ...defaultItem,
        attribute: 'formaction',
        element: ['button', 'input'],
    },
    href: html40.href,
    // See https://www.w3.org/TR/2017/REC-html52-20171214/links.html#sec-link-types
    _resourceLinks: html40._resourceLinks,
    longdesc: {
        ...html40.longdesc, // minus frame/iframe
        element: ['img'],
    },
    manifest: {
        ...defaultItem,
        attribute: 'manifest',
        element: ['html'],
        isResource: true,
        // TODO relativeTo: document.URL (should not be influenced by a <base href>)
        // (manifest is deprecated anyhow)
    },
    poster: {
        ...defaultItem,
        attribute: 'poster',
        element: ['video'],
        isResource: true,
    },
    src: {
        ...html40.src, // minus <frame>, plus some new elements.
        element: ['audio', 'embed', 'iframe', 'img', 'input', 'script', 'source', 'track', 'video'],
    },
    srcset: {
        ...defaultItem,
        attribute: 'srcset',
        element: ['img', 'source'],
        // Example: <img srcset="http://image 2x, http://other-image 1.5x" ...>
        parse: splitByCommaPickFirstTokens,
        isResource: true,
    },

    // Not listed in the attributes index, but seems to belong here.
    meta_refresh_content: html40.meta_refresh_content,
}

// WHATWG as of 2018-04-20
// https://html.spec.whatwg.org/multipage/indices.html#attributes-3 of 2018-04-20
const whatwg = {
    // Includes all of HTML 5.2 except longdesc
    ...html52,
    longdesc: undefined,

    itemprop: {
        // Microdata's itemprop can contain absolute URLs, used as identifiers.
        // See https://html.spec.whatwg.org/multipage/microdata.html#names:-the-itemprop-attribute
        ...defaultItem,
        attribute: 'itemprop',
        parse: value => {
            return splitByWhitespace(value)
                .filter(({ url }) => url.includes(':')) // tokens without colon are property names.
        },
        // TODO relativeTo: always absolute
    },
    itemtype: {
        // "Except if otherwise specified by that specification, the URLs given as the item types
        // should not be automatically dereferenced."
        // Can only contain absolute urls.
        ...defaultItem,
        attribute: 'itemtype',
        parse: splitByWhitespace,
        // TODO relativeTo: always absolute
    },
    itemid: {
        ...defaultItem,
        attribute: 'itemid',
        // can be relative URL
    },
    ping: {
        ...defaultItem,
        attribute: 'ping',
        element: ['a', 'area'],
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


export { html40, html52, whatwg }
