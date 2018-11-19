import makeDomStatic from './index.js'

function makeExampleDoc() {
    const html = `<html>
        <head>
            <noscript><meta something></noscript>
        </head>
        <body>
            <noscript>Your browser does not support JavaScript.</noscript>
            <div id="editor" contenteditable>An editable div</div>
        </body>
    </html>`
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    return doc
}

describe('makeDomStatic', () => {
    test('should remove all <noscript> elements from the document', () => {
        const doc = makeExampleDoc()

        makeDomStatic(doc)

        expect(doc.querySelector('noscript')).toBeNull()
    })

    // Cannot run this test because HTMLElement.{c|isC}ontentEditable is not implemented in jsdom.
    // (see <https://github.com/jsdom/jsdom/issues/1670>)
    // test('should disable contentEditable', () => {
    //     const doc = makeExampleDoc()
    //     const div = doc.getElementById('editor')
    //     expect(div.isContentEditable).toEqual(true)
    //
    //     makeDomStatic(doc)
    //
    //     expect(div.isContentEditable).toEqual(false)
    // })
})
