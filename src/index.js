import captureDom from './capture-dom'
import crawlSubresourcesOfDom from './crawl-subresources'
import dryResources from './dry-resources'
import createSingleFile from './create-single-file'

/**
 * Freeze dry an HTML Document
 * @param {Document} [doc=window.document] - HTML Document to be freeze-dried. Remains unmodified.
 * @param {Object} [options]
 * @param {string} [options.docUrl] - URL to override doc.URL.
 * @returns {string} html - The freeze-dried document as a self-contained, static string of HTML.
 */
export default async function freezeDry(doc = window.document, { docUrl } = {} ) {
    // Step 1: Capture the DOM (as well as DOMs inside frames).
    const resource = captureDom(doc, { docUrl })

    // TODO Allow continuing processing elsewhere (background script, worker, nodejs, ...)

    // Step 2: Fetch subresources, recursively.
    await crawlSubresourcesOfDom(resource)

    // Step 3: "Dry" the resources to make them static and context-free.
    dryResources(resource)

    // Step 4: Compile the resource tree to produce a single, self-contained string of HTML.
    const html = await createSingleFile(resource)

    return html
}
