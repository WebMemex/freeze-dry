import { HtmlDocumentLink } from './extract-links/types'
import { FrameElement, GlobalConfig } from './types'
import { DomCloneResource } from './resource/dom-clone-resource'

export default function getFramedDoc(
    link: HtmlDocumentLink,
    config: Pick<GlobalConfig, 'getDocInFrame' | 'glob'>,
) {
    // Find the corresponding frame element in original document.
    const parentResource = link.from.resource
    if (parentResource instanceof DomCloneResource) {
        const frameElement = link.from.element
        const originalFrameElement = parentResource.getOriginalNode(frameElement)

        // Get the document inside the frame.
        const { getDocInFrame = defaultGetDocInFrame } = config
        const innerDoc = getDocInFrame(originalFrameElement)
        return innerDoc
    } else {
        return null
    }
}

function defaultGetDocInFrame(frameElement: FrameElement): Document | null {
    try {
        return frameElement.contentDocument
    } catch (err) {
        return null
    }
}
