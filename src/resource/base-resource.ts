import { UrlString } from '../types/util'
import { Link } from '../extract-links/types'

export class BaseResource {
    // URL of the resource.
    readonly url: UrlString

    // A Blob with the resource content.
    readonly blob: Blob

    // An array of links, providing a live view on the links defined in the resource. Changing the
    // target of a link will change the resource content. When a subresource is fetched, it is
    // remembered as a property `resource` on the corresponding link object, thus forming a tree of
    // resources.
    readonly links: Link[]
}
