import whenAllSettled from 'when-all-settled'
import documentOuterHTML from 'document-outerhtml'

import inlineStyles from './inline-styles'
import removeScripts from './remove-scripts'
import removeNoscripts from './remove-noscripts'
import inlineImages from './inline-images'
import setContentSecurityPolicy from './set-content-security-policy'
import fixLinks from './fix-links'
import getBaseURI from './util/get-base-uri'


export default async function freezeDry (
    document = window.document,
    docUrl,
) {
    // Clone the document
    const doc = document.cloneNode(/* deep = */ true)

    // If docUrl was specified to override document.URL, and there is no <base href="..."> tag, use
    // docUrl as the base URI for expanding all relative URLs.
    // XXX If baseURI gets set, xml:base attributes will be ignored; might this affect some SVGs?
    const baseURI = docUrl !== undefined
        ? getBaseURI(doc, docUrl)
        : undefined // functions will read the correct value from <node>.baseURI.

    const rootElement = doc.documentElement

    // Make all relative URLs absolute.
    fixLinks({rootElement, baseURI})

    // Inline subresources
    const asyncJobs = [
        inlineStyles({rootElement, baseURI}),
        inlineImages({rootElement, baseURI}),
    ]
    await whenAllSettled(asyncJobs)

    // Removing scripts should be superfluous when setting the CSP; but it helps to protect
    // pre-CSP viewers, it saves space, and reduces error messages in the console.
    removeScripts({rootElement})

    removeNoscripts({rootElement}) // Because our CSP might cause <noscript> content to show.

    setContentSecurityPolicy({
        doc,
        policyDirectives: [
            "default-src 'none'", // Block any connectivity from media we did not deal with.
            "img-src data:", // Allow inlined images.
            "style-src data: 'unsafe-inline'", // Allow inlined styles.
            "font-src data:", // Allow inlined fonts.
        ],
    })

    // Return the resulting DOM as a string
    const html = documentOuterHTML(doc)
    return html
}
