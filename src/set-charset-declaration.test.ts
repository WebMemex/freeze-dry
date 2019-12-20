import setCharsetDeclaration from './set-charset-declaration'

describe('setCharsetDeclaration', () => {
    test('should prepend a charset declaration if absent', () => {
        const doc = window.document.implementation.createHTMLDocument()
        doc.head.innerHTML = `
            <meta name="author" content="somebody">
        `

        setCharsetDeclaration(doc, 'utf-32')

        expect(omitWhitespace(doc.head.innerHTML)).toEqual(omitWhitespace(`
            <meta charset="utf-32">
            <meta name="author" content="somebody">
        `))
    })

    test('should replace an existing charset declaration', () => {
        const doc = window.document.implementation.createHTMLDocument()
        doc.head.innerHTML = `
            <meta charset="utf-16">
            <meta name="author" content="somebody">
        `
        setCharsetDeclaration(doc, 'utf-32')

        expect(omitWhitespace(doc.head.innerHTML)).toEqual(omitWhitespace(`
            <meta charset="utf-32">
            <meta name="author" content="somebody">
        `))
    })

    test('should remove the charset declaration if the value is empty', () => {
        const doc = window.document.implementation.createHTMLDocument()
        doc.head.innerHTML = `
            <meta charset="utf-16">
            <meta name="author" content="somebody">
        `

        setCharsetDeclaration(doc, '')

        expect(omitWhitespace(doc.head.innerHTML)).toEqual(omitWhitespace(`
            <meta name="author" content="somebody">
        `))

    })

    test('should remove superfluous declarations', () => {
        const doc = window.document.implementation.createHTMLDocument()
        doc.head.innerHTML = `
            <meta charset="utf-16">
            <meta charset="utf-invalid">
            <meta name="author" content="somebody">
            <meta charset="more-bogus-charset-elements">
        `

        setCharsetDeclaration(doc, 'utf-8')

        expect(omitWhitespace(doc.head.innerHTML)).toEqual(omitWhitespace(`
            <meta charset="utf-8">
            <meta name="author" content="somebody">
        `))
    })
})

// As a crude approximation to canonicalise an html string, just remove all whitespace.
function omitWhitespace(string) {
    return string.replace(/\W/g, '')
}
