import { documentOuterHTML } from "../package"
import { Resource } from "./resource"
import type { HtmlLink } from "../extract-links/types"
import type { GlobalConfig, UrlString, FrameElement } from "../types"
import { extractLinksFromDom } from "../extract-links"
import { blobToText } from "./util"
import makeDomStatic from "../make-dom-static"

type DomResourceConfig = Pick<GlobalConfig, 'glob'>

export class DomResource extends Resource {
    private _url: UrlString | undefined
    private _doc: Document
    protected _config: DomResourceConfig
    private _linksInDom: HtmlLink[]

    /**
     * @param url - Since the passed Document already has a property doc.URL, the url parameter is
     * optional; if passed it will override the value of doc.URL when determining the target of
     * relative URLs.
     */
    constructor(url: UrlString | undefined, doc: Document, config: DomResourceConfig)

    constructor(url: UrlString, html: string, config: DomResourceConfig)

    constructor(
        url: UrlString | undefined,
        docOrHtml: Document | string,
        config: DomResourceConfig
    ) {
        super()
        const doc = (typeof docOrHtml === 'string')
            ? (new config.glob.DOMParser()).parseFromString(docOrHtml, 'text/html')
            : docOrHtml
        this._url = url
        this._doc = doc
        this._config = config
        this._linksInDom = extractLinksFromDom(doc, { docUrl: url })
        for (const link of this._linksInDom) link.from.resource = this
    }

    // Holds the Document object.
    get doc(): Document {
        return this._doc
    }

    get url(): UrlString {
        return this._url ?? this._doc.URL
    }

    get blob(): Blob {
        return new this._config.glob.Blob([this.string], { type: 'text/html' })
    }

    // The DOM as a string (i.e. the document's outerHTML)
    get string(): string {
        // TODO Add <meta charset> if absent? Or html-encode characters as needed?
        return documentOuterHTML(this._doc)
    }

    get links(): HtmlLink[] {
        // Return links directly contained in the document itself, as well as in its iframes with a
        // srcdoc (because such iframes are not treated as subresources)
        const allLinks = [
            ...this.linksInDom,
            ...this.iframeSrcDocs.flatMap(resource => resource.links),
            // TODO Treat inline css, svg, and/or other URL-less ‘pseudo’-resources similarly?
        ]
        return allLinks
    }

    /**
     * The links contained directly in the DOM itself, i.e. excluding those in documents in iframes.
     */
    get linksInDom(): HtmlLink[] {
        // TODO should we extract the links again, in case the document changed?
        return this._linksInDom
    }

    /**
     * A list of DomResources corresponding to documents in iframes with the `srcdoc` attribute
     * (note that these documents are not considered subresources).
     */
    get iframeSrcDocs(): DomResource[] {
        // Get all iframes with a srcdoc attribute.
        const frames: HTMLIFrameElement[] = Array.from(this.doc.querySelectorAll('iframe[srcdoc]'))
        const resources = frames
            .map(frame => this.getContentDocOfFrame(frame))
            .filter(isNotNull)
        return resources;
    }

    dry() {
        // Usual resource drying (e.g. change relative to absolute links)
        super.dry()

        // DOM-specific transformations
        makeDomStatic(this.doc, this._config)

        // Reflect the current content of iframes that are not subresources
        this.updateSrcdocValues()
    }

    updateSrcdocValues() {
        // Find all iframes with `srcdoc`, but also those without `src` or `srcdoc` at all.
        // (iframes with a `src` are subresources, thus processed by crawling the subresource tree)
        this.doc.querySelectorAll('iframe[srcdoc],iframe:not([src])').forEach((iframe: HTMLIFrameElement) => {
            const innerDomResource = this.getContentDocOfFrame(iframe)
            if (innerDomResource) {
                const html = innerDomResource.string

                // In case there was no srcdoc, and the frame is still empty, just leave it unset.
                if (!iframe.srcdoc && html === '<html><head></head><body></body></html>') return;

                // Set the srcdoc
                // TODO Check if this escapes quotes correctly in recursive situations.
                iframe.srcdoc = attributeEncode(html)
            }
        })
    }

    getContentDocOfFrame(frameElement: FrameElement): DomResource | null {
        // TODO memoise like in DomCloneResource
        const innerDoc = frameElement.contentDocument
        if (innerDoc !== null) {
            return new DomResource(undefined, innerDoc, this._config)
        } else {
            return null
        }
    }

    static async fromBlob({ url, blob, config }: {
        url: UrlString,
        blob: Blob,
        config: DomResourceConfig
    }): Promise<DomResource> { // Should be Promise<this>; see TS issue #5863
        const html = await blobToText(blob, config)
        return new this(url, html, config)
    }
}

function attributeEncode(string: string) {
    return string.replace(/"/g, '&quot;')
}

function isNotNull<T extends null>(x: T): x is Exclude<T, null> {
    return x !== null;
}
