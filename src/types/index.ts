import { UrlString, Fetchy, FrameElement } from './util'
import type { SubresourceLink } from '../extract-links/types'
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

export type DryResourceCallback = (resource: Resource) => void | Promise<void>

export type NewUrlForResourceCallback = (resource: Resource) => string | Promise<string>

export type ContentSecurityPolicy = string | {
    [directive: string]: string | string[] | undefined | null,
}

export interface FreezeDryConfig extends GlobalConfig {
    /**
     * Maximum time (in milliseconds) spent on fetching the page’s subresources. The resulting HTML
     * will have only succesfully fetched subresources inlined.
     */
    timeout: number,

    /**
     * Signal to abort subresource fetching at any moment. As with `timeout`, the resulting HTML
     * will have only succesfully fetched subresources inlined.
     */
    signal?: AbortSignal,

    /**
     * URL to override doc.URL.
     */
    docUrl?: UrlString,

    /**
     * The value put into the <meta charset="…"> element of the snapshot. If you will store/serve
     * the returned string using an encoding other than UTF8, pass its name here; or pass null or an
     * empty string to omit the declaration altogether.
     */
    charsetDeclaration: string | null,

    /**
     * Whether to note the snapshotting time and the document's URL in an extra meta and link tag.
     */
    addMetadata: boolean,

    /**
     * Whether to preserve the value of an element attribute if its URLs are inlined, by noting it
     * as a new `data-original-...` attribute. For example, `<img src="bg.png">` would become `<img
     * src="data:..." data-original-src="bg.png">`. Note this is an unstandardised workaround to
     * keep URLs of subresources available; unfortunately URLs inside stylesheets are still lost.
     */
    rememberOriginalUrls: boolean,

    /**
     * Add a `<meta>` tag with the given content security policy to the snapshot. The default value
     * only allows loading inline resources and `data:` URLs, no external resources.
     */
    contentSecurityPolicy: ContentSecurityPolicy | null,

    /**
     * Override the snapshot time (only relevant when `addMetadata` is `true`).
     */
    now: Date,

    /**
     * Custom function for fetching resources; should be API-compatible with the global `fetch()`,
     * but may also resolve to an object `{ blob, url }` instead of a `Response`.
     */
    fetchResource?: Fetchy,

    /**
     * Transformations to apply on the document and each subresource. It is recommended to call
     * `resource.dry()` as part of this transformation, to run the default actions.
     */
    dryResource: DryResourceCallback,

    /**
     * Callback invoked for each of `doc`’s subresources. Default behaviour is to recursively ‘dry’
     * subresources and turn each into a `data:` URL.
     */
    processSubresource: ProcessSubresourceCallback,

    /**
     * Callback to determine the replacement URL for a (processed, dried) subresource; defaults to
     * creating a `data:` URL. If `processSubresource` is also given, this option is ignored.
     */
    newUrlForResource: NewUrlForResourceCallback,
}

export interface GlobalConfig {
    /**
     * Overrides the object providing global DOM interfaces (instead of `globalThis`/`window`).
     * Only relevant when freezeDry is not run ‘in’ but ‘on’ a DOM (e.g. in Node on JSDOM).
     */
    glob?: typeof globalThis,
}
