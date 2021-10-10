import { pathForDomNode, domNodeAtPath } from '../package'

import type { GlobalConfig, UrlString, FrameElement } from "../types"
import { DomResource } from "."
import { HtmlDocumentLink } from '../extract-links/types'

type DomCloneResourceConfig = Pick<GlobalConfig, 'glob' | 'getDocInFrame'>

export class DomCloneResource extends DomResource {
    private _originalDoc: Document
    protected _config: DomCloneResourceConfig

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

    getContentDocOfFrame(clonedFrameElement: FrameElement): DomCloneResource | null {
        // TODO Memoise result in a map FrameElement→DomCloneResource
        const { getDocInFrame = defaultGetDocInFrame } = this._config
        const originalFrameElement = this.getOriginalNode(clonedFrameElement)
        const originalInnerDoc = getDocInFrame(originalFrameElement)
        if (originalInnerDoc !== null) {
            const clonedInnerDoc = new DomCloneResource(
                undefined,
                originalInnerDoc,
                this._config,
            )
            return clonedInnerDoc
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
