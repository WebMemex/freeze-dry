import { documentOuterHTML } from "../package"
import { BaseResource } from "./base-resource"
import { HtmlLink } from "../extract-links/types"
import { GlobalConfig, UrlString } from "../types"
import { extractLinksFromDom } from "../extract-links"

type DomResourceConfig = Pick<GlobalConfig, 'glob' | 'docUrl'>

export class DomResource extends BaseResource {
    readonly links: HtmlLink[] // TODO should links be a getter that extracts the links again?

    #doc: Document
    #config: DomResourceConfig

    constructor(docOrHtml: Document | string, config: DomResourceConfig) {
        super()
        const doc = (typeof docOrHtml === 'string')
            ? (new config.glob.DOMParser()).parseFromString(docOrHtml, 'text/html')
            : docOrHtml
        this.#doc = doc
        this.#config = config
        this.links = extractLinksFromDom(doc, { docUrl: config.docUrl })
    }

    // Holds the Document object.
    get doc(): Document {
        return this.#doc
    }

    get url(): UrlString {
        // The config might override the document URL
        return this.#config.docUrl ?? this.#doc.URL
    }

    get blob(): Blob {
        return new this.#config.glob.Blob([this.string], { type: 'text/html' })
    }

    // The DOM as a string (i.e. the document's outerHTML)
    get string(): string {
        // TODO Add <meta charset> if absent? Or html-encode characters as needed?
        return documentOuterHTML(this.#doc)
    }
}
