import { UrlString, GlobalConfig } from './types'
import { Resource, DomResource, StylesheetResource, LeafResource } from './resource'
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
): Promise<LeafResource> {
    return new LeafResource({
        url: fetchResult.url,
        blob: fetchResult.blob,
    })
}

async function parseDocumentResource(
    fetchResult: FetchyResult,
    config: CrawlSubresourcesConfig,
): Promise<DomResource> {
    const html = await blobToText(fetchResult.blob, config)
    return new DomResource(fetchResult.url, html, config)
}

async function parseStylesheet(
    fetchResult: FetchyResult,
    config: CrawlSubresourcesConfig,
): Promise<StylesheetResource> {
    const stylesheetText = await blobToText(fetchResult.blob, config)
    return new StylesheetResource(fetchResult.url, stylesheetText, config)
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
