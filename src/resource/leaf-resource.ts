import { Resource } from "./resource"
import { UrlString } from "../types"
import { Link } from "../extract-links/types"

export class LeafResource extends Resource {
    private _blob: Blob
    private _url: UrlString

    constructor(blob: Blob, url: UrlString) {
        super()
        this._blob = blob
        this._url = url
    }

    get url(): UrlString {
        return this._url
    }

    get blob(): Blob {
        return this._blob
    }

    // A leaf resource has zero links by definition.
    get links(): Link[] & [] {
        return [] as Link[] & []
    }

    static async fromBlob({ blob, url }: {
        blob: Blob,
        url: UrlString,
    }): Promise<LeafResource> { // Should be Promise<this>; see TS issue #5863
        return new this(blob, url)
    }
}
