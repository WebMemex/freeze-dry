import removeScripts from './remove-scripts.js'

/**
 * Remove interactivity from a document.
 * @param {Document} doc - the Document to be modified.
 * @returns nothing; doc is mutated.
 */
export default function makeDomStatic(doc) {
    // Remove all javascript.
    removeScripts(doc.documentElement)

    // If noscript content was not shown, we do not want it to show in the snapshot either. Also, we
    // capture pages after scripts executed (presumably), so noscript content is likely undesired.
    // TODO We should know whether noscript content was visible, and if so keep it in the doc.
    // TODO Keep noscript content in fetched iframe docs, as scripts have not been executed there?
    const noscripts = Array.from(doc.querySelectorAll('noscript'))
    noscripts.forEach(element => element.parentNode.removeChild(element))

    // Disable editing on editable elements
    const editableElements = Array.from(doc.querySelectorAll('*[contenteditable]'))
    editableElements.forEach(element => {
        element.contentEditable = 'false'
        // TODO Reapply any style rules that matched only when contenteditable was set.
        // (perhaps set data-original-contenteditable, and clone any such rules accordingly?)
    })

    // TODO any other changes we may want to consider? Disable form inputs? Disable links that were
    // javascript triggers only? Disable CSS hover interactions?
}
