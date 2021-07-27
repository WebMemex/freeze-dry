import { UrlString, Fetchy, FrameElement } from './util'
import { SubresourceLink } from '../extract-links/types'

export * from './util'

// The callback that is run for each encountered subresource link
export type ProcessLinkCallback = (
    link: SubresourceLink,
    config: GlobalConfig,
    recurse: ProcessLinkRecurse,
) => void | Promise<void>

export type ProcessLinkRecurse = (
    link: SubresourceLink,
    config?: GlobalConfig,
) => void | Promise<void>

export interface GlobalConfig {
    processLink: ProcessLinkCallback,
    timeout: number,
    docUrl?: UrlString,
    charsetDeclaration: string | null,
    addMetadata: boolean,
    keepOriginalAttributes: boolean,
    setContentSecurityPolicy: boolean,
    now: Date,
    fetchResource?: Fetchy,
    getDocInFrame?: (frameElement: FrameElement) => Document | Promise<Document> | null, // TODO expose to user & test.
    glob: typeof window, /* global window */
}
