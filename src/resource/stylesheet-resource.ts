import { postcss } from "../package"

import { BaseResource } from "./base-resource"
import { CssLink } from "../extract-links/types"
import { GlobalConfig, UrlString } from "../types"
import { extractLinksFromCss } from "../extract-links"

type StylesheetResourceConfig = Pick<GlobalConfig, 'glob'>

export class StylesheetResource extends BaseResource {
    #url: UrlString
    #links: CssLink[]
    #config: StylesheetResourceConfig
    #getString: () => string

    constructor(
        url: UrlString,
        stylesheetContent: string,
        config: StylesheetResourceConfig,
    ) {
        super()
        this.#url = url
        this.#config = config
        try {
            const parsedCss = postcss.parse(stylesheetContent)
            this.#links = extractLinksFromCss(parsedCss, url)
            // Whenever the stylesheet content is accessed, we serialise its AST.
            this.#getString = () => parsedCss.toResult().css
        } catch (err) {
            // CSS is corrupt. Pretend there are no links.
            this.#links = []
            this.#getString = () => stylesheetContent
        }
    }

    get url() {
        return this.#url
    }

    get blob() {
        return new this.#config.glob.Blob([this.string], { type: 'text/css' })
    }

    get string() {
        return this.#getString()
    }

    get links(): CssLink[] {
        return this.#links
    }
}
