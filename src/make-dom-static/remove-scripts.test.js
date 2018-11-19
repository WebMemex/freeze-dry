import removeScripts from './remove-scripts.js'

describe('removeScripts', () => {
    test('should remove script tags from the document', () => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(
            `<head><script>alert('spam')</script></head>`,
            'text/html'
        )
        const rootElement = doc.documentElement

        removeScripts(rootElement)

        expect(rootElement.getElementsByTagName('script').length).toEqual(0)
    })

    test('should remove "on" handlers', () => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(
            '<div onmouseover="handler()" OnClick="handler()"></div>',
            'text/html'
        )
        const rootElement = doc.documentElement

        removeScripts(rootElement)

        expect(rootElement.querySelector('div').attributes.length).toEqual(0)
    })

    test('should remove scripts in javascript: links', () => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(
            `<a href=" javascript: alert('spam')">spam</a>`,
            'text/html'
        )
        const rootElement = doc.documentElement

        removeScripts(rootElement)

        expect(rootElement.querySelector('a').href).toEqual('javascript:')
    })
})
