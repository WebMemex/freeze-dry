import { BaseResource } from "./base-resource"
import { CssLink } from "../extract-links/types"

export class StylesheetResource extends BaseResource {
    readonly links: CssLink[]

    // The stylesheet content as a string
    readonly string: string

    readonly doc?: undefined // (explicitly undefined to make .doc a discriminant for DomResource)
}
