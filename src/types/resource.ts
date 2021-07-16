import { UrlString } from './util'
import { Link, CssLink } from '../extract-links/types'

export type Resource = DomResource | StylesheetResource | LeafResource

interface Resource_base {
    // URL of the resource.
    readonly url: UrlString;

    // A Blob with the resource content.
    readonly blob: Blob;

    // An array of links, providing a live view on the links defined in the resource. Changing the
    // target of a link will change the resource contents. When a subresource is fetched, it is
    // remembered as a property `resource` on the corresponding link object, thus forming a tree of
    // resources.
    readonly links: Link[];
}

export interface DomResource extends Resource_base {
    // Holds the Document object.
    readonly doc: Document;

    // The DOM as a string (i.e. the document's outerHTML)
    readonly string: string;
}

export interface StylesheetResource extends Resource_base {
    readonly string: string;
    readonly links: CssLink[];
    readonly doc?: undefined; // (explicitly undefined to make .doc a discriminant for DomResource)
}

export interface LeafResource extends Resource_base {
    readonly doc?: undefined; // (explicitly undefined to make .doc a discriminant for DomResource)
}
