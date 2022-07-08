import type { GlobalConfig } from '../types'

/**
 * Remove all scripts contained in the given Document/Element.
 *
 * @param docOrElement - The Document or Element to remove scripts from.
 * @returns Nothing; the document/element contents are mutated.
 */
export default function removeScripts(
    docOrElement: Element | Document,
    config: GlobalConfig = {},
) {
    const rootElement = 'documentElement' in docOrElement
        ? docOrElement.documentElement
        : docOrElement

    removeScriptElements(rootElement)
    removeEventHandlers(rootElement)
    removeJavascriptHrefs(rootElement, config)
}

/**
 * Remove all `<script>` elements in `rootElement`.
 */
function removeScriptElements(rootElement: Element) {
    const scripts = Array.from(rootElement.querySelectorAll('script'))
    scripts.forEach(element => element.parentNode?.removeChild(element))
}

/**
 * Remove event handlers (`onclick`, `onload`, etc.) from `rootElement` and all elements it
 * contains.
 */
function removeEventHandlers(rootElement: Element) {
    const elements = Array.from(rootElement.querySelectorAll('*'))
    elements.forEach(element => {
        // A crude approach: any attribute starting with 'on' is removed.
        Array.from(element.attributes)
            .filter(attribute => attribute.name.toLowerCase().startsWith('on'))
            .forEach(attribute => {
                element.removeAttribute(attribute.name)
            })
    })
}

/**
 * Disable all links whose `href` starts with `javascript:`.
 *
 * To not change the link’s appearance, but without any action when clicked, the `href` attribute
 * is set to `'javascript:'` (for lack of a better idea).
 */
function removeJavascriptHrefs(rootElement: Element, config: GlobalConfig = {}) {
    const glob = config.glob || globalThis
    const linkElements = Array.from(rootElement.querySelectorAll('a, area'))
        .filter(element => element instanceof glob.HTMLElement) as Array<HTMLAnchorElement | HTMLAreaElement>
    linkElements
        // Note `href` gives the serialised URL, so the scheme is already lowercased and trimmed.
        // See https://html.spec.whatwg.org/multipage/links.html#dom-hyperlink-href
        .filter(element => element.href.startsWith('javascript:'))
        .forEach(element => {
            element.setAttribute('href', 'javascript:')
        })
}
