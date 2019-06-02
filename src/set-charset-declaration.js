/**
 * Add or replace the <meta charset="..."> element at the start of the
 * Document's <head> element.
 * @param {Document} doc - The Document to add tags to.
 * @param {string} charsetDeclaration - the character set name (usually 'utf8')
 * @returns nothing; doc is mutated.
 */
export default function setCharsetDeclaration(doc, charsetDeclaration) {
    // Ensure a head element exists.
    if (!doc.head) {
        const head = doc.createElement('head')
        doc.documentElement.insertBefore(head, doc.documentElement.firstChild)
    }

    // Remove any existing <meta charset> elements
    const existingElements = doc.head.querySelectorAll('meta[charset i]')
    existingElements.forEach(element => element.parentNode.removeChild(element))

    // Create a new <meta charset> element if a value for it has been given.
    if (charsetDeclaration !== '') {
        const metaEl = doc.createElement('meta')
        metaEl.setAttribute('charset', charsetDeclaration)
        doc.head.insertBefore(metaEl, doc.head.firstChild)
    }
}
