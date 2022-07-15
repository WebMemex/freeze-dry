import { UrlString } from './util'
import type { SubresourceLink } from '../resource'
import { Resource } from '../resource'

/**
 * The configuration for freeze-dry.
 *
 * The configuration is set by the `options` passed to {@link freezeDry} or {@link FreezeDryer}.
 *
 * @category Config
 */
export interface FreezeDryConfig {
  /**
   * Whether to note the snapshotting time and the document's URL in an extra meta and link tag.
   *
   * @defaultValue true
   *
   * @category Output options
   */
  addMetadata: boolean,

  /**
   * Whether to preserve the value of an element attribute if its URLs are inlined, by noting it
   * as a new `data-original-...` attribute. For example, `<img src="bg.png">` would become `<img
   * src="data:..." data-original-src="bg.png">`. Note this is an unstandardised workaround to
   * keep URLs of subresources available; unfortunately URLs inside stylesheets are still lost.
   *
   * @category Output options
   */
  rememberOriginalUrls: boolean,

  /**
   * Override the snapshot time (only relevant when `addMetadata` is `true`). Mainly intended for
   * testing purposes.
   *
   * @category Output options
   */
  now: Date,

  /**
   * Add a `<meta>` tag with the given content security policy to the snapshot. The default value
   * only allows loading inline resources and `data:` URLs, no external resources.
   *
   * @category Output options
   */
  contentSecurityPolicy: ContentSecurityPolicy | null,

  /**
   * The value put into the `<meta charset="…">` element of the snapshot.
   *
   * If you will store/serve the returned string using an encoding other than UTF8, pass its name
   * here; or pass null or an empty string to omit the declaration altogether.
   *
   * @defaultValue 'utf-8'
   *
   * @category Output options
   */
  charsetDeclaration: string | null,

  /**
   * Maximum time (in milliseconds) spent on fetching the page’s subresources. The resulting HTML
   * will have only succesfully fetched subresources inlined.
   *
   * @defaultValue Infinity
   *
   * @category Subresource options
   */
  timeout: number,

  /**
   * Signal to abort subresource fetching at any moment. As with `timeout`, the resulting HTML
   * will have only succesfully fetched subresources inlined.
   *
   * @category Subresource options
   */
  signal?: AbortSignal,

  /**
   * Custom function for fetching resources; should be API-compatible with the global `fetch()`,
   * but may also resolve to an object `{ blob, url }` instead of a `Response`.
   *
   * This option is ignored if a custom {@link processSubresource} is given.
   *
   * For aborting to work (e.g. via the {@link timeout} or {@link signal} options), this callback
   * must respect its `signal` parameter.
   *
   * @category Subresource options
   */
  fetchResource?: Fetchy,

  /**
   * Transformations to apply on the document and each subresource.
   *
   * To also perform the default transformations, make this callback run `resource.dry()`.
   *
   * This option is ignored if a custom {@link processSubresource} is given.
   *
   * @category Subresource options
   */
  dryResource: DryResourceCallback,

  /**
   * Callback to determine the replacement URL for a (processed, dried) subresource; defaults to
   * creating a `data:` URL.
   *
   * This option is ignored if a custom {@link processSubresource} is given.
   *
   * @category Subresource options
   */
  newUrlForResource: NewUrlForResourceCallback,

  /**
   * Callback invoked for each of `doc`’s subresources.
   *
   * The default behaviour is to recursively fetch and ‘dry’ subresources and turn each into a `data:`
   * URL. Those individual steps can be customised by the other subresource handling options:
   * {@link fetchResource},
   * {@link dryResource}, and
   * {@link newUrlForResource}.
   *
   * If those options are not flexible enough, a completely custom `processResource` might be a
   * solution. Other subresource handling options are then ignored.
   *
   * @example
   * This is a simplification of what the default `freezeDry` implementation does (assuming other
   * options are kept at their defaults too):
   *
   * ```
   * async processSubresource(link, recurse) {
   *   link.resource ||= await Resource.fromLink(link)   // fetch the subresource
   *   await link.resource.processSubresources(recurse)  // recurse into its links
   *   await link.resource.dry()                         // dry the subresource
   *   link.target = blobToDataUrl(link.resource.blob)   // inline its content in the link
   * }
   * ```
   *
   * @category Subresource options
   */
  processSubresource: ProcessSubresourceCallback,

