import { documentOuterHTML } from "../package"
import { BaseResource } from "./base-resource"
import { HtmlLink } from "../extract-links/types"
import { GlobalConfig, UrlString } from "../types"
import { extractLinksFromDom } from "../extract-links"

type DomResourceConfig = Pick<GlobalConfig, 'glob'>

export class DomResource extends BaseResource {
    readonly links: HtmlLink[] // TODO should links be a getter that extracts the links again?

    private _url: UrlString | undefined
    private _doc: Document
    private _config: DomResourceConfig

    /**
     * @param url - Since the passed Document already has a property doc.URL, the url parameter is optional; if
     * passed it will override the value of doc.URL for determining the target of relative URLs.
     */
    constructor(url: UrlString | undefined, doc: Document, config: DomResourceConfig)

    constructor(url: UrlString, html: string, config: DomResourceConfig)

    constructor(url: UrlString | undefined, docOrHtml: Document | string, config: DomResourceConfig) {
        super()
        const doc = (typeof docOrHtml === 'string')
            ? (new config.glob.DOMParser()).parseFromString(docOrHtml, 'text/html')
            : docOrHtml
        this._url = url
        this._doc = doc
        this._config = config
        this.links = extractLinksFromDom(doc, { docUrl: url })
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
}
