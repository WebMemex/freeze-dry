import { UrlString, GlobalConfig } from './types'
import { SubresourceLink } from './extract-links/types'
import { Resource } from './resource'

type GetSubresourceConfig = Pick<GlobalConfig, 'fetchResource' | 'glob'>
type FetchyResult = { url: UrlString, blob: Blob }

/**
 * Fetch & cache (if not already available) the resource a given `link` points to, and return it.
 * @param {Object} link - the link pointing to the resource.
 * @param {Function} [config.fetchResource] - custom function for fetching resources; should be
 * API-compatible with the global fetch(), but may also return { blob, url } instead of a Response.
 * @returns nothing; subresources are stored in the links of the given resource.
 */
export default async function getSubresource(
    link: SubresourceLink,
    config: GetSubresourceConfig
): Promise<Resource> {
    if (!link.resource) {
        const { url, blob } = await fetchSubresource(link, config)
        link.resource = await Resource.fromBlob({
            url,
            blob,
            subresourceType: link.subresourceType,
            config
        })
    }
    return link.resource
}

async function fetchSubresource(
    link: SubresourceLink,
    config: GetSubresourceConfig
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
