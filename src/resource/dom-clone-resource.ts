import { pathForDomNode, domNodeAtPath } from '../package'

import { GlobalConfig, UrlString } from "../types"
import { DomResource } from "."

type DomResourceConfig = Pick<GlobalConfig, 'glob'>

export class DomCloneResource extends DomResource {
    private _originalDoc: Document

    /**
     * @param url - Since the passed Document already has a property doc.URL, the url parameter is optional; if
     * passed it will override the value of doc.URL for determining the target of relative URLs.
     */
    constructor(
        url: UrlString | undefined,
        originalDoc: Document,
        config: DomResourceConfig
    ) {
        const clone = originalDoc.cloneNode(/* deep = */ true) as Document

        super(url, clone, config)

        // TODO Capture form input values (issue #19)
        // TODO Extract images from canvasses (issue #18)
        // etc..

        this._originalDoc = originalDoc
    }

    get originalDoc(): Document {
        return this._originalDoc
    }

    getOriginalNode<T extends Node = Node>(nodeInClone: T) {
        const path = pathForDomNode(nodeInClone, this.doc)
        const originalNode = domNodeAtPath(path, this._originalDoc)
        return originalNode as T
    }
}
