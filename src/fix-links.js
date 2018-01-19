/**
* Replace anchor links(eg. <a href="#home">Home</a>) with their absolute URL if head element is not present. 
* If head element is present it prepends a <base> element containing the URL of the document in the head.
* 
* @param {HTMLElement} rootElement - root of the tree of elements to be processed
* @param {string} docUrl - document url of the page
*/
export default async function fixLinks({rootElement, docUrl}) {
    const head = rootElement.querySelector('head')
    if (head) {
        const base = head.ownerDocument.createElement('base')
        base.href = docUrl
        head.insertAdjacentElement('afterbegin', base)
    } else {
        const links = Array.from(rootElement.querySelectorAll('*[href]'))
        links.forEach(link => {
            const href = link.getAttribute('href')
            const absoluteUrl = new URL(href, docUrl)
            if (href !== absoluteUrl) {
                link.setAttribute('href', absoluteUrl)
            }
        })
        // TODO rewrite other attributes than href (see http://stackoverflow.com/a/2725168)
    }
}
