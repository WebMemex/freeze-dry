import { removeScripts } from './remove-scripts'
import type { GlobalConfig } from '../../types'

export  { removeScripts }

/**
 * Remove interactivity from a document.
 *
 * @param doc - The Document to be modified.
 * @returns Nothing; the Document is mutated.
 *
 * @category Util
 */
export function makeDomStatic(doc: Document, config: GlobalConfig = {}) {
    removeScripts(doc, config)

    // If noscript content was not shown, we do not want it to show in the snapshot either. Also, we
    // capture pages after scripts executed (presumably), so noscript content is likely undesired.
    // TODO We should know whether noscript content was visible, and if so keep it in the doc.
    // TODO Keep noscript content in fetched iframe docs, as scripts have not been executed there?
    removeNoscript(doc)

    // Disable editing on editable elements
    removeContentEditable(doc, config)

    // TODO any other changes we may want to consider? Disable form inputs? Disable links that were
    // javascript triggers only? Disable CSS hover interactions?
}

/**
 * Remove any `<noscript>` tags from the document.
 *
 * @param doc - The Document to be modified.
 *
 * @category Util
 */
export function removeNoscript(doc: Document) {
    const noscripts = Array.from(doc.querySelectorAll('noscript'))
    noscripts.forEach(element => element.parentNode?.removeChild(element))
}

/**
 * Disable editing on editable elements.
 *
 * @param doc - The Document to be modified.
 *
 * @category Util
 */
export function removeContentEditable(doc: Document, config: GlobalConfig = {}) {
    const glob = config.glob || globalThis
    const editableElements = Array.from(doc.querySelectorAll('*[contenteditable]'))
        .filter((element: Element): element is HTMLElement => element instanceof glob.HTMLElement)
    editableElements.forEach(element => {
        element.contentEditable = 'false'
        // TODO Reapply any style rules that matched only when contenteditable was set.
        // (perhaps set data-original-contenteditable, and clone any such rules accordingly?)
    })
}
