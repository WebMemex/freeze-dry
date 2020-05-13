import makeDomStatic from './make-dom-static/index'
import { GlobalConfig } from './types'
import { Link } from './extract-links/types'
import { Resource, DomResource } from './resource'

/**
 * "Dry" the resource+subresources to make them static and context-free.
 * @param {Object} rootResource - the resource object including its subresources.
 * @returns nothing; the resource will be mutated.
 */
export default function dryResource(
    resource: Resource,
    config: Pick<GlobalConfig, 'glob'>,
) {
    // Make all (possibly relative) URLs absolute.
    makeLinksAbsolute(resource)

    // If the resource is a DOM, remove scripts, contentEditable, etcetera.
    if (resource instanceof DomResource) {
        makeDomStatic(resource.doc, config)
    }
}

// Make links absolute. Except within-document links: keep/make those relative (e.g. href="#top").
function makeLinksAbsolute(resource: Resource) {
    resource.links.forEach((link: Link) => {
        // If target is invalid (hence absoluteTarget undefined), leave it untouched.
        const absoluteTarget = link.absoluteTarget
        if (absoluteTarget === undefined) return

        const targetHash = absoluteTarget.includes('#')
            ? absoluteTarget.substring(absoluteTarget.indexOf('#'))
            : undefined
        const urlWithoutHash = (url: string) => url.split('#')[0]
        if (targetHash && urlWithoutHash(absoluteTarget) === urlWithoutHash(resource.url)) {
            // The link points to a fragment inside the resource itself. We make it relative.
            link.target = targetHash
        }
        else {
            // The link points outside the resource (or to the resource itself). We make it absolute.
            link.target = absoluteTarget
        }
    })
}

export { makeLinksAbsolute } // only for tests