  /**
   * URL to override doc.URL.
   *
   * Its value will influence the expansion of relative URLs, and is useful for cases where the
   * document was constructed dynamically (e.g. using [DOMParser](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser)).
   *
   * @category Other options
   */
  docUrl?: UrlString,

  /**
   * Overrides the object providing global DOM interfaces (instead of `globalThis`/`window`).
   * Only relevant when freezeDry is not run ‘in’ but ‘on’ a DOM (e.g. in NodeJS on [JSDOM](https://github.com/jsdom/jsdom/)).
   *
   * @category Other options
   */
  glob?: typeof globalThis,
}

/**
 * A value for the Content-Security-Policy `<meta>` tag (or HTTP header). It can be the string value
 * or (for convenience) it can be an object defining each policy directive separately; the values
 * of this object can again be either a string, or (for convenience) an array of strings listing the
 * individual sources separately (or a nullish value, equivalent to not including the directive).
 *
 * @example
 * {
 *   'default-src': "'none'",
 *   'img-src': ['data:'],
 *   'style-src': ['data:', "'unsafe-inline'"],
 * }
 *
 * @category Config
 */
 export type ContentSecurityPolicy = string | {
  [directive: string]: string | string[] | undefined | null,
}

/**
 * A function that is API-compatible with the global `fetch()`, but may also resolve to an object
 * `{ blob, url }` instead of a `Response`.
 *
 * Can be defined via the {@link FreezeDryConfig.fetchResource} option.
 *
 * @category Config
 */
export type Fetchy = WindowOrWorkerGlobalScope['fetch']
    | ((...args: Parameters<WindowOrWorkerGlobalScope['fetch']>)
        => Promise<{ blob: Blob, url: UrlString }>)

/**
 * Transformations to apply on the document and each subresource.
 *
 * To also perform the default transformations, make this callback run `resource.dry()`.
 *
 * Can be defined via the {@link FreezeDryConfig.dryResource} option.
 *
 * @param resource - The resource to be ‘dried’.
 * @param isRootDocument - Whether `resource` is the top-level document (rather than a subresource).
 *
 * @category Config
 */
export type DryResourceCallback = (
  resource: Resource,
  isRootDocument: boolean,
) => void | Promise<void>

/**
 * Function for choosing a new URL for a subresource.
 *
 * Can be defined via the {@link FreezeDryConfig.newUrlForResource} option.
 *
 * @param resource - The resource to give a (new) URL.
 * @returns The new URL for linking to this subresource.
 *
 * @category Config
 */
export type NewUrlForResourceCallback = (resource: Resource) => string | Promise<string>

/**
 * Callback invoked for each subresource.
 *
 * Can be defined via the {@link FreezeDryConfig.processSubresource} option.
 *
 * @param link - The subresource link to be processed.
 * @param recurse - The callback that can be used to process this subresource’s subresources.
 * Invoking it will invoke this function itself again, while enabling `freezeDry` to track progress
 * and trigger event handlers.
 *
 * @category Config
 */
export type ProcessSubresourceCallback = (
  link: SubresourceLink,
  recurse: ProcessSubresourceRecurse,
) => void | Promise<void>

/**
 * The callback passed to {@link ProcessSubresourceCallback} for recursing into a subresource’s
 * subresources.
 *
 * Equivalent to {@link ProcessSubresourceCallback}, except there is no need to pass it the
 * `recurse` parameter again.
 *
 * @param link - The ((…)sub)subresource link to be processed.
 *
 * @category Config
 */
export type ProcessSubresourceRecurse = (
  link: SubresourceLink,
) => void | Promise<void>

/**
 * {@inheritDoc FreezeDryConfig.glob}
 *
 * @category Config
 */
export type GlobalConfig = Pick<FreezeDryConfig, 'glob'>
