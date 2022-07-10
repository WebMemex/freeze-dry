import type { UrlString, GlobalConfig, ProcessSubresourceCallback, Fetchy } from '../types'
import type { Link, SubresourceLink } from './links/types'
import { DomResource, StylesheetResource, LeafResource } from './index'
import type { SubresourceType } from './links/url-attributes/types'

export interface ResourceFactory {
    fromBlob(args: { url: UrlString, blob: Blob, config?: GlobalConfig }): Promise<Resource>
}

/**
 * Resource is an abstraction to help deal with links and subresources of web pages.
 *
 * Each Resource has content and a URL, and may have links to other URLs, which can again be
 * represented as a Resource, and so on; resources can thus form a tree of (sub)resources.
 *
 * For example, a web page ({@link DomResource}) might link to a stylesheet ({@link
 * StylesheetResource}) which may link to a font ({@link LeafResource}).
 *
 * Each such subclass of Resource exposes the links it contains. Note that besides the user-visible
 * links made by `<a>` elements, links are also created by e.g. the `src` of an `<img>` element (in
 * HTML), or the `url(…)` in a `background-image` value (in CSS).
 *
 * The target of a {@link Link} can be modified, which updates the resource content accordingly.
 *
 * Each subclass also provides a `dry()` method that transforms the contents to be usable outside of
 * its original context (e.g. served from a different URL), and to be as accurately as possible a
 * a snapshot of the current state of the resource (e.g. any dynamic state is made part of the DOM).
 *
 * The content can be accessed as a Blob via {@link blob}, and as a string via `text` on subclasses
 * for text-based resources (HTML in {@link DomResource}, CSS in {@link StylesheetResource}).
 */
export abstract class Resource {
    /** URL of the resource. */
    abstract readonly url: UrlString

    /** A Blob with the current resource content. */
    abstract readonly blob: Blob

    /**
     * An array of {@link Link}s, providing a live view on the links defined in the resource.
     * Changing the target of a link will change the resource content.
     */
    abstract readonly links: Link[]

    /**
     * An array of {@link Link}s (a subset of {@link links}), containing only subresource links, and
     * for whose `subresourceType` a Resource subclass exists. That is, those links that {@link
     * Resource.fromLink} accepts.
     */
    get subresourceLinks(): SubresourceLink[] {
        return this.links
            .filter((link: Link): link is SubresourceLink => link.isSubresource)
            .filter(link => Resource.getResourceClass(link.subresourceType))
    }

    /**
     * Perform a function on each subresource link.
     *
     * @param processSubresource - Invoked on each subresource link.
     * @returns A promise that completes when all invocations have completed.
     */
    async processSubresources(processSubresource: ProcessSubresourceCallback) {
        async function processSubresourceWrapper(link: SubresourceLink) {
            // TODO emit an event?
            await processSubresource(link, processSubresourceWrapper)
        }
        await Promise.all(this.subresourceLinks.map(
            link => processSubresourceWrapper(link)
        ))
    }

    /**
     * ‘Dry’ the resource, i.e. make it static and context-free.
     */
    dry() {
        this.makeLinksAbsolute()
    }

    /**
     * Make ‘outward’ links absolute, and ‘within-document’ links relative (e.g. href="#top").
     */
    makeLinksAbsolute() {
        this.links.forEach(link => {
            // If target is invalid (hence absoluteTarget undefined), leave it untouched.
            const absoluteTarget = link.absoluteTarget
            if (absoluteTarget === undefined) return

            const targetHash = absoluteTarget.includes('#')
                ? absoluteTarget.substring(absoluteTarget.indexOf('#'))
                : undefined
            const urlWithoutHash = (url: string) => url.split('#')[0]
            if (targetHash && urlWithoutHash(absoluteTarget) === urlWithoutHash(this.url)) {
                // The link points to a fragment inside the resource itself. We make it relative.
                link.target = targetHash
            }
            else {
                // The link points outside the resource (or to itself). We make it absolute.
                link.target = absoluteTarget
            }
        })
    }

