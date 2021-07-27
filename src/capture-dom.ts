import { pathForDomNode, domNodeAtPath } from './package'

import { HtmlDocumentLink } from './extract-links/types'
import { FrameElement, GlobalConfig } from './types'

export default function getFramedDoc(
    link: HtmlDocumentLink,
    config: Pick<GlobalConfig, 'getDocInFrame' | 'glob'>,
) {
    // Find the corresponding frame element in original document.
    const parentResource = link.from.resource
    const originalDoc = parentResource.originalDoc
    const frameElement = link.from.element

    const originalFrameElement = domNodeAtPath(
        pathForDomNode(frameElement, frameElement.ownerDocument),
        originalDoc,
    ) as FrameElement

    // Get the document inside the frame.
    const { getDocInFrame = defaultGetDocInFrame } = config
    const innerDoc = getDocInFrame(originalFrameElement)
    return innerDoc
}

function defaultGetDocInFrame(frameElement: FrameElement): Document | null {
    try {
        return frameElement.contentDocument
    } catch (err) {
        return null
    }
}
