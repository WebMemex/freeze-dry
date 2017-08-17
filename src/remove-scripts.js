import { removeNode } from './common.js'


/**
* Removes all <script> elements in rootElement.
* 
* @param {HTMLElement} rootElement - root of the tree of elements to be processed
*/
export function removeScriptElements({rootElement}) {
    const scripts = Array.from(rootElement.querySelectorAll('script'))
    scripts.forEach(removeNode)
}

/**
* Removes event handlers (onclick, onload, etcetera) from rootElement and all elements it contains.
* 
* @param {HTMLElement} rootElement - root of the tree of elements to be processed
*/
export function removeEventHandlers({rootElement}) {
    const elements = Array.from(rootElement.querySelectorAll('*'))
    elements.forEach(element => {
        // A crude approach: any attribute starting with 'on' is removed.
        Array.from(element.attributes)
            .filter(attribute => attribute.name.startsWith('on'))
            .forEach(attribute => {
                element.removeAttribute(attribute.name)
            })
    })
}

/**
* Disables all links with a 'javascript:' href.
* 
* @param {HTMLElement} rootElement - root of the tree of elements to be processed
*/
export function removeJavascriptHrefs({rootElement}) {
    const elements = Array.from(rootElement.querySelectorAll('*[href^="javascript:"]'))
    elements.forEach(element => {
        // We should keep some href value there to not change the link's appearance, but it should
        // not be resolvable. So just keep the 'javascript:' there, for lack of better idea.
        element.setAttribute('href', 'javascript:')
    })
}

/**
* Tries to remove all kinds of scripts contained in the given rootElement.
* 
* @param {HTMLElement} rootElement - root of the tree of elements to be processed
*/
export default async function removeScripts({rootElement}) {
    removeScriptElements({rootElement})
    removeEventHandlers({rootElement})
    removeJavascriptHrefs({rootElement})
}
