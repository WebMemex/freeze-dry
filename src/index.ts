/* global window */
import { flatOptions } from './package'

import captureDom from './capture-dom'
import crawlSubresourcesOfDom from './crawl-subresources'
import dryResource from './dry-resources'
import createSingleFile from './create-single-file'
import { GlobalConfig } from './types/index'

/**
 * Freeze dry an HTML Document
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
 * @param {Date} [options.now] - Override the snapshot time (only relevant when addMetadata=true).
 * @param {Function} [options.fetchResource] - Custom function for fetching resources; should be
 * API-compatible with the global fetch(), but may also return { blob, url } instead of a Response.
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
        timeout: Infinity,
        docUrl: undefined,
        charsetDeclaration: 'utf-8',
        addMetadata: true,
        keepOriginalAttributes: true,
        now: new Date(),
        fetchResource: undefined,
        glob: options.glob // (not actually a 'default' value; but easiest to typecheck this way)
            || (doc.defaultView as typeof window | null)
            || (typeof window !== 'undefined' ? window : undefined)
            || fail('Lacking a global window object'),
    }
    const config: GlobalConfig = flatOptions(options, defaultOptions)

    // Step 1: Capture the DOM (as well as DOMs inside frames).
    const domResource = captureDom(doc, config)

    // TODO Allow continuing processing elsewhere (background script, worker, nodejs, ...)

    // Step 2: Fetch subresources, recursively.
    const subresources = crawlSubresourcesOfDom(domResource, config)

    // Step 3: "Dry" the resources to make them static and context-free.
    dryResource(domResource, config)
    const driedSubresources = pipe(subresources, resource => {
        dryResource(resource, config)
        return resource
    })

    // Step 4: Compile the resource tree to produce a single, self-contained string of HTML.
    const html = await createSingleFile(domResource, driedSubresources, config)

    return html
}

function fail(message: string): never {
    throw new Error(message)
}

async function * pipe<T,U>(source: AsyncIterable<T>, transform: (x: T) => U): AsyncIterable<U> {
    for await (const value of source) {
        yield transform(value)
    }
}
