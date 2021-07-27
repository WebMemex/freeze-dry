import { pathForDomNode, domNodeAtPath } from './package'

import { HtmlDocumentLink, HtmlLink } from './extract-links/types'
import { FrameElement, GlobalConfig } from './types'
import { DomResource } from './resource'

/**
 * Clones the DOM and DOMs inside its frames (recursively), wraps them in a resource object.
 * @param {Document} doc - the DOM to be captured; remains unmodified.
 * @param {Object} [config]
 * @returns {Object} resource - the resource object representing the DOM with its subresources.
 */

type CaptureDomConfig = Pick<GlobalConfig, 'docUrl' | 'getDocInFrame' | 'glob'>

export default function captureDom(
    originalDoc: Document,
    config: CaptureDomConfig,
): DomResource {
    // Grab everything that we need access to the original DOM for. Think documents in frames,
    // current values of form inputs, canvas state.. We make clones of everything we need, so that
    // after this we can do async stuff without worrying about the DOM changing.

    const domResource = DomResource.clone({ url: config.docUrl, doc: originalDoc, config })

    crawlFramedDocuments(domResource, originalDoc, config)

    return domResource
}

function crawlFramedDocuments(
    domResource: DomResource,
    originalDoc: Document,
    config: CaptureDomConfig,
): DomResource[] {
    // Capture the DOM inside every frame (recursively).
    // TODO change frame grabbing approach to also get frames with srcdoc instead of src (issue #25)
    const frameLinks = getLinksToCrawl(domResource)
    return frameLinks.flatMap(
        link => crawlFrameLink(link, originalDoc, config)
    )
}

function getLinksToCrawl(domResource: DomResource) {
    const frameLinks: HtmlDocumentLink[] = domResource.links.filter((
        (link: HtmlLink): link is HtmlDocumentLink =>
            link.isSubresource && link.subresourceType === 'document'
    ))
    return frameLinks
}

function crawlFrameLink(
    link: HtmlDocumentLink,
    originalDoc: Document,
    config: CaptureDomConfig,
): DomResource[] {
    // Find the corresponding frame element in original document.
    const frameElement = link.from.element
    const originalFrameElement = domNodeAtPath(
        pathForDomNode(frameElement, frameElement.ownerDocument),
        originalDoc,
    ) as FrameElement

    // Get the document inside the frame.
    const { getDocInFrame = defaultGetDocInFrame } = config
    const innerDoc = getDocInFrame(originalFrameElement)
    if (!innerDoc) {
        // We cannot access the frame content's current state (e.g. due to same origin policy).
        // We can later still refetch the inner document while crawling the subresources.
        return []
    }
    link.resource = DomResource.clone({ doc: innerDoc, config })

    // Return this document and any others inside of it (recursively).
    const framedDocuments = crawlFramedDocuments(link.resource, innerDoc, config)
    return [link.resource, ...framedDocuments]
}

function defaultGetDocInFrame(frameElement: FrameElement): Document | null {
    try {
        return frameElement.contentDocument
    } catch (err) {
        return null
    }
}
