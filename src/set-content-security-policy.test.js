/* eslint-env jest */

import setContentSecurityPolicy from './set-content-security-policy'


describe('setContentSecurityPolicy', () => {
    test('should insert <meta> element at beginning of <head>', () => {
        const policyDirectives = [
            "default-src 'none'",
            "img-src data:",
            "style-src data: 'unsafe-inline'",
            "font-src data:",
        ]
        const csp = policyDirectives.join('; ')
        const doc = window.document.implementation.createHTMLDocument()
        setContentSecurityPolicy({doc, policyDirectives})
        expect(doc.querySelector('meta').getAttribute('http-equiv')).toBe('Content-Security-Policy')
        expect(doc.querySelector('meta').content).toBe(csp)
    })
})
