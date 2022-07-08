import { postcss } from '../package'

import { Resource } from './resource'
import type { CssLink } from '../extract-links/types'
import type { GlobalConfig, UrlString } from '../types'
import { extractLinksFromCss } from '../extract-links'
import { blobToText } from './util'

/**
 * StylesheetResource represents a CSS stylesheet.
 *
 * It parses the stylesheet and exposes its links. Links in CSS are the images and fonts that the
 * stylesheet refers to, as well as any `@import`ed stylesheets.
 *
 * To {@link dry} a stylesheet means expanding any relative URLs in links to absolute URLs.
 */
export class StylesheetResource extends Resource {
    private _url: UrlString
    private _links: CssLink[]
    private _config: GlobalConfig
    private _getString: () => string

    /**
     * @param stylesheetContent - The stylesheet’s content, a string of CSS.
     * @param url - The stylesheets URL. Relevant for expanding any relative URLs it may contain.
     * @param config - Optional environment configuration.
     */
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
            // CSS is corrupt. Behave as if there are no links.
            this._links = []
            this._getString = () => stylesheetContent
        }
    }

    override get url() {
        return this._url
    }

    /**
     * The stylesheet’s current content, as a Blob of CSS.
     *
     * Any modifications that were made to the stylesheet’s {@link links} are included.
     */
    override get blob() {
        const glob = this._config.glob || globalThis
        return new glob.Blob([this.string], { type: 'text/css' })
    }

    /**
     * The stylesheet’s current content, as a string of CSS.
     *
     * Any modifications that were made to the stylesheet’s {@link links} are included.
     */
    get string() {
        return this._getString()
    }

    /**
     * Get the links defined in the stylesheet.
     *
     * Links in CSS are the images and fonts that the stylesheet refers to, as well as any
     * `@import`ed stylesheets.
     *
     * The target of a {@link Link} can be modified, which updates the resource content accordingly.
     *
     * Note that currently, all links extracted from a stylesheet are subresource links.
     */
    override get links(): CssLink[] {
        return this._links
    }

    /**
     * Create a StylesheetResource from a Blob of CSS and a URL.
     */
    static override async fromBlob({ blob, url, config }: {
        blob: Blob,
        url: UrlString,
        config?: GlobalConfig,
    }): Promise<StylesheetResource> { // Should be Promise<this>; see TS issue #5863
        const stylesheetText = await blobToText(blob, config)
        return new this(stylesheetText, url, config)
    }
}
