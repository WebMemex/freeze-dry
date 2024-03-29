import tryParseUrl from './try-parse-url'
import type { UrlString } from '../../types'

/**
 * Equivalent to reading `doc.baseURI`, except that the document’s URL can be overridden.
 *
 * @param doc - The HTML document.
 * @param docUrl - The absolute URL of the document itself. Defaults to `doc.URL`.
 * @returns The absolute URL that is the base URL of the document.
 */
export default function getBaseUrl(
    doc: Document,
    docUrl: UrlString = (doc.URL as UrlString)
): UrlString {
    const baseEl = doc.querySelector('base[href]')
    if (baseEl) {
        // Interpret the base href relative to the document URL
        const baseHref = baseEl.getAttribute('href')
        if (baseHref !== null) {
            const baseUrl = tryParseUrl(baseHref, docUrl)
            if (baseUrl) {
                return baseUrl
            }
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
