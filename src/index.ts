/* global window */
import { flatOptions } from './package'

import dryResource from './dry-resources'
import type { GlobalConfig, ProcessLinkRecurse } from './types/index'
import type { SubresourceLink } from './extract-links/types'
import fetchSubresource from './fetch-subresource'
import finaliseSnapshot from './finalise-snapshot'
import blobToDataUrl from './blob-to-data-url'
import setLinkTarget from './set-link-target'
import { DomCloneResource } from './resource/dom-clone-resource'

/**
 * Freeze-dry an HTML Document
 * @param {Document} [doc=window.document] - HTML Document to be freeze-dried. Remains unmodified.
 * @param {Object} [options]
 * @param {number} [options.timeout=Infinity] - Maximum time (in milliseconds) spent on fetching the
 * page's subresources. The resulting HTML will have only succesfully fetched subresources inlined.
 * @param {string} [options.docUrl] - URL to override doc.URL.
 * @param {string} [options.charsetDeclaration='utf-8'] - The value put into the <meta charset="…">
 * element of the snapshot. If you will store/serve the returned string using an encoding other than
 * UTF8, pass its name here; or pass null or an empty string to omit the declaration altogether.
 * @param {boolean} [options.addMetadata=true] - Whether to note the snapshotting time and the
 * document's URL in an extra meta and link tag.
 * @param {boolean} [options.keepOriginalAttributes=true] - Whether to preserve the value of an
 * element attribute if its URLs are inlined, by noting it as a new 'data-original-...' attribute.
 * For example, <img src="bg.png"> would become <img src="data:..." data-original-src="bg.png">.
 * Note this is an unstandardised workaround to keep URLs of subresources available; unfortunately
 * URLs inside stylesheets are still lost.
 * @param {boolean} [options.setContentSecurityPolicy=true] - Whether to add a <meta> tag with a
 * content security policy that disallows the page to load any external resources.
 * @param {Date} [options.now] - Override the snapshot time (only relevant when addMetadata=true).
 * @param {Function} [options.fetchResource] - Custom function for fetching resources; should be
 * API-compatible with the global fetch(), but may also resolve to an object { blob, url } instead
 * of a Response.
 * @param {Window} [options.glob] - Overrides the global window object that is used for accessing
 * global DOM interfaces. Defaults to doc.defaultView or (if that is absent) the global `window`.
 * @returns {string} html - The freeze-dried document as a self-contained, static string of HTML.
 */
export default async function freezeDry(
    doc: Document = typeof window !== 'undefined' && window.document
        || fail('No document given to freeze-dry'),
    options: Partial<GlobalConfig> = {},
): Promise<string> {
    const defaultOptions: GlobalConfig = {
        processLink: defaultProcessLink,
        timeout: Infinity,
        docUrl: undefined,
        charsetDeclaration: 'utf-8',
        addMetadata: true,
        keepOriginalAttributes: true,
        setContentSecurityPolicy: true,
        now: new Date(),
        fetchResource: undefined,
        glob: options.glob // (not actually a 'default' value; but easiest to typecheck this way)
            || doc.defaultView
            || (typeof window !== 'undefined' ? window : undefined)
            || fail('Lacking a global window object'),
    }
    const config: GlobalConfig = flatOptions(options, defaultOptions)

    // Step 1: Capture the DOM.
    const domResource = new DomCloneResource(config.docUrl, doc, config)
    // TODO avoid recursing here, and let processLink recursion handle that?
    domResource.cloneFramedDocs(/* deep = */ true)

    // Step 2: Make the DOM static and context-free.
    dryResource(domResource, config)

    // Step 3: Recurse into subresources, converting them as needed.
    async function processLinkWrapper(link: SubresourceLink, config: GlobalConfig) {
        // TODO some debug logging
        // TODO some progress tick allowing to get the incomplete result

        // Allow config to be modified during recursion, but default to passing it through.
        async function recurse(link: SubresourceLink, _config = config) {
            await processLinkWrapper(link, _config)
        }

        await config.processLink(link, config, recurse)
    }
    await Promise.all(domResource.subresourceLinks.map(
        link => processLinkWrapper(link, config)
    ))

    // Step 4: Finalise (e.g. stamp some <meta> tags onto the page)
    finaliseSnapshot(domResource, config)

    // Return it as a single string of HTML
    const html = domResource.string
    return html
}

function fail(message: string): never {
    throw new Error(message)
}

async function defaultProcessLink(
    link: SubresourceLink,
    config: GlobalConfig,
    recurse: ProcessLinkRecurse,
) {
    // Get the linked resource if missing (from cache/internet).
    if (!link.resource) {
        try {
            link.resource = await fetchSubresource(link, config)
        } catch (err) {
            // TODO we may want to do something here. Turn target into about:invalid? For
            // now, we rely on the content security policy to prevent loading this resource.
            return
        }
    }

    // Make the resource static and context-free.
    dryResource(link.resource, config)

    // Recurse: process this resource’s subresources.
    await Promise.all(link.resource.subresourceLinks.map(
        link => recurse(link)
    ))

    // Convert the (now self-contained) subresource into a data URL.
    const dataUrl = await blobToDataUrl(link.resource.blob, config)

    // Change the link’s target to the data URL.
    setLinkTarget(link, dataUrl, config)
}
