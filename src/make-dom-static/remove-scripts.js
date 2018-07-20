/**
 * Tries to remove all kinds of scripts contained in the given rootElement.
 * @param {Element} rootElement
 * @returns nothing; rootElement is mutated.
 */
export default function removeScripts(rootElement) {
    removeScriptElements(rootElement)
    removeEventHandlers(rootElement)
    removeJavascriptHrefs(rootElement)
}

// Removes all <script> elements in rootElement.
function removeScriptElements(rootElement) {
    const scripts = Array.from(rootElement.querySelectorAll('script'))
    scripts.forEach(element => element.parentNode.removeChild(element))
}

// Removes event handlers (onclick, onload, etcetera) from rootElement and all elements it contains.
function removeEventHandlers(rootElement) {
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

// Disables all links with a 'javascript:' href.
function removeJavascriptHrefs(rootElement) {
    const linkElements = Array.from(rootElement.querySelectorAll('a, area'))
    linkElements
        .filter(element => element.href.startsWith('javascript:'))
        // .filter(element => element.getAttribute('href').trim().toLowerCase().startsWith('javascript:'))
        .forEach(element => {
            // We should keep some href value there to not change the link's appearance, but it
            // should not be resolvable. Keeping the 'javascript:' there, for lack of a better idea.
            element.setAttribute('href', 'javascript:')
        })
}
