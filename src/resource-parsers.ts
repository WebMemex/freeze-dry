import { postcss, documentOuterHTML } from './package'

import { extractLinksFromDom, extractLinksFromCss } from './extract-links/index'
import { UrlString, Resource, DomResource, StylesheetResource, GlobalConfig } from './types'
import { CssLink } from './extract-links/types'
import { SubresourceType } from './extract-links/url-attributes/types'

type CrawlSubresourcesConfig = Pick<GlobalConfig, 'fetchResource' | 'glob'>
type ResourceParser = (fetchResult: FetchyResult, config: CrawlSubresourcesConfig) => Promise<Resource>
type FetchyResult = { url: UrlString, blob: Blob }

const parsers: { [Key in SubresourceType]?: ResourceParser } = {
    document: parseDocumentResource,
    style: parseStylesheet,
    image: parseLeafResource, // Images cannot have subresources (actually, SVGs can! TODO)
    video: parseLeafResource, // Videos cannot have subresources (afaik; maybe they can?)
    font: parseLeafResource, // Fonts cannot have subresources (afaik; maybe they can?)
}

export default parsers

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

async function blobToText(blob: Blob, config: Pick<GlobalConfig, 'glob'>): Promise<string> {
    const text = await new Promise<string>((resolve, reject) => {
        const reader = new config.glob.FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsText(blob) // TODO should we know&tell which encoding to use?
    })
    return text
}
