import { documentOuterHTML } from '../package'
import { Resource } from './resource'
import type { GlobalConfig, UrlString, FrameElement } from '../types'
import type { HtmlLink } from './links'
import { findLinksInDom } from './links'
import { blobToText, makeDomStatic } from '../util'

/**
 * DomResource represents an HTML document.
 *
 * DomResource exposes the {@link links} of the document; both those links defined by attributes
 * (e.g. an `<a>`’s `href` or `<img>`’s `src`) and those defined in inline CSS (e.g. a `background:
 * url(…)` in a `<style>` element).
 *
 * {@link DomResource.dry | `DomResource.dry`} attempts to capture the dynamic state of a DOM into
 * its HTML, to make its HTML (available at {@link string}) a more accurate reflection of its
 * current state. This includes, like with other Resources, expanding any relative URLs in links to
 * absolute URLs.
 *
 * @category Resources
 */
export class DomResource extends Resource {
    private _doc: Document
    private _url: UrlString | undefined
    protected _config: GlobalConfig
    private _linksInDom: HtmlLink[]

    /**
     * Represent a given Document. Any changes to its {@link DomResource.links} will directly update
     * the Document contents.
     *
     * If the Document is prone to modification by any other scripts, you may want to use {@link
     * DomCloneResource} instead, to make a clone of the Document and work on that one instead.
     *
     * @param doc - The Document this Resource represents.
     * @param url - Since the passed Document already has a property `doc.URL`, the `url` parameter
     * is optional; if passed it will override the value of `doc.URL` when determining the target of
     * relative URLs.
     * @param config - Optional environment configuration.
     */
    constructor(doc: Document, url?: UrlString, config?: GlobalConfig)

    /**
     * @param html - The HTML code of the document this Resource represents.
     * @param url - The document’s URL. Relevant for expanding any relative URLs it may contain.
     * @param config - Optional environment configuration.
     */
    constructor(html: string, url: UrlString, config?: GlobalConfig)

    constructor(
        docOrHtml: Document | string,
        url?: UrlString,
        config: GlobalConfig = {},
    ) {
        super()
        const glob = config.glob || globalThis
        const doc = (typeof docOrHtml === 'string')
            ? (new glob.DOMParser()).parseFromString(docOrHtml, 'text/html')
            : docOrHtml
        this._doc = doc
        this._url = url
        this._config = config
        this._linksInDom = findLinksInDom(doc, { docUrl: url })
        for (const link of this._linksInDom) link.from.resource = this
    }

    /**
     * The Document object this DomResource represents.
     */
    get doc(): Document {
        return this._doc
    }

    override get url(): UrlString {
        return this._url ?? (this._doc.URL as UrlString)
    }

    override get blob(): Blob {
        const glob = this._config.glob || globalThis
        return new glob.Blob([this.string], { type: 'text/html' })
    }

    /**
     * The DOM as a string (the document's `outerHTML`).
     */
    get string(): string {
        // TODO Add <meta charset> if absent? Or html-encode characters as needed?
        return documentOuterHTML(this._doc)
    }

    /**
     * Get the {@link Link}s that are found in the document; both those links defined by attributes
     * (e.g. an `<a>`’s `href` or `<img>`’s `src`) and those defined in inline CSS (e.g. a
     * `background: url(…)` in a `<style>` element).
     *
     * It includes links directly contained in the document itself, as well as in its iframes with a
     * `srcdoc` attribute (because such iframes are not treated as subresources).
     *
     * The target of a {@link Link} can be modified, which updates the resource content accordingly.
     *
     * However, even though the *content* of a link is ‘live’ (i.e. its `target` is read and written
     * directly from/to the DOM), the list of links is created only at the construction of the
     * DomResource. Thus, if the DOM is modified afterwards, any newly created links will be missing
     * from this list.
     */
    override get links(): HtmlLink[] {
        const allLinks = [
            ...this.linksInDom,
            ...this.iframeSrcDocs.flatMap(resource => resource.links),
            // TODO Treat inline css, svg, and/or other URL-less ‘pseudo-resources’ similarly to
            // `iframeSrcDocs`? (currently, those are included in `linksInDom`)
            // Alternatively, return ‘pseudo-links’ *to* such ‘pseudo-resources’, rather than the
            // links *within* those ‘pseudo-resources’.
        ]
        return allLinks
    }

