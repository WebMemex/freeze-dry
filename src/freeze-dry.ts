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
 * @param {Document} [doc=window.document] - HTML Document to be freeze-dried. Remains unmodified.
 * @param {Object} [options]
 * @param {number} [options.timeout=Infinity] - Maximum time (in milliseconds) spent on fetching the
 * page's subresources. The resulting HTML will have only succesfully fetched subresources inlined.
 * @param {AbortSignal} [options.signal] - Signal to abort subresource fetching at any moment. As
 * with `timeout`, the resulting HTML will have only succesfully fetched subresources inlined.
 * @param {string} [options.docUrl] - URL to override doc.URL.
 * @param {string} [options.charsetDeclaration='utf-8'] - The value put into the <meta charset="…">
 * element of the snapshot. If you will store/serve the returned string using an encoding other than
 * UTF8, pass its name here; or pass null or an empty string to omit the declaration altogether.
 * @param {boolean} [options.addMetadata=true] - Whether to note the snapshotting time and the
 * document's URL in an extra meta and link tag.
 * @param {boolean} [options.rememberOriginalUrls=true] - Whether to preserve the value of an
 * element attribute if its URLs are inlined, by noting it as a new 'data-original-...' attribute.
 * For example, <img src="bg.png"> would become <img src="data:..." data-original-src="bg.png">.
 * Note this is an unstandardised workaround to keep URLs of subresources available; unfortunately
 * URLs inside stylesheets are still lost.
 * @param {boolean} [options.contentSecurityPolicy='…'] - Add a `<meta>` tag with the given content
 * security policy to the snapshot. The default value disallows loading any external resources.
 * @param {Date} [options.now] - Override the snapshot time (only relevant when addMetadata=true).
 * @param {Function} [options.fetchResource] - Custom function for fetching resources; should be
 * API-compatible with the global fetch(), but may also resolve to an object { blob, url } instead
 * of a Response.
 * @param {Function} [options.processSubresource] - Callback invoked for each of `doc`’s subresources.
 * Default behaviour is to recursively ‘dry’ subresources and turn each into a data URL.
 * @param {Function} [options.newUrlForResource] - Callback to determine the replacement URL for a
 * (processed, dried) subresource; defaults to creating a data URL. If `processSubresource` is
 * also given, this option is ignored.
 * @param {Window} [options.glob] - Overrides the global window object that is used for accessing
 * global DOM interfaces. Defaults to doc.defaultView or (if that is absent) the global `window`.
 * @returns {string} html - The freeze-dried document as a self-contained, static string of HTML.
 */
export default async function freezeDry(
    doc: Document = typeof window !== 'undefined' && window.document
        || fail('No document given to freeze-dry'),
    options: Partial<GlobalConfig> = {},
): Promise<string> {
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
        fetchResource: undefined,
        processSubresource: defaultProcessSubresource,
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

        // TODO Should the below go into the parent resource’s dry() function?
        // Change the link’s target to a new URL for the (now self-contained) subresource.
        const newUrl = await config.newUrlForResource(link.resource)
        if (newUrl !== link.target) setLinkTarget(link, newUrl, config)
    }

    async function defaultNewUrlForResource(resource: Resource) {
        return await blobToDataUrl(resource.blob, config)
    }

    // Configuration done. Start freeze-drying!

    // Step 1: Capture the DOM in its current state.
    const domResource = new DomCloneResource(config.docUrl, doc, config)
    domResource.cloneFramedDocs(/* deep = */ true)

    // Step 2: Recurse into subresources, converting them as needed.
    try {
        await domResource.processSubresources(config.processSubresource)
    } catch (error) {
        // If subresource crawling timed out or was aborted, continue with what we have.
        if (!config.signal?.aborted) throw error
    }

    // Step 3: Make the DOM static and context-free.
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

function fail(message: string): never {
    throw new Error(message)
}
