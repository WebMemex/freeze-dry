import tryParseUrl from './try-parse-url.js'

/**
 * Equivalent to reading doc.baseURI, except that the document's URL can be overridden.
 * @param {Document} doc - the HTML document.
 * @param {string} [docUrl] - the absolute URL of the document itself. Defaults to doc.URL.
 * @returns {string} The absolute URL that is the base URL of the document.
 */
export default function getBaseUrl(doc, docUrl = doc.URL) {
    const baseEl = doc.querySelector('base[href]')
    if (baseEl) {
        // Interpret the base href relative to the document URL
        const baseUrl = tryParseUrl(baseEl.getAttribute('href'), docUrl)
        if (baseUrl) {
            return baseUrl
        }
    }

    // Tricky cases that would need more scrutiny, and I see no use case for.
    // See https://www.w3.org/TR/2017/REC-html52-20171214/infrastructure.html#urls-terminology
    // if (docUrl === 'about:srcdoc') {
    //     return doc.defaultView.parent.document.baseURI
    // }
    // if (docUrl === 'about:blank') {
    //     // document.referrer?
    // }

    // The document's URL is the base URI.
    return docUrl
}
