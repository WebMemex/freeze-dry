/**
 * Puts the given CSP directives into a <meta> tag of the given document.
 * @param {Document} doc - the Document to be modified.
 * @param {string} csp - the desired value of the Content Security Policy.
 * @returns nothing; doc is mutated.
 */
export default function setContentSecurityPolicy(doc, csp) {
    // Ensure a head element exists.
    if (!doc.head) {
        const head = doc.createElement('head')
        doc.documentElement.insertBefore(head, doc.documentElement.firstChild)
    }

    // Remove any existing CSPs (relevant for idempotency; i.e. snapshotting a snapshot)
    const existingCsps = doc.head.querySelectorAll('meta[http-equiv=Content-Security-Policy i]')
    existingCsps.forEach(element => element.parentNode.removeChild(element))

    // Insert a <meta> tag with the CSP at the start of the <head>
    const cspMetaEl = doc.createElement('meta')
    cspMetaEl.setAttribute('http-equiv', 'Content-Security-Policy')
    cspMetaEl.setAttribute('content', csp)
    doc.head.insertBefore(cspMetaEl, doc.head.firstChild)

    // Move the <meta charset> element (if any) in front of the CSP, to do our best effort to keep
    // it within the first 1024 bytes of html (as MDN recommends, see
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#attr-charset as of June 2018)
    const querySelector = 'meta[charset], meta[http-equiv=Content-Type i]'
    const charsetMetaEl = doc.head.querySelector(querySelector)
    if (charsetMetaEl) {
        doc.head.insertBefore(charsetMetaEl, cspMetaEl)
    }

    // Remove any resource references that come before the CSP; TODO investigate necessity.
    // Remove <html>'s manifest attribute (HTML 5). Something we would probably want to do anyhow.
    doc.documentElement.removeAttribute('manifest')
    // Remove <head>'s profile attribute (HTML 4). I would be surprised if any browsers resolve
    // this URL, but staying on the safe side for now (possibly at the cost of metadata semantics).
    doc.head.removeAttribute('profile')
}
