import { postcss } from "../package"

import { BaseResource } from "./base-resource"
import { CssLink } from "../extract-links/types"
import { GlobalConfig, UrlString } from "../types"
import { extractLinksFromCss } from "../extract-links"

type StylesheetResourceConfig = Pick<GlobalConfig, 'glob'>

export class StylesheetResource extends BaseResource {
    private _url: UrlString
    private _links: CssLink[]
    private _config: StylesheetResourceConfig
    private _getString: () => string

    constructor(
        url: UrlString,
        stylesheetContent: string,
        config: StylesheetResourceConfig,
    ) {
        super()
        this._url = url
        this._config = config
        try {
            const parsedCss = postcss.parse(stylesheetContent)
            this._links = extractLinksFromCss(parsedCss, url)
            // Whenever the stylesheet content is accessed, we serialise its AST.
            this._getString = () => parsedCss.toResult().css
        } catch (err) {
            // CSS is corrupt. Pretend there are no links.
            this._links = []
            this._getString = () => stylesheetContent
        }
    }

    get url() {
        return this._url
    }

    get blob() {
        return new this._config.glob.Blob([this.string], { type: 'text/css' })
    }

    get string() {
        return this._getString()
    }

    get links(): CssLink[] {
        return this._links
    }
}
