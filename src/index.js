import captureDom from './capture-dom'
import crawlSubresourcesOfDom from './crawl-subresources'
import dryResources from './dry-resources'
import createSingleFile from './create-single-file'

/**
 * Freeze dry an HTML Document
 * @param {Document} [doc=window.document] - HTML Document to be freeze-dried. Remains unmodified.
 * @param {Object} [options]
 * @param {number} [options.timeout=Infinity] - Maximum time (in milliseconds) spent on fetching the
 * page's subresources. The resulting HTML will have only succesfully fetched subresources inlined.
 * @param {string} [options.docUrl] - URL to override doc.URL.
 * @param {boolean} [options.addMetadata=true] - Whether to note the snapshotting time and the
 * document's URL in an extra meta and link tag.
 * @param {boolean} [options.keepOriginalAttributes=true] - Whether to preserve the value of an
 * element attribute if its URLs are inlined, by noting it as a new 'data-original-...' attribute.
 * For example, <img src="bg.png"> would become <img src="data:..." data-original-src="bg.png">.
 * Note this is an unstandardised workaround to keep URLs of subresources available; unfortunately
 * URLs inside stylesheets are still lost.
 * @param {Date} [options.now] - Override the snapshot time (only relevant when addMetadata=true).
 * @param {Function} [options.fetchResource] - function API compatible with fetch (default) for fetching resources.
 * @returns {string} html - The freeze-dried document as a self-contained, static string of HTML.
 */
export default async function freezeDry(doc = window.document, {
    timeout = Infinity,
    docUrl,
    addMetadata = true,
    keepOriginalAttributes = true,
    fetchResource = self.fetch,
    now = new Date(),
} = {}) {
    // Step 1: Capture the DOM (as well as DOMs inside frames).
    const resource = captureDom(doc, { docUrl })

    // TODO Allow continuing processing elsewhere (background script, worker, nodejs, ...)

    // Step 2: Fetch subresources, recursively.
    await maxWait(timeout)(crawlSubresourcesOfDom(resource, {fetchResource}))
    // TODO Upon timeout, abort the pending fetches on platforms that support this.

    // Step 3: "Dry" the resources to make them static and context-free.
    dryResources(resource)

    // Step 4: Compile the resource tree to produce a single, self-contained string of HTML.
    const html = await createSingleFile(resource, {
        addMetadata,
        keepOriginalAttributes,
        snapshotTime: now,
    })

    return html
}

const maxWait = timeout => timeout === Infinity
    ? promise => promise
    : promise => Promise.race([
        promise,
        new Promise(resolve => setTimeout(resolve, timeout)),
    ])
