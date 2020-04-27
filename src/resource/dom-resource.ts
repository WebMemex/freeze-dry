import { BaseResource } from "./base-resource"
import { HtmlLink } from "../extract-links/types"

export class DomResource extends BaseResource {
    readonly links: HtmlLink[]

    // Holds the Document object.
    readonly doc: Document

    // The DOM as a string (i.e. the document's outerHTML)
    readonly string: string
}