    /**
     * Fetch the resource a given `link` points to, and return it as a {@link Resource}.
     *
     * This method does not modify the given link; the caller can store the created Resource in
     * `link.resource`, to grow a tree of links and resources.
     *
     * @example
     * link.resource = await Resource.fromLink(link)
     *
     * @param link - The link pointing to the resource.
     * @param config - Optional environment configuration.
     * @param config.fetchResource - Custom function for fetching resources; should be
     * API-compatible with the global `fetch()`, but may also return `{ blob, url }` instead of a
     * `Response`.
     * @param config.signal - Signal that can be used to abort fetching the resource and let this
     * method throw.
     * @returns The newly created {@link Resource}.
     */
    static async fromLink(
        link: SubresourceLink,
        config: GlobalConfig & {
            fetchResource?: Fetchy,
            signal?: AbortSignal,
        } = {},
    ): Promise<Resource> {
        if (link.absoluteTarget === undefined) {
            throw new Error(`Cannot fetch invalid target: ${link.target}`)
        }
        const targetUrl = link.absoluteTarget

        const glob = config.glob || globalThis
        const fetchFunction = config.fetchResource || glob.fetch
        // TODO investigate whether we should supply origin, credentials, ...
        const resourceOrResponse = await fetchFunction(targetUrl, {
            cache: 'force-cache',
            redirect: 'follow',
            signal: config.signal,
        })

        // If we got a Response, we wait for the content to arrive.
        const blob = typeof resourceOrResponse.blob === 'function'
            ? await resourceOrResponse.blob()
            : resourceOrResponse.blob
        // Read the final URL of the resource (after any redirects).
        const finalUrl = resourceOrResponse.url as UrlString

        return await Resource.fromBlob({
            blob,
            url: finalUrl,
            subresourceType: link.subresourceType,
            config,
        })
    }

    /**
     * Create a {@link Resource} from a Blob and a URL, and a subresource type.
     *
     * Note that the URL is not resolved (see {@link fromLink} for that), but is used to interpret
     * any relative links that the resource may contain.
     *
     * Currently, the `subresourceType` is mandatory, and determines what subclass of Resource is
     * instantiated (in freeze-dry, this method is only used for subresources, so the expected type
     * is always known). The Blob’s MIME type is ignored.
     *
     * @param params.blob - The contents of the resource.
     * @param params.url - The resource’s URL.
     * @param params.subresourceType - The type of subresource expected by the parent resource, e.g.
     * `'image'` or `'style'`. Note this is not the same as its MIME type.
     * @param params.config - Optional environment configuration.
     * @returns An instance of a subclass of {@link Resource} matching the given subresource type.
     */
    static async fromBlob({ blob, url, subresourceType, config }: {
        blob: Blob,
        url: UrlString,
        subresourceType?: SubresourceType,
        config?: GlobalConfig,
    }): Promise<Resource> {
        const resourceClass = this.getResourceClass(subresourceType)
        if (resourceClass === undefined) {
            throw new Error(`Not sure how to interpret resource of type '${subresourceType}'`)
        }
        const resource = await resourceClass.fromBlob({ blob, url, config })
        return resource
    }

    /**
     * Determine the Resource subclass to use for the given subresource type.
     *
     * @param subresourceType - The type of subresource expected by the parent resource, e.g.
     * `'image'` or `'style'`. Note this is not the same as its MIME type.
     * @returns The appropriate {@link Resource} subclass, or `undefined` if the type is not
     * supported.
     */
    static getResourceClass(
        subresourceType: SubresourceType | undefined
    ): ResourceFactory | undefined {
        const resourceClasses: { [s: string]: ResourceFactory } = {
            document: DomResource,
            style: StylesheetResource,
            image: LeafResource, // Images cannot have subresources (actually, SVGs can! TODO)
            video: LeafResource, // Videos cannot have subresources (afaik; maybe they can?)
            font: LeafResource, // Fonts cannot have subresources (afaik; maybe they can?)
        }
        if (subresourceType === undefined) {
            return undefined
        }
        return resourceClasses[subresourceType]
    }
}
