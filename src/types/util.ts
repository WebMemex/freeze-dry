/**
 * UrlString is used for strings that are guaranteed/presumed to be absolute URLs.
 */
// Specify just enough to make it incompatible with an arbitrary string.
export type UrlString = `${string}:${string}`

/**
 * A string indicating the type of subresource expected by a parent resource, e.g. `'image'` or
 * `'style'`. Note this is not the same as a MIME type.
 *
 * This corresponds to what is now called the ‘destination’ in the [WHATWG fetch spec](https://fetch.spec.whatwg.org/#concept-request-destination).
 */
 export type SubresourceType = 'audio' | 'document' | 'embed' | 'font' | 'image' | 'object'
 | 'script' | 'style' | 'track' | 'video'

/**
 * An <iframe> element or <frame> element (note the latter is obsolete since HTML 5).
 */
export type FrameElement = HTMLFrameElement | HTMLIFrameElement

/**
 * A function that is API-compatible with the global `fetch()`, but may also resolve to an object
 * `{ blob, url }` instead of a `Response`.
 */
export type Fetchy = WindowOrWorkerGlobalScope['fetch']
    | ((...args: Parameters<WindowOrWorkerGlobalScope['fetch']>)
        => Promise<{ blob: Blob, url: UrlString }>)
