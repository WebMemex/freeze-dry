import whenAllSettled from 'when-all-settled'
import documentOuterHTML from 'document-outerhtml'
import postcss from 'postcss'

import { extractLinksFromDom, extractLinksFromCss } from './extract-links'

/**
 * Recursively fetch the subresources of a DOM resource.
 * @param {Object} resource - the resource object representing the DOM with its subresources.
 * @param {Function} options.fetchResource - function API compatible with fetch (default) for fetching resources.
 * @returns nothing; subresources are stored in the links of the given resource.
 */
async function crawlSubresourcesOfDom(resource, options) {
    const supportedSubresourceTypes = ['image', 'document', 'style', 'video', 'font']

    // TODO Avoid fetching all resolutions&formats of the same image/video?
    const linksToCrawl = resource.links
        .filter(link => link.isSubresource)
        .filter(link => supportedSubresourceTypes.includes(link.subresourceType))

    // Start recursively and concurrently crawling the resources.
    await crawlSubresources(linksToCrawl, options)
}
export default crawlSubresourcesOfDom

async function crawlSubresource(link, options) {
    const crawlers = {
        image: crawlLeafSubresource, // Images cannot have subresources (actually, SVGs can! TODO)
        document: crawlFrame,
        style: crawlStylesheet,
        video: crawlLeafSubresource, // Videos cannot have subresources (afaik; maybe they can?)
        font: crawlLeafSubresource, // Fonts cannot have subresources (afaik; maybe they can?)
    }
    const crawler = crawlers[link.subresourceType]
    if (crawler === undefined) {
        throw new Error(`Not sure how to crawl subresource of type ${link.subresourceType}`)
    }
    await crawler(link, options)
}

function crawlSubresources(links, options) {
  return whenAllSettled(links.map(link => crawlSubresource(link, options)))
}

async function crawlLeafSubresource(link, options) {
    const response = await fetchSubresource(link.absoluteTarget, options)
    const blob = await response.blob()
    link.resource = {
        url: response.url, // may differ from link.absoluteTarget in case of redirects.
        blob,
        links: [],
    }
}

async function crawlFrame(link, options) {
    // Maybe this link already has a resource: we try to capture (i)frame content in captureDom().
    if (!link.resource) {
        // Apparently we could not capture the frame's DOM in the initial step. To still do the best
        // we can, we fetch and parse the framed document's html source and work with that.
        const response = await fetchSubresource(link.absoluteTarget, options)
        const html = await response.text()
        const parser = new DOMParser()
        const innerDoc = parser.parseFromString(html, 'text/html')
        const innerDocUrl = response.url // may differ from link.absoluteTarget in case of redirects

        // Create a resource object for this frame, similar to the resource captureDom() returns.
        const innerDocResource = {
            url: innerDocUrl,
            doc: innerDoc,
            get blob() { return new Blob([this.string], { type: 'text/html' }) },
            get string() {
                // TODO Add <meta charset> if absent? Or html-encode characters as needed?
                return documentOuterHTML(innerDoc)
            },
            links: extractLinksFromDom(innerDoc, { docUrl: innerDocUrl }),
        }

        link.resource = innerDocResource
    }

    await crawlSubresourcesOfDom(link.resource, options)
}

async function crawlStylesheet(link, options) {
    const response = await fetchSubresource(link.absoluteTarget, options)
    const stylesheetUrl = response.url // may differ from link.absoluteTarget in case of redirects.
    const originalStylesheetText = await response.text()

    let links
    let getCurrentStylesheetText
    try {
        const parsedCss = postcss.parse(originalStylesheetText)
        links = extractLinksFromCss(parsedCss, stylesheetUrl)
        getCurrentStylesheetText = () => parsedCss.toResult().css
    } catch (err) {
        // CSS is corrupt. Pretend there are no links.
        links = []
        getCurrentStylesheetText = () => originalStylesheetText
    }

    const stylesheetResource = {
        url: stylesheetUrl,
        get blob() { return new Blob([this.string], { type: 'text/css' }) },
        get string() { return getCurrentStylesheetText() },
        links,
    }

    link.resource = stylesheetResource

    // Recurse to crawl the subresources of this stylesheet.
    await crawlSubresources(stylesheetResource.links, options)
}

async function fetchSubresource(url, {fetchResource}) {
    // TODO investigate whether we should supply origin, credentials, perhaps
    // use content.fetch (in Firefox extensions), etcetera.
    const response = await fetchResource(url, {
        cache: 'force-cache',
        redirect: 'follow',
    })
    return response
}
