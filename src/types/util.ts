import type { UrlString } from '../extract-links/types'
export type { UrlString }

export type FrameElement = HTMLFrameElement | HTMLIFrameElement

export type Fetchy = WindowOrWorkerGlobalScope['fetch']
    | ((...args: Parameters<WindowOrWorkerGlobalScope['fetch']>)
        => Promise<{ blob: Blob, url: UrlString }>)
