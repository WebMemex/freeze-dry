import makeDomStatic from './make-dom-static/index'
import { DomResource, Resource } from './types'

/**
 * "Dry" the resource+subresources to make them static and context-free.
 * @param {Object} rootResource - the resource object including its subresources.
 * @returns nothing; the resource will be mutated.
 */
export default function dryResources(rootResource: DomResource) {
    for (const resource of allResourcesInTree(rootResource)) {
        // Make all (possibly relative) URLs absolute.
        makeLinksAbsolute(resource)

        // If the resource is a DOM, remove scripts, contentEditable, etcetera.
        if (resource.doc) {
            makeDomStatic(resource.doc)
        }
    }
}

// A depth-first iterator through the tree of resource+subresources
function* allResourcesInTree(resource: Resource): Iterable<Resource> {
    yield resource
    for (const link of resource.links) {
        if (link.isSubresource && link.resource) {
            yield* allResourcesInTree(link.resource)
        }
    }
}

// Make links absolute. Except within-document links: keep/make those relative (e.g. href="#top").
function makeLinksAbsolute(resource: Resource) {
    resource.links.forEach(link => {
        // If target is invalid (hence absoluteTarget undefined), leave it untouched.
        if (link.absoluteTarget === undefined) return

        const targetHash = new URL(link.absoluteTarget).hash
        const urlWithoutHash = (url: string) => url.split('#')[0]
        if (targetHash && urlWithoutHash(link.absoluteTarget) === urlWithoutHash(resource.url)) {
            // The link points to a fragment inside the resource itself. We make it relative.
            link.target = targetHash
        }
        else {
            // The link points outside the resource (or to the resource itself). We make it absolute.
            link.target = link.absoluteTarget
        }
    })
}

export { allResourcesInTree, makeLinksAbsolute } // only for tests
