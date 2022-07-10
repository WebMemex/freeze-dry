import type { UrlString } from '../resource/links/types'
export type { UrlString }

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
