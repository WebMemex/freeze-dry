import { UrlString, Fetchy, FrameElement } from './util'
import { SubresourceLink } from '../extract-links/types'

export * from './util'

type ProcessLinkCallback = (
    link: SubresourceLink,
    recurse: (link: SubresourceLink) => void,
    config: GlobalConfig,
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
    getDocInFrame?: (frameElement: FrameElement) => Document | null, // TODO expose to user & test.
    glob: typeof window, /* global window */
}
