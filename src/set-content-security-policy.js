import { removeNode } from './common'

// Puts the given CSP directives into a <meta> tag of the given document.
export default function setContentSecurityPolicy({doc, policyDirectives}) {
    // Ensure a head element exists.
    if (!doc.head) {
        const head = doc.createElement('head')
        doc.documentElement.insertAdjacentElement('afterbegin', head)
    }

    const csp = policyDirectives.join('; ')

    // Remove any existing CSPs (relevant for idempotency; i.e. snapshotting a snapshot)
    const existingCsps = doc.head.querySelectorAll('meta[http-equiv=Content-Security-Policy i]')
    existingCsps.forEach(element => removeNode(element))

    const metaEl = doc.createElement('meta')
    metaEl.setAttribute('http-equiv', 'Content-Security-Policy')
    metaEl.setAttribute('content', csp)
    doc.head.insertAdjacentElement('afterbegin', metaEl)
}
