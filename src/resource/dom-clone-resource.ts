import { pathForDomNode, domNodeAtPath } from '../package'

import type { GlobalConfig, UrlString, FrameElement } from "../types"
import { DomResource } from "."
import { HtmlDocumentLink } from '../extract-links/types'

type DomCloneResourceConfig = Pick<GlobalConfig, 'glob' | 'getDocInFrame'>

export class DomCloneResource extends DomResource {
    protected _config: DomCloneResourceConfig
    private _framesContentDocClones: Map<FrameElement, DomCloneResource | null>
    private _originalDoc: Document

    /**
     * @param url - Since the passed Document already has a property doc.URL, the url parameter is optional; if
     * passed it will override the value of doc.URL for determining the target of relative URLs.
     */
    constructor(
        url: UrlString | undefined,
        originalDoc: Document,
        config: DomCloneResourceConfig
    ) {
        const clone = originalDoc.cloneNode(/* deep = */ true) as Document

        super(url, clone, config)
        this._config = config
        this._originalDoc = originalDoc
        this._framesContentDocClones = new Map()

        // TODO Capture form input values (issue #19)
        // TODO Extract images from canvasses (issue #18)
        // etc..
    }

    get originalDoc(): Document {
        return this._originalDoc
    }

    getOriginalNode<T extends Node = Node>(nodeInClone: T) {
        const path = pathForDomNode(nodeInClone, this.doc)
        const originalNode = domNodeAtPath(path, this._originalDoc)
        return originalNode as T
    }

    getClonedNode<T extends Node = Node>(nodeInOriginal: T) {
        const path = pathForDomNode(nodeInOriginal, this._originalDoc)
        const originalNode = domNodeAtPath(path, this.doc)
        return originalNode as T
    }

    cloneFramedDocs(deep: boolean = false) {
        // TODO Get frames without a 'src' too (issue #25)
        const frameLinks = this.subresourceLinks.filter(
            link => link.subresourceType === 'document'
        ) as HtmlDocumentLink[]

        for (const link of frameLinks) {
            const clonedInnerDoc = this.getContentDocOfFrame(link.from.element)

            if (clonedInnerDoc !== null) {
                // Recurse to capture the framed document’s frames, if requested.
                if (deep) clonedInnerDoc.cloneFramedDocs(true)

                // Store the clone in link.resource. Unfortunately we cannot modify the read-only
                // attribute clonedFrameElement.contentDocument (its value will remain null).
                link.resource = clonedInnerDoc
            }
        }
    }

    /**
     * Get the clone of the framed Document for a given (i)frame element.
     *
     * As cloning a DOM does not clone the documents inside its frames (the `contentDocument` of a
     * frame in the cloned resource is null), this method lets you obtain a clone of the framed
     * document.
     *
     * On the first invocation, the frame content is cloned from the original document. Subsequent
     * invocations will return this same object.
     *
     * @param frameElement The frame element for which to get the inner document
     * @returns a clone of the document in the frame.
     */
    getContentDocOfFrame(frameElement: FrameElement): DomCloneResource | null {
        // Look up the corresponding frame element in the other (original/cloned) doc.
        let originalFrameElement, clonedFrameElement
        if (frameElement.ownerDocument === this.doc) {
            clonedFrameElement = frameElement
            originalFrameElement = this.getOriginalNode(frameElement)
        } else if (frameElement.ownerDocument === this._originalDoc) {
            clonedFrameElement = this.getClonedNode(frameElement)
            originalFrameElement = frameElement
        } else {
            throw new Error('Argument must be an element of either the original or the cloned document')
        }

        // Get/make the clone of the framed document.
        let clonedInnerDoc = this._framesContentDocClones.get(clonedFrameElement)
        if (clonedInnerDoc === undefined) {
            // Make the clone and memoise it.
            clonedInnerDoc = this._getContentDocOfFrame(originalFrameElement);
            this._framesContentDocClones.set(clonedFrameElement, clonedInnerDoc)
        }
        return clonedInnerDoc
    }

    private _getContentDocOfFrame(originalFrameElement: FrameElement) {
        const { getDocInFrame = defaultGetDocInFrame } = this._config
        const originalInnerDoc = getDocInFrame(originalFrameElement)
        if (originalInnerDoc !== null) {
            return new DomCloneResource(undefined, originalInnerDoc, this._config)
        } else {
            return null
        }
    }
}

function defaultGetDocInFrame(frameElement: FrameElement): Document | null {
    try {
        return frameElement.contentDocument
    } catch (err) {
        return null
    }
}
