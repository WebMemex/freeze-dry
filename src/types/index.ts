import { UrlString, Fetchy, FrameElement } from './util'
import { SubresourceLink } from '../extract-links/types'
import { Resource } from '../resource'

export * from './util'

// The callback that is run for each encountered subresource link
export type ProcessSubresourceCallback = (
    link: SubresourceLink,
    recurse: ProcessSubresourceRecurse,
) => void | Promise<void>

export type ProcessSubresourceRecurse = (
    link: SubresourceLink,
) => void | Promise<void>

export type NewUrlForResourceCallback = (resource: Resource) => string | Promise<string>

export interface GlobalConfig {
    timeout: number,
    docUrl?: UrlString,
    charsetDeclaration: string | null,
    addMetadata: boolean,
    keepOriginalAttributes: boolean,
    setContentSecurityPolicy: boolean,
    now: Date,
    fetchResource?: Fetchy,
    processSubresource: ProcessSubresourceCallback,
    newUrlForResource: NewUrlForResourceCallback,
    getDocInFrame?: (frameElement: FrameElement) => Document | null, // TODO expose to user & test.
    glob?: typeof window, /* global window */
}
