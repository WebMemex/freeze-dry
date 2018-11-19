import setContentSecurityPolicy from './index.js'

const csp = `default-src 'none'; img-src data:`

describe('setContentSecurityPolicy', () => {
    test('should insert <meta> element after the charset declaration', () => {
        const doc = window.document.implementation.createHTMLDocument()
        doc.head.innerHTML = `
            <meta charset="utf-8">
            <link rel="icon" href="/icon.png">
        `

        setContentSecurityPolicy(doc, csp)

        const element = doc.head.children[1]
        expect(element.tagName).toMatch(/meta/i)
        expect(element.getAttribute('http-equiv')).toEqual('Content-Security-Policy')
        expect(element.getAttribute('content')).toEqual(csp)
    })

    test('should replace existing CSPs', () => {
        const doc = window.document.implementation.createHTMLDocument()
        doc.head.innerHTML = `
            <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
            <meta http-equiv="Content-Security-Policy" content="img-src example.com">
        `

        setContentSecurityPolicy(doc, csp)

        expect(doc.querySelectorAll('meta').length).toEqual(1)
        expect(doc.querySelector('meta').content).toEqual(csp)
    })

    test('should remove URL-containing attributes coming before the CSP', () => {
        const doc = window.document.implementation.createHTMLDocument()
        doc.documentElement.setAttribute('manifest', '/manifest.appcache')
        doc.head.setAttribute('profile', 'http://some-profile-uri-whatever-that-means')

        setContentSecurityPolicy(doc, csp)

        expect(doc.documentElement.hasAttribute('manifest')).toEqual(false)
        expect(doc.head.hasAttribute('profile')).toEqual(false)
    })
})
