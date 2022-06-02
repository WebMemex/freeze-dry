import { relativeToAbsoluteIri } from '../package'

import type { UrlString } from './types'

// Parse the given URL relative to the given base URL, and return undefined if this fails.
export default function tryParseUrl(url: string, baseUrl?: UrlString): UrlString | undefined {
    try {
        return relativeToAbsoluteIri(url, baseUrl) as UrlString
    } catch (err) {
        return undefined
    }
}
