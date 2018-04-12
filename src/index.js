import whenAllSettled from 'when-all-settled'
import documentOuterHTML from 'document-outerhtml'

import inlineStyles from './inline-styles'
import removeScripts from './remove-scripts'
import removeNoscripts from './remove-noscripts'
import inlineImages from './inline-images'
import setContentSecurityPolicy from './set-content-security-policy'
import fixLinks from './fix-links'


export default async function freezeDry (
    document = window.document,
    docUrl = document.URL,
) {
    // Clone the document
    const doc = document.cloneNode(/* deep = */ true)

    const rootElement = doc.documentElement
    const jobs = [
        // Removing scripts should be superfluous when setting the CSP; but it helps to protect
        // pre-CSP viewers, it saves space, and reduces error messages in the console.
        removeScripts({rootElement}),
        inlineStyles({rootElement, docUrl}),
        inlineImages({rootElement, docUrl}),
        fixLinks({rootElement, docUrl}),
        setContentSecurityPolicy({
            doc,
            policyDirectives: [
                "default-src 'none'", // Block any connectivity from media we did not deal with.
                "img-src data:", // Allow inlined images.
                "style-src data: 'unsafe-inline'", // Allow inlined styles.
                "font-src data:", // Allow inlined fonts.
            ],
        }),
        removeNoscripts({rootElement}), // Because our CSP might cause <noscript> content to show.
    ]
    await whenAllSettled(jobs)

    // Return the resulting DOM as a string
    const html = documentOuterHTML(doc)
    return html
}
