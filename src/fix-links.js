export default async function fixLinks({rootElement, baseURI}) {
    const links = Array.from(rootElement.querySelectorAll('*[href]'))
    links.forEach(link => {
        const href = link.getAttribute('href')

        if (href.startsWith('#')) {
            // Leave within-document links unchanged.
            // TODO consider doing this only if the target is within rootElement.
            return
        }

        const absoluteUrl = new URL(href, baseURI || link.baseURI)
        if (href !== absoluteUrl) {
            link.setAttribute('href', absoluteUrl)
            link.setAttribute(`data-original-href`, href)
        }
    })
    // TODO rewrite other attributes than href (see http://stackoverflow.com/a/2725168)
}
