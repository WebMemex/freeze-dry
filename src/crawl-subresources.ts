import { postcss, documentOuterHTML } from './package'

import { extractLinksFromDom, extractLinksFromCss } from './extract-links/index'
import { UrlString, DomResource, StylesheetResource, GlobalConfig } from './types'
import { Link, SubresourceLink, HtmlDocumentLink, CssLink } from './extract-links/types'
import { SubresourceType } from './extract-links/url-attributes/types'

type CrawlSubresourcesConfig = Pick<GlobalConfig, 'fetchResource' | 'glob'>
type LinkCrawlerFunction = (link: SubresourceLink, config: CrawlSubresourcesConfig) => Promise<void>

/**
 * Recursively fetch the subresources of a DOM resource.
 * @param {Object} resource - the resource object representing the DOM with its subresources.
 * @param {Function} [config.fetchResource] - custom function for fetching resources; should be
 * API-compatible with the global fetch(), but may also return { blob, url } instead of a Response.
 * @returns nothing; subresources are stored in the links of the given resource.
 */
async function crawlSubresourcesOfDom(resource: DomResource, config: CrawlSubresourcesConfig) {
    const supportedSubresourceTypes: Array<String | undefined>
        = ['image', 'document', 'style', 'video', 'font']

    // TODO Avoid fetching all resolutions&formats of the same image/video?
    const linksToCrawl: SubresourceLink[] = resource.links
        .filter((link: Link): link is SubresourceLink => link.isSubresource)
        .filter(link => supportedSubresourceTypes.includes(link.subresourceType))

    // Start recursively and concurrently crawling the resources.
    await crawlSubresources(linksToCrawl, config)
}
export default crawlSubresourcesOfDom

async function crawlSubresources(links: SubresourceLink[], config: CrawlSubresourcesConfig) {
    await Promise.allSettled(links.map(link => crawlSubresource(link, config)))
}

async function crawlSubresource(link: SubresourceLink, config: CrawlSubresourcesConfig) {
    const crawlers: { [Key in SubresourceType]?: LinkCrawlerFunction } = {
        image: crawlLeafSubresource, // Images cannot have subresources (actually, SVGs can! TODO)
        document: crawlFrame,
        style: crawlStylesheet,
        video: crawlLeafSubresource, // Videos cannot have subresources (afaik; maybe they can?)
        font: crawlLeafSubresource, // Fonts cannot have subresources (afaik; maybe they can?)
    }
    const crawler = link.subresourceType && crawlers[link.subresourceType]
    if (crawler === undefined) {
        throw new Error(`Not sure how to crawl subresource of type ${link.subresourceType}`)
    }
    await crawler(link, config)
}

async function crawlLeafSubresource(link: SubresourceLink, config: CrawlSubresourcesConfig) {
    const fetchedResource = await fetchSubresource(link, config)
    link.resource = {
        url: fetchedResource.url,
        blob: fetchedResource.blob,
        links: [],
    }
}

async function crawlFrame(link: HtmlDocumentLink, config: CrawlSubresourcesConfig) {
    // Maybe this link already has a resource: we try to capture (i)frame content in captureDom().
    if (!link.resource) {
        // Apparently we could not capture the frame's DOM in the initial step. To still do the best
        // we can, we fetch and parse the framed document's html source and work with that.
        const fetchedResource = await fetchSubresource(link, config)
        const html = await blobToText(fetchedResource.blob, config)
        const parser = new config.glob.DOMParser()
        const innerDoc = parser.parseFromString(html, 'text/html')
        // Note that the final URL may differ from link.absoluteTarget in case of redirects.
        const innerDocUrl = fetchedResource.url

        // Create a mutable resource for this frame, similar to the resource captureDom() returns.
        const innerDocResource: DomResource = {
            url: innerDocUrl,
            doc: innerDoc,
            get blob() { return new config.glob.Blob([this.string], { type: 'text/html' }) },
            get string() {
                // TODO Add <meta charset> if absent? Or html-encode characters as needed?
                return documentOuterHTML(innerDoc)
            },
            links: extractLinksFromDom(innerDoc, { docUrl: innerDocUrl }),
        }

        link.resource = innerDocResource
    }

    await crawlSubresourcesOfDom(link.resource, config)
}

async function crawlStylesheet(link: SubresourceLink, config: CrawlSubresourcesConfig) {
    const fetchedResource = await fetchSubresource(link, config)
    // Note that the final URL may differ from link.absoluteTarget in case of redirects.
    const stylesheetUrl = fetchedResource.url
    const originalStylesheetText = await blobToText(fetchedResource.blob, config)

    let links: CssLink[]
    let getCurrentStylesheetText: () => string
    try {
        const parsedCss = postcss.parse(originalStylesheetText)
        links = extractLinksFromCss(parsedCss, stylesheetUrl)
        getCurrentStylesheetText = () => parsedCss.toResult().css
    } catch (err) {
        // CSS is corrupt. Pretend there are no links.
        links = []
        getCurrentStylesheetText = () => originalStylesheetText
    }

    const stylesheetResource: StylesheetResource = {
        url: stylesheetUrl,
        get blob() { return new config.glob.Blob([this.string], { type: 'text/css' }) },
        get string() { return getCurrentStylesheetText() },
        links,
    }

    link.resource = stylesheetResource

    // Recurse to crawl the subresources of this stylesheet.
    await crawlSubresources(stylesheetResource.links, config)
}

async function fetchSubresource(
    link: SubresourceLink,
    config: CrawlSubresourcesConfig
): Promise<{ url: UrlString, blob: Blob }> {
    if (link.absoluteTarget === undefined) {
        throw new Error(`Cannot fetch invalid target: ${link.target}`)
    }
    const url = link.absoluteTarget

    const fetchFunction = config.fetchResource || config.glob.fetch
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

async function blobToText(blob: Blob, config: Pick<GlobalConfig, 'glob'>): Promise<string> {
    const text = await new Promise<string>((resolve, reject) => {
        const reader = new config.glob.FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsText(blob) // TODO should we know&tell which encoding to use?
    })
    return text
}
