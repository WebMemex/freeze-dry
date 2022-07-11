/**
 * Add or replace the `<meta charset="...">` element at the start of the Document’s `<head>`
 * element.
 *
 * @param doc - The Document to add the element to.
 * @param charsetDeclaration - The character set name (usually `'utf-8'`).
 * @returns Nothing; the document is mutated.
 *
 * @category Util
 */
export function setCharsetDeclaration(doc: Document, charsetDeclaration: string | null) {
    // Ensure a head element exists.
    if (!doc.head) {
        const head = doc.createElement('head')
        doc.documentElement.insertBefore(head, doc.documentElement.firstChild)
    }

    // Remove any existing <meta charset> elements
    const existingElements = doc.head.querySelectorAll('meta[charset]')
    existingElements.forEach(element => element.parentNode?.removeChild(element))

    // Create a new <meta charset> element if a value for it has been given.
    if (charsetDeclaration !== null && charsetDeclaration !== '') {
        const metaEl = doc.createElement('meta')
        metaEl.setAttribute('charset', charsetDeclaration)
        doc.head.insertBefore(metaEl, doc.head.firstChild)
    }
}
