import { UrlString, GlobalConfig } from '../types'
import { Link, SubresourceLink } from '../extract-links/types'
import { DomResource, StylesheetResource, LeafResource } from './index'
import { SubresourceType } from '../extract-links/url-attributes/types'

type ResourceConfig = Pick<GlobalConfig, 'fetchResource' | 'glob'>

export interface ResourceFactory {
    fromBlob(args: { url: UrlString, blob: Blob, config: ResourceConfig }): Promise<Resource>
}

export abstract class Resource {
    // URL of the resource.
    abstract readonly url: UrlString

    // A Blob with the resource content.
    abstract readonly blob: Blob

    // An array of links, providing a live view on the links defined in the resource. Changing the
    // target of a link will change the resource content. When a subresource is fetched, it is
    // remembered as a property `resource` on the corresponding link object, thus forming a tree of
    // resources.
    abstract readonly links: Link[]

    // An array of links (subset of `this.links`) containing only links that define a subresource,
    // and for which a Resource subclass exists.
    get subresourceLinks(): SubresourceLink[] {
        return this.links
            .filter((link: Link): link is SubresourceLink => link.isSubresource)
            .filter(link => Resource.getResourceClass(link.subresourceType))
    }

    // ‘Dry’ the resource, i.e. make it static and context-free.
    dry() {
        this.makeLinksAbsolute()
    }

    // Make links absolute. Except within-document links: keep/make those relative (e.g. href="#top").
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
                // The link points outside the resource (or to the resource itself). We make it absolute.
                link.target = absoluteTarget
            }
        })
    }

    // Create a Resource from a Blob object plus URL; returns an instance of a subclass of Resource
    // matching the given subresource type.
    static async fromBlob({ url, blob, subresourceType, config }: {
        url: UrlString,
        blob: Blob,
        subresourceType?: SubresourceType,
        config: ResourceConfig,
    }): Promise<Resource> {
        const resourceClass = this.getResourceClass(subresourceType)
        if (resourceClass === undefined) {
            throw new Error(`Not sure how to interpret resource of type '${subresourceType}'`)
        }
        const resource = await resourceClass.fromBlob({ url, blob, config })
        return resource
    }

    // Determine the Resource subclass to use for the given subresource type; returns undefined if
    // the type is not supported.
    static getResourceClass(subresourceType: SubresourceType | undefined): ResourceFactory | undefined {
        const resourceClasses: { [s: string]: ResourceFactory | undefined } = {
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