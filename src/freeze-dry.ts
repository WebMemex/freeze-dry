/* global window */
import { flatOptions } from './package'

import type { FreezeDryConfig, ProcessSubresourceRecurse } from './types/index'
import type { SubresourceLink } from './extract-links/types'
import blobToDataUrl from './blob-to-data-url'
import setLinkTarget from './set-link-target'
import { Resource, DomCloneResource } from './resource'
import setMementoTags from './set-memento-tags'
import setContentSecurityPolicy from './set-content-security-policy'
import setCharsetDeclaration from './set-charset-declaration'

/**
 * Freeze-dry an HTML Document.
 *
 * Technically, this function is a convenience wrapper that instantiates and runs a {@link
 * FreezeDryer} instance.
 *
 * @example
 * // Simplest use case
 * const html = await freezeDry()
 *
 * // With options
 * const html = await freezeDry(document, { timeout: 5000 })
 *
 * @param document - Document to be freeze-dried. Remains unmodified. @defaultValue `window.document`.
 * @param options - Options to customise freezeDry’s behaviour. See {@link FreezeDryConfig}.
 * @returns The freeze-dried document as a self-contained, static string of HTML.
 */
export async function freezeDry(
    document: Document = typeof window !== 'undefined' && window.document || fail('No document given to freeze-dry'),
    options: Partial<FreezeDryConfig> = {},
): Promise<string> {
    const freezeDryer = await new FreezeDryer(document, options).run()

    // Return the snapshot as a single string of HTML
    const html = freezeDryer.result.string
    return html
}

/**
 * Freeze-dries an HTML Document.
 *
 * For most use cases, use the {@link freezeDry} function, a convenience wrapper around this class.
 *
 * Use this class instead if you need more control. For example to access the incomplete result
 * before `freezeDry` finishes, or to obtain it as a `Document` or `Blob` rather than a string.
 *
 * @example
 * This is roughly what running `freezeDry(document, options)` does:
 *     const freezeDryer = new FreezeDryer(document, options)
 *     await freezeDryier.run()
 *     const html = freezeDryer.result.string
 */
export class FreezeDryer implements AbortController {
    /**
     * The `Document` that was passed to this `FreezeDryer` to be freeze-dried.
     */
    readonly original: Document

    /**
     * The clone of the original document. After completing {@link run}, this is the freeze-dried
     * result. It can also be accessed before or while `run`ning, to already obtain a partial
     * result if needed.
     */
    readonly result: DomCloneResource

    /**
     * The configuration of this `FreezeDryer` (based on the passed `options`).
     */
    readonly config: FreezeDryConfig

    private abortController: AbortController

    /**
     * @param document - Document to be freeze-dried. Remains unmodified.
     * @param options - Options to customise freezeDry’s behaviour.
     */
    constructor(
        document: Document,
        options: Partial<FreezeDryConfig> = {},
    ) {
        this.original = document
        this.config = this.applyDefaultConfig(document, options)
        this.abortController = this.initAbortController()

        // Step 1: Capture the DOM in its current state.
        this.result = this.captureDom(document)
    }

    /**
     * Run the freeze-drying process.
     *
     * Starts the process of recursively crawling and drying subresources of {@link result}, then
     * finalises the snapshot itself.
     *
     * @returns The FreezeDryer itself.
     */
    async run(): Promise<this> {
        // Step 2: Recurse into subresources, converting them as needed.
        await this.crawlSubresources()
        // Step 3: Make the DOM static and context-free.
        await this.config.dryResource(this.result, true)
        // Step 4: Finalise snapshot.
        this.finaliseSnapshot()

        return this
    }

    /** Capture the DOM in its current state. (Step 1) */
    protected captureDom(original: Document): DomCloneResource {
        const domResource = new DomCloneResource(original, this.config.docUrl, { glob: this.config.glob })
        domResource.cloneFramedDocs(/* deep = */ true)
        return domResource
    }

    /** Recurse into subresources, converting them as needed. (Step 2) */
    protected async crawlSubresources() {
        try {
            await this.result.processSubresources(this.config.processSubresource)
        } catch (error) {
            // If subresource crawling timed out or was aborted, continue with what we have.
            if (!this.config.signal?.aborted) throw error
        }
    }

