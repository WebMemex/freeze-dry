/**
* Puts the given CSP directives into a <meta> tag of the given document.
* 
* @param {HTMLElement} doc - document for the function
* @param {string} policyDirectives - policy directives for the page
*/
export default function setContentSecurityPolicy({doc, policyDirectives}) {
    // Ensure a head element exists.
    if (!doc.head) {
        const head = doc.createElement('head')
        doc.documentElement.insertAdjacentElement('afterbegin', head)
    }

    // Disallow any sources, except data URLs where we use them.
    const csp = policyDirectives.join('; ')

    const metaEl = doc.createElement('meta')
    metaEl.setAttribute('http-equiv', 'Content-Security-Policy')
    metaEl.setAttribute('content', csp)
    doc.head.insertAdjacentElement('afterbegin', metaEl)
}
