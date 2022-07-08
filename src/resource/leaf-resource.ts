import { Resource } from './resource'
import type { UrlString } from '../types'
import type { Link } from '../extract-links/types'

/**
 * LeafResource represents any {@link Resource} without links (e.g. fonts, images, videos).
 *
 * It basically contains a Blob and a URL, and does nothing special.
 */
export class LeafResource extends Resource {
    private _blob: Blob
    private _url: UrlString

    constructor(blob: Blob, url: UrlString) {
        super()
        this._blob = blob
        this._url = url
    }

    override get url(): UrlString {
        return this._url
    }

    override get blob(): Blob {
        return this._blob
    }

    /**
     * An empty list. A leaf resource has zero links by definition.
     */
    override get links(): Link[] & [] {
        return [] as Link[] & []
    }

    static override async fromBlob({ blob, url }: {
        blob: Blob,
        url: UrlString,
    }): Promise<LeafResource> { // Should be Promise<this>; see TS issue #5863
        return new this(blob, url)
    }
}
