import makeDomStatic from './make-dom-static/index.js'

/**
 * "Dry" the resource+subresources to make them static and context-free.
 * @param {Object} rootResource - the resource object including its subresources.
 * @returns nothing; the resource will be mutated.
 */
export default function dryResources(rootResource) {
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
function* allResourcesInTree(resource) {
    yield resource
    for (const link of resource.links) {
        if (link.resource) {
            yield* allResourcesInTree(link.resource)
        }
    }
}

function makeLinksAbsolute(resource) {
    resource.links.forEach(link => {
        link.target = link.absoluteTarget
    })
}

export { allResourcesInTree, makeLinksAbsolute } // only for tests
