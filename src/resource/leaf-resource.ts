import { BaseResource } from "./base-resource"
import { UrlString } from "../types"

export class LeafResource extends BaseResource {
    #url: UrlString
    #blob: Blob

    constructor({ url, blob }: { url: UrlString, blob: Blob }) {
        super()
        this.#url = url
        this.#blob = blob
    }

    get url(): UrlString {
        return this.#url
    }

    get blob(): Blob {
        return this.#blob
    }

    // A leaf resource has zero links by definition.
    get links(): [] {
        return [];
    }

    readonly doc?: undefined // (explicitly undefined to make .doc a discriminant for DomResource)
}
