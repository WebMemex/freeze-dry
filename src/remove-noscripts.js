import { removeNode } from './common.js'


/**
* Removes all <noscript> elements in rootElement.
* 
* @param {HTMLElement} rootElement - root of the tree of elements to be processed
*/
export default function removeNoscripts({rootElement}) {
    const scripts = Array.from(rootElement.querySelectorAll('noscript'))
    scripts.forEach(removeNode)
}
