import captureDom from './capture-dom'
import crawlSubresourcesOfDom from './crawl-subresources'
import dryResources from './dry-resources'
import createSingleFile from './create-single-file'
import { UrlString, Fetchy } from './types/index'

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
 * @returns {string} html - The freeze-dried document as a self-contained, static string of HTML.
 */
export default async function freezeDry(doc: Document = window.document, {
    timeout = Infinity,
    docUrl,
    charsetDeclaration = 'utf-8',
    addMetadata = true,
    keepOriginalAttributes = true,
    fetchResource,
    now = new Date(),
} : {
    timeout?: number,
    docUrl?: UrlString,
    charsetDeclaration?: string | null,
    addMetadata?: boolean,
    keepOriginalAttributes?: boolean,
    fetchResource?: Fetchy,
    now?: Date,
} = {}): Promise<string> {
    // Step 1: Capture the DOM (as well as DOMs inside frames).
    const resource = captureDom(doc, { docUrl })

    // TODO Allow continuing processing elsewhere (background script, worker, nodejs, ...)

    // Step 2: Fetch subresources, recursively.
    await maxWait(timeout)(crawlSubresourcesOfDom(resource, { fetchResource }))
    // TODO Upon timeout, abort the pending fetches on platforms that support this.

    // Step 3: "Dry" the resources to make them static and context-free.
    dryResources(resource)

    // Step 4: Compile the resource tree to produce a single, self-contained string of HTML.
    const html = await createSingleFile(resource, {
        charsetDeclaration,
        addMetadata,
        keepOriginalAttributes,
        snapshotTime: now,
    })

    return html
}

const maxWait: (timeout: number) => <T>(promise: Promise<T>) => Promise<T | undefined> =
    timeout => timeout === Infinity
        ? promise => promise
        : promise => Promise.race([
            promise,
            new Promise(resolve => setTimeout(resolve, timeout)) as Promise<undefined>,
        ])