    /**
     * Default method for processing subresources (can be overruled in `options`).
     *
     * Fetches the subresource, recurses into each of its (sub)subresources, then applies {@link
     * dryResource} and {@link newUrlForResource} on it.
     */
    protected async processSubresource(
        link: SubresourceLink,
        recurse: ProcessSubresourceRecurse,
    ) {
        // TODO Synchronously clone frame contents here instead of in `captureDom`?
        // (We’d first have to make srcdoc-based frames turn up as (pseudo)subresources)
        // if (link.resource) link.resource.freeze?.()

        // Subresource step 1: Get the linked resource if missing (from cache/internet).
        if (!link.resource) {
            try {
                link.resource = await Resource.fromLink(link, {
                    fetchResource: this.config.fetchResource,
                    signal: this.signal,
                    glob: this.config.glob,
                })
            } catch (err) {
                // TODO we may want to do something here. Turn target into about:invalid? For
                // now, we rely on the content security policy to prevent loading this subresource.
                return
            }
        }

        // Subresource step 2: Recurse into this subresource’s subresources.
        await link.resource.processSubresources(recurse)

        // Subresource step 3: Make this subresource static and context-free.
        await this.config.dryResource(link.resource, false)

        // Subresource step 4: Change the link’s target to a new URL for the subresource.
        const newUrl = await this.config.newUrlForResource(link.resource)
        if (newUrl !== link.target) setLinkTarget(
            link,
            newUrl,
            { rememberOriginalUrls: this.config.rememberOriginalUrls }
        )
    }

    /**
     * Default method for choosing a new URL for a subresource (can be overruled in `options`).
     *
     * @returns the complete resource content encoded as a data URL (`data:mime/type;base64;………`).
     */
    protected async newUrlForResource(resource: Resource) {
        return await blobToDataUrl(resource.blob, { glob: this.config.glob })
    }

    /**
     * Default method for ‘drying’ a (sub)resource (can be overruled in `options`).
     *
     * Makes the resource static and context-free. (Step 3, and subresource step 3)
     * @param resource - The resource to be ‘dried’.
     * @param isRootDocument - Whether `resource` is the top-level document (rather than a subresource).
     */
     protected dryResource(
        resource: Resource,
        isRootDocument: boolean,
    ) {
        resource.dry()
    }

    /** Finalise snapshot. (Step 4) */
    protected finaliseSnapshot() {
        // Step 4.1: Add metadata about the snapshot to the snapshot itself.
        if (this.config.addMetadata)
            setMementoTags(this.result.doc, { originalUrl: this.result.url, datetime: this.config.now })
        // Step 4.2: Set a strict Content Security Policy in a <meta> tag.
        if (this.config.contentSecurityPolicy !== null)
            setContentSecurityPolicy(this.result.doc, this.config.contentSecurityPolicy)
        // Step 4.3: Create/replace the <meta charset=…> element.
        if (this.config.charsetDeclaration !== undefined)
            setCharsetDeclaration(this.result.doc, this.config.charsetDeclaration)
    }

    protected applyDefaultConfig(
        doc: Document,
        options: Partial<FreezeDryConfig>,
    ): FreezeDryConfig {
        const defaultOptions: FreezeDryConfig = {
            // Config for tweaking snapshot output
            addMetadata: true,
            now: new Date(),
            contentSecurityPolicy: {
                'default-src': ["'none'"], // By default, block all connectivity and scripts.
                'img-src': ['data:'], // Allow inlined images.
                'media-src': ['data:'], // Allow inlined audio/video.
                'style-src': ['data:', "'unsafe-inline'"], // Allow inlined styles.
                'font-src': ['data:'], // Allow inlined fonts.
                'frame-src': ['data:'], // Allow inlined iframes.
            },
            charsetDeclaration: 'utf-8',

            // Config for dealing with subresources
            timeout: Infinity,
            signal: undefined,
            processSubresource: this.processSubresource.bind(this),
            fetchResource: undefined, // defaults to browser’s fetch
            dryResource: this.dryResource.bind(this),
            newUrlForResource: this.newUrlForResource.bind(this),
            rememberOriginalUrls: true,

            // Other config
            docUrl: undefined,
            glob: doc.defaultView
                || (typeof window !== 'undefined' ? window : undefined)
                || fail('Lacking a global window object'),
        }
        const config: FreezeDryConfig = flatOptions(options, defaultOptions)
        return config
    }

    private initAbortController() {
        const glob = this.config.glob || globalThis
        const abortController = new glob.AbortController()
        if (this.config.timeout >= 0 && this.config.timeout < Infinity) {
            // The timeout option is merely a shorthand for a time-triggered AbortSignal.
            glob.setTimeout(() => {
                this.abort('Freeze-dry timed out')
            }, this.config.timeout)
        }
        if (this.config.signal) {
            // Chain the given signal to our internal controller.
            const configSignal = this.config.signal
            configSignal.addEventListener('abort', event => this.abort(configSignal.reason))
        }
        return abortController
    }

    /**
     * Abort freeze-drying. Stops further crawling of subresources, but still finishes the snapshot
     * using the currently available subresources.
     */
    async abort(reason?: any) {
        this.abortController.abort(reason)
    }

    /**
     * Signals whether freeze-drying has been aborted.
     *
     * Aborting can happen in several ways:
     * - This `FreezeDryer`’s {@link abort} method was called.
     * - The `timeout` given in `options` has been reached.
     * - The `signal` given in `options` was triggered.
     */
    get signal() {
        return this.abortController.signal
    }
}

function fail(message: string): never {
    throw new Error(message)
}
