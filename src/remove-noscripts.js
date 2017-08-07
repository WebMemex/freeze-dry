import { removeNode } from './common.js'


/**
* Removes all <noscript> elements in rootElement.
* 
* @param {HTMLElement} rootElement - root document for the function
*/
export default function removeNoscripts({rootElement}) {
    const scripts = Array.from(rootElement.querySelectorAll('noscript'))
    scripts.forEach(removeNode)
}
