/**
 * UrlString is used for strings that are guaranteed/presumed to be absolute URLs.
 *
 * It is intended to avoid accidentally passing a relative URL to a function that expects an
 * absolute URL. Type assertions may be required in cases where a string is known to be an absolute
 * URL. For example: `document.URL as UrlString`.
 *
 * @category Other
 */
// Specify just enough to make it incompatible with an arbitrary string.
export type UrlString = `${string}:${string}`

/**
 * A string indicating the type of subresource expected by a parent resource, e.g. `'image'` or
 * `'style'`. Note this is not the same as a MIME type.
 *
 * This corresponds to what is now called the ‘destination’ in the [WHATWG fetch spec](https://fetch.spec.whatwg.org/#concept-request-destination).
 *
 * @category Other
 */
 export type SubresourceType = 'audio' | 'document' | 'embed' | 'font' | 'image' | 'object'
 | 'script' | 'style' | 'track' | 'video'

/**
 * An `<iframe>` element or `<frame>` element (note the latter is obsolete since HTML 5).
 *
 * @category Other
 */
export type FrameElement = HTMLFrameElement | HTMLIFrameElement
