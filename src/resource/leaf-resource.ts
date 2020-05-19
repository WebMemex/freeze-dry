import { BaseResource } from "./base-resource"
import { UrlString } from "../types"

export class LeafResource extends BaseResource {
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
    get links(): [] {
        return [];
    }
}
