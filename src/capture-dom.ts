import { documentOuterHTML, pathForDomNode, domNodeAtPath } from './package'

import { extractLinksFromDom } from './extract-links/index'
import { HtmlDocumentLink, HtmlLink } from './extract-links/types'
import { UrlString, FrameElement, DomResource } from './types/index'

/**
 * Clones the DOM and DOMs inside its frames (recursively), wraps them in a resource object.
 * @param {Document} doc - the DOM to be captured; remains unmodified.
 * @param {Object} [options]
 * @param {string} [options.docUrl] - URL to override doc.URL, to influence interpretation of
 * relative URLs.
 * @param {(frame: Element) => ?Document} [getDocInFrame] - customises how to obtain an (i)frame's
 * contentDocument. Defaults to simply trying to access frame.contentDocument. Should return null if
 * accessing the contentDocument fails.
 * @returns {Object} resource - the resource object representing the DOM with its subresources.
 */
export default function captureDom(
    originalDoc: Document,
    {
        docUrl,
        getDocInFrame = defaultGetDocInFrame,
    } : {
        docUrl?: UrlString,
        getDocInFrame?: (frameElement: FrameElement) => Document | null,
    } = {},
): DomResource {
    // The first step is about grabbing everything that we need access to the original DOM for.
    // Think documents in frames, current values of form inputs, canvas state..
    // We make clones of everything we need, so in the next step we can do async stuff without
    // worrying about the DOM changing.

    // Clone the document
    const clonedDoc = originalDoc.cloneNode(/* deep = */ true) as Document

    // Extract all links. With links we mean both the usual 'hyperlinks' and links to subresources.
    // We only really need the frame links in this step, but extract all as we will need them later.
    const links = extractLinksFromDom(clonedDoc, { docUrl })

    // Capture the DOM inside every frame (recursively).
    const frameLinks: HtmlDocumentLink[] = links.filter((
        link => link.isSubresource && link.subresourceType === 'document'
    ) as (link: HtmlLink) => link is HtmlDocumentLink) // (this type assertion should not be necessary; bug in TypeScript?)
    frameLinks.forEach(link => {
        // Find the corresponding frame element in original document.
        const clonedFrameElement = link.from.element
        const originalFrameElement = domNodeAtPath(
            pathForDomNode(clonedFrameElement, clonedDoc),
            originalDoc,
        )

        // Get the document inside the frame.
        const innerDoc = getDocInFrame(originalFrameElement)
        if (innerDoc) {
            // Recurse!
            const innerDocResource = captureDom(innerDoc, {
                // If our docUrl was overridden, override the frame's URL too. Might be wrong in
                // case of redirects however. TODO Figure out desired behaviour.
                docUrl: docUrl !== undefined ? link.absoluteTarget : undefined,
            })
            // Associate this subresource with the link object.
            link.resource = innerDocResource
        } else {
            // We cannot access the frame content's current state (e.g. due to same origin policy).
            // We will fall back to refetching the inner document while crawling the subresources.
        }
    })

    // TODO Capture form input values
    // TODO Extract images from canvasses

    return {
        url: docUrl || originalDoc.URL,
        doc: clonedDoc,
        get blob() { return new Blob([this.string], { type: 'text/html' }) },
        get string() {
            // TODO Add <meta charset> if absent? Or html-encode characters as needed?
            return documentOuterHTML(clonedDoc)
        },
        links, // TODO should links be a getter that extracts the links again?
    }
}

function defaultGetDocInFrame(frameElement: FrameElement): Document | null {
    try {
        return frameElement.contentDocument
    } catch (err) {
        return null
    }
}
