import { Resource } from "./resource"
import { UrlString } from "../types"
import { Link } from "../extract-links/types"

export class LeafResource extends Resource {
    private _url: UrlString
    private _blob: Blob

    constructor({ url, blob }: { url: UrlString, blob: Blob }) {
        super()
        this._url = url
        this._blob = blob
    }

    get url(): UrlString {
        return this._url
    }

    get blob(): Blob {
        return this._blob
    }

    // A leaf resource has zero links by definition.
    get links(): Link[] & [] {
        return [] as Link[] & [];
    }

    static async fromBlob({ url, blob }: {
        url: UrlString,
        blob: Blob,
    }): Promise<LeafResource> { // Should be Promise<this>; see TS issue #5863
        return new this({ url, blob })
    }
}
