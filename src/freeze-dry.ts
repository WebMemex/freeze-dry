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
 * Freeze-dry an HTML Document
 *
 * @returns The freeze-dried document as a self-contained, static string of HTML.
 */
export default async function freezeDry(
    /**
     * Document to be freeze-dried. Remains unmodified.
     */
    doc: Document = typeof window !== 'undefined' && window.document || fail('No document given to freeze-dry'),

    /**
     * Options to customise freezeDry’s behaviour
     */
    options: Partial<FreezeDryConfig> = {},
): Promise<string> {
    const freezeDryer = await new FreezeDryer(doc, options).run()

    // Return the snapshot as a single string of HTML
    const html = freezeDryer.result.string
    return html
}

/**
 * Freeze-dries an HTML Document
 */
export class FreezeDryer {
    original: Document
    result: DomCloneResource
    config: FreezeDryConfig

    constructor(
        /** Document to be freeze-dried. Remains unmodified. */
        doc: Document,
        /** Options to customise freezeDry’s behaviour */
        options: Partial<FreezeDryConfig> = {},
    ) {
        this.original = doc
        this.config = this.applyDefaultConfig(doc, options)

        // Step 1: Capture the DOM in its current state.
        this.result = this.captureDom(doc)
    }

    async run(): Promise<this> {
        // Step 2: Recurse into subresources, converting them as needed.
        await this.crawlSubresources()
        // Step 3: Make the DOM static and context-free.
        this.dryResource()
        // Step 4: Finalise snapshot.
        this.finaliseSnapshot()

        return this
    }

    /** Capture the DOM in its current state. */
    private captureDom(original: Document): DomCloneResource {
        const domResource = new DomCloneResource(original, this.config.docUrl, this.config)
        domResource.cloneFramedDocs(/* deep = */ true)
        return domResource
    }

    /** Recurse into subresources, converting them as needed. */
    private async crawlSubresources() {
        try {
            await this.result.processSubresources(this.config.processSubresource)
        } catch (error) {
            // If subresource crawling timed out or was aborted, continue with what we have.
            if (!this.config.signal?.aborted) throw error
        }
    }

    /** Make the DOM static and context-free. */
    private dryResource() {
        // TODO Allow customising the applied transformations. (and likewise for drying subresources)
        this.result.dry()
    }

    /** Finalise snapshot. */
    private finaliseSnapshot() {
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

    private applyDefaultConfig(
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
            processSubresource: this.defaultProcessSubresource.bind(this),
            fetchResource: undefined,
            newUrlForResource: this.defaultNewUrlForResource.bind(this),
            rememberOriginalUrls: true,

            // Other config
            docUrl: undefined,
            glob: doc.defaultView
                || (typeof window !== 'undefined' ? window : undefined)
                || fail('Lacking a global window object'),
        }
        const config: FreezeDryConfig = flatOptions(options, defaultOptions)

        if (config.timeout >= 0 && config.timeout < Infinity) {
            // The timeout option is merely a shorthand for a time-triggered AbortSignal.
            const glob = config.glob || globalThis
            const controller = new glob.AbortController()
            const signal = controller.signal
            glob.setTimeout(() => {
                controller.abort('Freeze-dry timed out')
            }, config.timeout)

            // If both a signal and a timeout are passed, abort at either’s command.
            if (config.signal) {
                const originalSignal = config.signal
                originalSignal.addEventListener('abort', event => controller.abort(originalSignal.reason))
            }

            config.signal = signal
        }

        return config
    }

    // Default callback for processing subresources. Recurses into each.
    private async defaultProcessSubresource(
        link: SubresourceLink,
        recurse: ProcessSubresourceRecurse,
    ) {
        // TODO Something like this, for synchronously cloning frame contents here instead of in step 1?
        // (We’d first have to make srcdoc-based frames turn up as (pseudo)subresources)
        // if (link.resource) link.resource.freeze?.()

        // Get the linked resource if missing (from cache/internet).
        if (!link.resource) {
            try {
                link.resource = await Resource.fromLink(link, this.config)
            } catch (err) {
                // TODO we may want to do something here. Turn target into about:invalid? For
                // now, we rely on the content security policy to prevent loading this resource.
                return
            }
        }

        // Recurse into this subresource’s subresources.
        // (`recurse` ≈ current function itself, but also facilitates logging progress etc.)
        await link.resource.processSubresources(recurse)

        // Make the resource static and context-free.
        link.resource.dry()

        // Change the link’s target to a new URL for the (now self-contained) subresource.
        const newUrl = await this.config.newUrlForResource(link.resource)
        if (newUrl !== link.target) setLinkTarget(link, newUrl, this.config)
    }

    private async defaultNewUrlForResource(resource: Resource) {
        return await blobToDataUrl(resource.blob, this.config)
    }
}

function fail(message: string): never {
    throw new Error(message)
}
