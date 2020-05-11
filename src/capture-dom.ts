import { pathForDomNode, domNodeAtPath } from './package'

import { HtmlDocumentLink, HtmlLink } from './extract-links/types'
import { FrameElement, GlobalConfig } from './types'
import { DomResource } from './resource'

/**
 * Clones the DOM and DOMs inside its frames (recursively), wraps them in a resource object.
 * @param {Document} doc - the DOM to be captured; remains unmodified.
 * @param {Object} [config]
 * @param {string} [config.docUrl] - URL to override doc.URL, to influence interpretation of
 * relative URLs.
 * @param {(frame: Element) => ?Document} [getDocInFrame] - customises how to obtain an (i)frame's
 * contentDocument. Defaults to simply trying to access frame.contentDocument. Should return null if
 * accessing the contentDocument fails.
 * @returns {Object} resource - the resource object representing the DOM with its subresources.
 */

export default function captureDom(
    originalDoc: Document,
    config: Pick<GlobalConfig, 'docUrl' | 'getDocInFrame' | 'glob'>,
): DomResource {
    // The first step is about grabbing everything that we need access to the original DOM for.
    // Think documents in frames, current values of form inputs, canvas state..
    // We make clones of everything we need, so in the next step we can do async stuff without
    // worrying about the DOM changing.

    // Clone the document
    const clonedDoc = originalDoc.cloneNode(/* deep = */ true) as Document

    const domResource = new DomResource(clonedDoc, config)

    // Capture the DOM inside every frame (recursively).
    const frameLinks: HtmlDocumentLink[] = domResource.links.filter((
        link => link.isSubresource && link.subresourceType === 'document'
    ) as (link: HtmlLink) => link is HtmlDocumentLink) // (this type assertion should not be necessary; bug in TypeScript?)
    frameLinks.forEach(link => {
        // Find the corresponding frame element in original document.
        const clonedFrameElement = link.from.element
        const originalFrameElement = domNodeAtPath(
            pathForDomNode(clonedFrameElement, clonedDoc),
            originalDoc,
        ) as FrameElement

        // Get the document inside the frame.
        const { getDocInFrame = defaultGetDocInFrame } = config
        const innerDoc = getDocInFrame(originalFrameElement)
        if (innerDoc) {
            // Recurse!
            const innerDocResource = captureDom(innerDoc, {
                ...config,
                // If our docUrl was overridden, override the frame's URL too. Might be wrong in
                // case of redirects however. TODO Figure out desired behaviour.
                docUrl: config.docUrl !== undefined ? link.absoluteTarget : undefined,
            })
            // Associate this subresource with the link object.
            link.resource = innerDocResource
        } else {
            // We cannot access the frame content's current state (e.g. due to same origin policy).
            // We will fall back to refetching the inner document while crawling the subresources.
        }
    })

    // TODO change frame grabbing approach to also get frames with srcdoc instead of src (issue #25)
    // TODO Capture form input values (issue #19)
    // TODO Extract images from canvasses (issue #18)
    // etc..

    return domResource
}

function defaultGetDocInFrame(frameElement: FrameElement): Document | null {
    try {
        return frameElement.contentDocument
    } catch (err) {
        return null
    }
}
