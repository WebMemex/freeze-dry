import { pathForDomNode, domNodeAtPath } from '../package'

import type { GlobalConfig, UrlString, FrameElement } from '../types'
import { DomResource } from '.'
import type { HtmlDocumentLink } from '../extract-links/types'

/**
 * DomCloneResource represents an HTML document, but works on a clone of the DOM it was given.
 *
 * It allows a web page to be snapshotted in its current state, after which modifications to the
 * original DOM or the clone do not influence the other.
 *
 * The original document is cloned at construction time. Its frames can be (recursively) cloned
 * with {@link cloneFramedDocs}.
 *
 * See its parent class {@link DomResource} for further info.
 *
 * @example
 * const domResource = new DomCloneResource(window.document)
 * domResource.cloneFramedDocs(true)
 */
export class DomCloneResource extends DomResource {
    private _framesContentDocClones: Map<FrameElement, DomCloneResource | null>
    private _originalDoc: Document

    /**
     * @param originalDoc - The Document to clone.
     * @param url - Since the passed Document already has a property `doc.URL`, the `url` parameter
     * is optional; if passed it will override the value of `doc.URL` when determining the target of
     * relative URLs.
     * @param config - Optional environment configuration.
     */
    constructor(
        originalDoc: Document,
        url?: UrlString,
        config: GlobalConfig = {},
    ) {
        const clone = originalDoc.cloneNode(/* deep = */ true) as Document

        super(clone, url, config)
        this._originalDoc = originalDoc
        this._framesContentDocClones = new Map()

        // TODO Capture form input values (issue #19)
        // TODO Extract images from canvasses (issue #18)
        // etc..
    }

    /**
     * The clone of the Document.
     */
    override get doc(): Document {
        return super.doc
    }

    /**
     * The Document that was cloned.
     */
    get originalDoc(): Document {
        return this._originalDoc
    }

    /**
     * Get the original node corresponding to a given node in the document clone.
     */
    getOriginalNode<T extends Node = Node>(nodeInClone: T) {
        const path = pathForDomNode(nodeInClone, this.doc)
        const originalNode = domNodeAtPath(path, this._originalDoc)
        return originalNode as T
    }

    /**
     * Get the cloned node corresponding to a given node in the original document.
     */
    getClonedNode<T extends Node = Node>(nodeInOriginal: T) {
        const path = pathForDomNode(nodeInOriginal, this._originalDoc)
        const originalNode = domNodeAtPath(path, this.doc)
        return originalNode as T
    }

    /**
     * Create a DomCloneResource for each document in an (i)frame in the original document.
     *
     * The created clones are associated with the (i)frame elements. To access a clone, use
     * {@link getContentDocOfFrame}.
     *
     * @param deep - If `true`, also clone any frames inside the frames, recursively.
     */
    cloneFramedDocs(deep: boolean = false) {
        // Get all (i)frames (filter by HTMLElement, just to be sure; did SVG invent frames yet?)
        const glob = this._config.glob || globalThis
        const clonedFrames: FrameElement[] = Array.from(
            this.doc.querySelectorAll('frame,iframe')
        ).filter(element => element instanceof glob.HTMLElement) as FrameElement[]

        // Get all links defined by frames
        const frameLinks = this.subresourceLinks.filter(
            link => link.subresourceType === 'document'
        ) as HtmlDocumentLink[]

        for (const clonedFrame of clonedFrames) {
            // Capture the frame contents from the original document.
            const clonedInnerDoc = this.getContentDocOfFrame(clonedFrame)
            if (clonedInnerDoc !== null) {
                // Recurse to capture the framed document’s frames, if requested.
                if (deep) clonedInnerDoc.cloneFramedDocs(true)

                // For frames that define a link (i.e. frames with a src attribute), tag the link
                // with its target and source resources.
                const link = frameLinks.find(link => link.from.element === clonedFrame)
                if (link) {
                    // If content doc is defined by the `srcdoc`, don’t tag it to the `src` link.
                    if (clonedInnerDoc.url !== 'about:srcdoc') link.resource = clonedInnerDoc
                    link.from.resource = this
                }
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
     * @param frameElement The frame element for which to get the inner document. Either the frame
     * of the original or of the cloned document can be passed.
     * @returns A clone of the document in the frame.
     */
    override getContentDocOfFrame(frameElement: FrameElement): DomCloneResource | null {
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
        const originalInnerDoc = getDocInFrame(originalFrameElement)
        if (originalInnerDoc !== null) {
            return new DomCloneResource(originalInnerDoc, undefined, this._config)
        } else {
            return null
        }
    }
}

function getDocInFrame(frameElement: FrameElement): Document | null {
    try {
        return frameElement.contentDocument
    } catch (err) {
        return null
    }
}