    /**
     * The links contained directly in the DOM itself.
     *
     * Note this *excludes* links contained within iframes. However, this *includes* links contained
     * in inline stylesheets (`<style>` elements and `style` attributes, but not `<link>`ed
     * stylesheets).
     */
    get linksInDom(): HtmlLink[] {
        // TODO should we list the links again, in case the document changed?
        return this._linksInDom
    }

    /**
     * A list of DomResources corresponding to documents in iframes with the `srcdoc` attribute
     * (note that these documents are not considered subresources).
     */
    get iframeSrcDocs(): DomResource[] {
        // Get all iframes with a srcdoc attribute.
        const frames: HTMLIFrameElement[] = Array.from(this.doc.querySelectorAll('iframe[srcdoc]'))
        const resources = frames
            .map(frame => this.getContentDocOfFrame(frame))
            .filter(isNotNull)
        return resources;
    }

    /**
     * Make the DOM ‘dry’: try make its HTML represent its current state as accurately as possible.
     *
     * Drying performs several transformations:
     * - Relative links are expanded to be absolute (by {@link Resource.dry | `Resource.dry`}).
     * - Scripts, `<noscript>` elements, and `contenteditable` attributes are removed (by {@link
     *   makeDomStatic}).
     * - `srcdoc` values are updated (by {@link updateSrcdocValues}).
     */
    override dry() {
        // Usual resource drying (change relative to absolute links)
        super.dry()

        // DOM-specific transformations
        makeDomStatic(this.doc, this._config)

        // Reflect the current content of iframes that are not subresources
        // TODO Recurse into the srcdoc documents
        this.updateSrcdocValues()
    }

    /**
     * Update the `srcdoc` value of `<iframe>`s that have it, to have it reflect the current state
     * of the DOM inside the frame (thus including any changes made after the frame contents were
     * loaded, by either freeze-dry or other scripts).
     */
    updateSrcdocValues() {
        // Find all iframes with `srcdoc`, but also those without `src` or `srcdoc` at all.
        // (iframes with a `src` are subresources, thus processed by crawling the subresource tree)
        this.doc.querySelectorAll('iframe[srcdoc],iframe:not([src])').forEach((iframe: HTMLIFrameElement) => {
            const innerDomResource = this.getContentDocOfFrame(iframe)
            if (innerDomResource) {
                const html = innerDomResource.string

                // In case there was no srcdoc, and the frame is still empty, just leave it unset.
                if (!iframe.srcdoc && html === '<html><head></head><body></body></html>') return;

                // Set the srcdoc
                // TODO Check if this escapes quotes correctly in recursive situations.
                iframe.srcdoc = attributeEncode(html)
            }
        })
    }

    /**
     * Get a DomResource representing the document inside an (i)frame element.
     *
     * @param frameElement - An `<iframe>` element or `<frame>` element.
     * @returns The DomResource instance representing the framed document.
     */
    getContentDocOfFrame(frameElement: FrameElement): DomResource | null {
        // TODO memoise like in DomCloneResource
        const innerDoc = frameElement.contentDocument
        if (innerDoc !== null) {
            return new DomResource(innerDoc, undefined, this._config)
        } else {
            return null
        }
    }

    /**
     * Create a DomResource from a Blob of HTML and a URL.
     *
     * @example
     * const response = await fetch('https://example.org/page.html')
     * const domResource = DomResource.fromBlob({ blob: await response.blob(), url: response.url })
     *
     * @param params.blob - A Blob containing the HTML file.
     * @param params.url - The page’s URL.
     * @param params.config - Optional environment configuration.
     * @returns A new DomResource, created by parsing the given HTML.
     */
    static override async fromBlob({ blob, url, config }: {
        blob: Blob,
        url: UrlString,
        config?: GlobalConfig,
    }): Promise<DomResource> { // Should be Promise<this>; see TS issue #5863
        const html = await blobToText(blob, config)
        return new this(html, url, config)
    }
}

function attributeEncode(string: string) {
    return string.replace(/"/g, '&quot;')
}

function isNotNull<T extends null>(x: T): x is Exclude<T, null> {
    return x !== null;
}
