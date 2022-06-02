import { postcss } from '../package'

import { Resource } from './resource'
import type { CssLink } from '../extract-links/types'
import type { GlobalConfig, UrlString } from '../types'
import { extractLinksFromCss } from '../extract-links'
import { blobToText } from './util'

export class StylesheetResource extends Resource {
    private _url: UrlString
    private _links: CssLink[]
    private _config: GlobalConfig
    private _getString: () => string

    constructor(
        stylesheetContent: string,
        url: UrlString,
        config: GlobalConfig = {},
    ) {
        super()
        this._url = url
        this._config = config
        try {
            const parsedCss = postcss.parse(stylesheetContent)
            this._links = extractLinksFromCss(parsedCss, url)
            for (const link of this._links) link.from.resource = this
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

    override get blob() {
        const glob = this._config.glob || globalThis
        return new glob.Blob([this.string], { type: 'text/css' })
    }

    get string() {
        return this._getString()
    }

    override get links(): CssLink[] {
        return this._links
    }

    static override async fromBlob({ blob, url, config }: {
        blob: Blob,
        url: UrlString,
        config?: GlobalConfig,
    }): Promise<StylesheetResource> { // Should be Promise<this>; see TS issue #5863
        const stylesheetText = await blobToText(blob, config)
        return new this(stylesheetText, url, config)
    }
}
