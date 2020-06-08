import { mergeIterator } from './package'

import { UrlString, GlobalConfig } from './types'
import { Link, SubresourceLink } from './extract-links/types'
import { Resource } from './resource'

type CrawlSubresourcesConfig = Pick<GlobalConfig, 'fetchResource' | 'glob'>
type FetchyResult = { url: UrlString, blob: Blob }

/**
 * Recursively fetch the subresources of a DOM resource.
 * @param {Object} resource - the resource object representing the DOM with its subresources.
 * @param {Function} [config.fetchResource] - custom function for fetching resources; should be
 * API-compatible with the global fetch(), but may also return { blob, url } instead of a Response.
 * @returns nothing; subresources are stored in the links of the given resource.
 */
async function * crawlSubresources(
    resource: Resource,
    config: CrawlSubresourcesConfig
): AsyncIterable<Resource> {
    const links = getLinksToCrawl(resource)
    const crawlers = links.map(link => crawlSubresource(link, config))
    yield * mergeIterator(crawlers)
}
export default crawlSubresources

function getLinksToCrawl(resource: Resource): SubresourceLink[] {
    // TODO Avoid fetching all resolutions&formats of the same image/video?
    const linksToCrawl: SubresourceLink[] = (resource.links
        .filter((link: Link): link is SubresourceLink => link.isSubresource) as SubresourceLink[])
        .filter(link => link.subresourceType && Resource.getResourceClass(link.subresourceType))

    return linksToCrawl
}

async function * crawlSubresource(
    link: SubresourceLink,
    config: CrawlSubresourcesConfig
): AsyncIterable<Resource> {
    if (!link.resource) {
        const { url, blob } = await fetchSubresource(link, config)
        link.resource = await Resource.fromBlob({
            url,
            blob,
            subresourceType: link.subresourceType,
            config
        })
    }
    yield link.resource
    yield * crawlSubresources(link.resource, config)
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
