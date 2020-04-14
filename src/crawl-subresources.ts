import { postcss, documentOuterHTML } from './package'

import { extractLinksFromDom, extractLinksFromCss } from './extract-links/index'
import { UrlString, Resource, DomResource, StylesheetResource, GlobalConfig } from './types'
import { Link, SubresourceLink, CssLink } from './extract-links/types'
import { SubresourceType } from './extract-links/url-attributes/types'

type CrawlSubresourcesConfig = Pick<GlobalConfig, 'fetchResource' | 'glob'>
type ResourceParser = (fetchResult: FetchyResult, config: CrawlSubresourcesConfig) => Promise<Resource>
type FetchyResult = { url: UrlString, blob: Blob }

/**
 * Recursively fetch the subresources of a DOM resource.
 * @param {Object} resource - the resource object representing the DOM with its subresources.
 * @param {Function} [config.fetchResource] - custom function for fetching resources; should be
 * API-compatible with the global fetch(), but may also return { blob, url } instead of a Response.
 * @returns nothing; subresources are stored in the links of the given resource.
 */
async function crawlSubresources(resource: Resource, config: CrawlSubresourcesConfig) {
    const links = getLinksToCrawl(resource)
    await Promise.allSettled(links.map(link => crawlSubresource(link, config)))
}
export default crawlSubresources

function getLinksToCrawl(resource: Resource): SubresourceLink[] {
    // TODO Avoid fetching all resolutions&formats of the same image/video?
    const linksToCrawl: SubresourceLink[] = (resource.links
        .filter((link: Link): link is SubresourceLink => link.isSubresource) as SubresourceLink[])
        .filter(link => link.subresourceType && link.subresourceType in parsers)

    return linksToCrawl
}

async function crawlSubresource(link: SubresourceLink, config: CrawlSubresourcesConfig) {
    if (!link.resource) {
        const parser = link.subresourceType && parsers[link.subresourceType]
        if (parser === undefined) {
            throw new Error(`Not sure how to crawl subresource of type ${link.subresourceType}`)
        }

        const fetchResult = await fetchSubresource(link, config)

        link.resource = await parser(fetchResult, config)
    }
    await crawlSubresources(link.resource as Resource, config)
}

const parsers: { [Key in SubresourceType]?: ResourceParser } = {
    document: parseDocumentResource,
    style: parseStylesheet,
    image: parseLeafResource, // Images cannot have subresources (actually, SVGs can! TODO)
    video: parseLeafResource, // Videos cannot have subresources (afaik; maybe they can?)
    font: parseLeafResource, // Fonts cannot have subresources (afaik; maybe they can?)
}

async function parseLeafResource(
    fetchResult: FetchyResult,
    config: CrawlSubresourcesConfig,
): Promise<Resource> {
    return {
        url: fetchResult.url,
        blob: fetchResult.blob,
        links: [],
    }
}

async function parseDocumentResource(
    fetchResult: FetchyResult,
    config: CrawlSubresourcesConfig,
): Promise<DomResource> {
    const html = await blobToText(fetchResult.blob, config)
    const parser = new config.glob.DOMParser()
    const innerDoc = parser.parseFromString(html, 'text/html')
    // Note that the final URL may differ from link.absoluteTarget in case of redirects.
    const innerDocUrl = fetchResult.url

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
    return innerDocResource
}

async function parseStylesheet(
    fetchResult: FetchyResult,
    config: CrawlSubresourcesConfig,
): Promise<StylesheetResource> {
    // Note that the final URL may differ from link.absoluteTarget in case of redirects.
    const stylesheetUrl = fetchResult.url
    const originalStylesheetText = await blobToText(fetchResult.blob, config)

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

    return stylesheetResource
}

async function fetchSubresource(
    link: SubresourceLink,
    config: CrawlSubresourcesConfig
): Promise<FetchyResult> {
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
