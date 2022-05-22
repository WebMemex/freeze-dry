/* global window */
import { flatOptions } from './package'

import type { GlobalConfig, ProcessSubresourceRecurse } from './types/index'
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
    options: Partial<GlobalConfig> = {},
): Promise<string> {
    const config = applyDefaultConfig(doc, options)

    // Step 1: Capture the DOM in its current state.
    const domResource = new DomCloneResource(doc, config.docUrl, config)
    domResource.cloneFramedDocs(/* deep = */ true)

    // Step 2: Recurse into subresources, converting them as needed.
    try {
        await domResource.processSubresources(config.processSubresource)
    } catch (error) {
        // If subresource crawling timed out or was aborted, continue with what we have.
        if (!config.signal?.aborted) throw error
    }

    // Step 3: Make the DOM static and context-free.
    // TODO Allow customising the applied transformations. (and likewise for drying subresources)
    domResource.dry()

    // Step 4: Finalise snapshot.
    // Step 4.1: Add metadata about the snapshot to the snapshot itself.
    if (config.addMetadata)
        setMementoTags(domResource.doc, { originalUrl: domResource.url, datetime: config.now })
    // Step 4.2: Set a strict Content Security Policy in a <meta> tag.
    if (config.contentSecurityPolicy !== null)
        setContentSecurityPolicy(domResource.doc, config.contentSecurityPolicy)
    // Step 4.3: Create/replace the <meta charset=…> element.
    if (config.charsetDeclaration !== undefined)
        setCharsetDeclaration(domResource.doc, config.charsetDeclaration)

    // Return the snapshot as a single string of HTML
    const html = domResource.string
    return html
}

function applyDefaultConfig(
    doc: Document,
    options: Partial<GlobalConfig>,
): GlobalConfig {
    // Configure things.
    const defaultOptions: GlobalConfig = {
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
        processSubresource: defaultProcessSubresource,
        fetchResource: undefined,
        newUrlForResource: defaultNewUrlForResource,
        rememberOriginalUrls: true,

        // Other config
        docUrl: undefined,
        glob: doc.defaultView
            || (typeof window !== 'undefined' ? window : undefined)
            || fail('Lacking a global window object'),
    }
    const config: GlobalConfig = flatOptions(options, defaultOptions)

    if (config.timeout >= 0 && config.timeout < Infinity) {
        // The timeout option is merely a shorthand for a time-triggered AbortSignal.
        const controller = new AbortController()
        const signal = controller.signal
        const glob = config.glob || globalThis
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

    // Default callback for processing subresources. Recurses into each.
    async function defaultProcessSubresource(
        link: SubresourceLink,
        recurse: ProcessSubresourceRecurse,
    ) {
        // TODO Something like this, for synchronously cloning frame contents here instead of in step 1?
        // (We’d first have to make srcdoc-based frames turn up as (pseudo)subresources)
        // if (link.resource) link.resource.freeze?.()

        // Get the linked resource if missing (from cache/internet).
        if (!link.resource) {
            try {
                link.resource = await Resource.fromLink(link, config)
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
        const newUrl = await config.newUrlForResource(link.resource)
        if (newUrl !== link.target) setLinkTarget(link, newUrl, config)
    }

    async function defaultNewUrlForResource(resource: Resource) {
        return await blobToDataUrl(resource.blob, config)
    }

    return config
}

function fail(message: string): never {
    throw new Error(message)
}
