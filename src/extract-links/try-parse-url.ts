import { relativeToAbsoluteIri } from '../package'

import { UrlString } from './types'

// Parse the given URL relative to the given base URL, and return undefined if this fails.
export default function tryParseUrl(url: string, baseUrl?: string): UrlString | undefined {
    try {
        return relativeToAbsoluteIri(url, baseUrl)
    } catch (err) {
        return undefined
    }
}
