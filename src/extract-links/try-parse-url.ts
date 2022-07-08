import { relativeToAbsoluteIri } from '../package'

import type { UrlString } from './types'

/**
 * Parse the given URL `url` relative to the given base URL `baseUrl`.
 *
 * @param url - The (possibly relative) URL to be made absolute.
 * @param baseUrl - The base URL, e.g. the URL of the resource containing the link.
 * @returns The resulting absolute URL, or `undefined` if this fails.
 */
export default function tryParseUrl(url: string, baseUrl?: UrlString): UrlString | undefined {
    try {
        return relativeToAbsoluteIri(url, baseUrl) as UrlString
    } catch (err) {
        return undefined
    }
}
