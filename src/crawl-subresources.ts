import { whenAllSettled, postcss, documentOuterHTML } from './package'

import { extractLinksFromDom, extractLinksFromCss } from './extract-links/index'
import { Resource, UrlString } from './types/index'
import { Link, SubresourceLink } from './extract-links/types'

/**
 * Recursively fetch the subresources of a DOM resource.
 * @param {Object} resource - the resource object representing the DOM with its subresources.
 * @param {Function} [options.fetchResource] - custom function for fetching resources; should be
 * API-compatible with the global fetch(), but may also return { blob, url } instead of a Response.
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

async function crawlSubresources(links, options) {
  await whenAllSettled(links.map(link => crawlSubresource(link, options)))
}

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

async function crawlLeafSubresource(link: SubresourceLink, options) {
    const fetchedResource = await fetchSubresource(link, options)
    link.resource = {
        url: fetchedResource.url,
        blob: fetchedResource.blob,
        links: [],
    }
}

async function crawlFrame(link, options) {
    // Maybe this link already has a resource: we try to capture (i)frame content in captureDom().
    if (!link.resource) {
        // Apparently we could not capture the frame's DOM in the initial step. To still do the best
        // we can, we fetch and parse the framed document's html source and work with that.
        const fetchedResource = await fetchSubresource(link, options)
        const html = await blobToText(fetchedResource.blob)
        const parser = new DOMParser()
        const innerDoc = parser.parseFromString(html, 'text/html')
        // Note that the final URL may differ from link.absoluteTarget in case of redirects.
        const innerDocUrl = fetchedResource.url

        // Create a mutable resource for this frame, similar to the resource captureDom() returns.
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
    const fetchedResource = await fetchSubresource(link, options)
    // Note that the final URL may differ from link.absoluteTarget in case of redirects.
    const stylesheetUrl = fetchedResource.url
    const originalStylesheetText = await blobToText(fetchedResource.blob)

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

async function fetchSubresource(link: SubresourceLink, options): Promise<{ url: UrlString, blob: Blob }> {
    if (link.absoluteTarget === undefined) {
        throw new Error(`Cannot fetch invalid target: ${link.target}`)
    }
    const url = link.absoluteTarget

    const fetchFunction = options.fetchResource || self.fetch
    // TODO investigate whether we should supply origin, credentials, ...
    const resourceOrResponse = await fetchFunction(url, {
        cache: 'force-cache',
        redirect: 'follow',
    })
    const resource = {
        // If we got a Response, we wait for the content to arrive.
        blob: typeof resourceOrResponse.blob === 'function'
            ? await resourceOrResponse.blob()
            : resourceOrResponse.blob,
        // Read the final URL of the resource (after any redirects).
        url: resourceOrResponse.url,
    }
    return resource
}

async function blobToText(blob: Blob): Promise<string> {
    const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsText(blob) // TODO should we know&tell which encoding to use?
    })
    return text
}
