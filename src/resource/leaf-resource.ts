import { BaseResource } from "./base-resource"

export class LeafResource extends BaseResource {
    // A leaf resource has zero links.
    readonly links: []

    readonly doc?: undefined // (explicitly undefined to make .doc a discriminant for DomResource)
}
