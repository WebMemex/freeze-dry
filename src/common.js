import responseToDataUrl from 'response-to-data-url'
import whenAllSettled from 'when-all-settled'
import { blobToDataURL } from 'blob-util'


export function removeNode(node) {
    node.parentNode.removeChild(node)
}

export async function fetchSubresource(url) {
    // TODO investigate whether we should supply origin, credentials, perhaps
    // use content.fetch (in Firefox extensions), etcetera.
    const response = await self.fetch(url, {
        cache: 'force-cache',
        redirect: 'follow',
    })
    return response
}

export async function stringToDataUrl(string, type='text/plain') {
    // Using self.btoa is faster but fails for unicode strings.
    const blob = new Blob([string], {type})
    const dataUrl = await blobToDataURL(blob)
    return dataUrl
}

export async function urlToDataUrl(url) {
    try {
        const response = await fetchSubresource(url)
        const dataUrl = await responseToDataUrl(response)
        return dataUrl
    } catch (err) {
        return 'about:invalid'
    }
}

// Find all URLs in the specified attribute(s) of the specified elements, fetch
// their contents, and replace the URL with the content encoded as a data URL.
// The elements argument can be a query selector string if rootElement is given.
export async function inlineUrlsInAttributes({
    elements,
    attributes,
    // Default case: the value is a single URL (e.g. for href, src, ...)
    attrToUrls = (value, attribute) => [value],
    fixIntegrity = false,
    rootElement,
    baseURI,
}) {
    attributes = Array.isArray(attributes) ? attributes : [attributes]
    if (typeof elements === 'string') {
        elements = rootElement.querySelectorAll(elements)
    }
    // For each element...
    const jobsForElements = Array.from(elements).map(async element => {
        // ...for each listed attribute...
        const jobsForAttributes = attributes.map(async attribute => {
            // ...read the URL or URLs to be replaced.
            const value = element.getAttribute(attribute)
            if (!value) return

            // Read the URL or URLs from the attribute value
            const urls = attrToUrls(value, attribute)

            // Fetch (hopefully from cache) the resource for each URL.
            const dataUrlPs = urls.map(async url => {
                const absoluteUrl = new URL(url, baseURI || element.baseURI)
                const dataUrl = await urlToDataUrl(absoluteUrl)
                return dataUrl
            })
            const dataUrls = await Promise.all(dataUrlPs)

            // Replace the URLs in the attribute value with the data URLs.
            let newValue = value
            for (let i = 0; i < urls.length; i++) {
                newValue = newValue.replace(urls[i], dataUrls[i])
            }
            if (newValue !== value) {
                element.setAttribute(attribute, newValue)

                // Remember the original attribute value (the original URL)
                const originalAttribute = `data-original-${attribute}`
                if (!element.hasAttribute(originalAttribute)) {
                    // (if already set, we presume fixLinks did this, and leave it as is)
                    element.setAttribute(originalAttribute, value)
                }
            }
            if (fixIntegrity) {
                // Don't bother recomputing the hash, just remove the check.
                element.removeAttribute('integrity')
            }
        })
        await whenAllSettled(jobsForAttributes)
    })
    await whenAllSettled(jobsForElements)
}
