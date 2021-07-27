import { GlobalConfig } from './types'
import { SubresourceLink } from './extract-links/types'
import { Resource } from './resource'

/**
 * Fetch the resource a given `link` points to, and return it.
 * @param {Object} link - the link pointing to the resource.
 * @param {Function} [config.fetchResource] - custom function for fetching resources; should be
 * API-compatible with the global fetch(), but may also return { blob, url } instead of a Response.
 * @returns nothing; subresources are stored in the links of the given resource.
 */
export default async function fetchSubresource(
    link: SubresourceLink,
    config: Pick<GlobalConfig, 'fetchResource' | 'glob'>,
): Promise<Resource> {
    if (link.absoluteTarget === undefined) {
        throw new Error(`Cannot fetch invalid target: ${link.target}`)
    }
    const targetUrl = link.absoluteTarget

    const fetchFunction = config.fetchResource || config.glob.fetch
    // TODO investigate whether we should supply origin, credentials, ...
    const resourceOrResponse = await fetchFunction(targetUrl, {
        cache: 'force-cache',
        redirect: 'follow',
    })

    // If we got a Response, we wait for the content to arrive.
    const blob = typeof resourceOrResponse.blob === 'function'
        ? await resourceOrResponse.blob()
        : resourceOrResponse.blob
    // Read the final URL of the resource (after any redirects).
    const finalUrl = resourceOrResponse.url

    return await Resource.fromBlob({
        url: finalUrl,
        blob,
        subresourceType: link.subresourceType,
        config
    })
}
