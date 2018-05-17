/* eslint-env jest */

import setContentSecurityPolicy from './set-content-security-policy'

const policyDirectives = [
    "default-src 'none'",
    "img-src data:",
    "style-src data: 'unsafe-inline'",
    "font-src data:",
]
const cspString = policyDirectives.join('; ')

describe('setContentSecurityPolicy', () => {
    test('should insert <meta> element at beginning of <head>', () => {
        const doc = window.document.implementation.createHTMLDocument()
        setContentSecurityPolicy({doc, policyDirectives})
        expect(doc.querySelector('meta').getAttribute('http-equiv')).toBe('Content-Security-Policy')
        expect(doc.querySelector('meta').content).toBe(cspString)
    })

    test('should replace existing CSPs', () => {
        const doc = window.document.implementation.createHTMLDocument()
        doc.head.innerHTML = `
            <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
            <meta http-equiv="Content-Security-Policy" content="img-src example.com">
        `

        setContentSecurityPolicy({doc, policyDirectives})

        expect(doc.querySelectorAll('meta').length).toBe(1)
        expect(doc.querySelector('meta').content).toBe(cspString)
    })

    test('should remove URL-containing attributes coming before the CSP', () => {
        const doc = window.document.implementation.createHTMLDocument()
        doc.documentElement.setAttribute('manifest', '/manifest.appcache')
        doc.head.setAttribute('profile', 'http://some-profile-uri-whatever-that-means')

        setContentSecurityPolicy({doc, policyDirectives})

        expect(doc.documentElement.hasAttribute('manifest')).toBe(false)
        expect(doc.head.hasAttribute('profile')).toBe(false)
    })
})
