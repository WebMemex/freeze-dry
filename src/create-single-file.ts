import { blobToDataURL } from './package'

import setMementoTags from './set-memento-tags'
import setCharsetDeclaration from './set-charset-declaration'
import setContentSecurityPolicy from './set-content-security-policy/index'
import { DomResource, Resource } from './types'
import { Link, HtmlAttributeDefinedLink } from './extract-links/types'


interface CreateSingleFileOptions {
    charsetDeclaration?: string | null,
    addMetadata?: boolean,
    keepOriginalAttributes?: boolean,
    snapshotTime?: Date,
}

/**
 * Serialises the DOM resource+subresources into a single, self-contained string of HTML.
 * @param {Object} resource - the resource object representing the DOM with its subresources. Will
 * be mutated.
 * @returns {string} html - the resulting HTML.
 */
export default async function createSingleFile(resource: DomResource, {
    charsetDeclaration,
    addMetadata,
    keepOriginalAttributes,
    snapshotTime,
}: CreateSingleFileOptions = {}) {
    await deepInlineSubresources(resource, { keepOriginalAttributes })

    // Create/replace the <meta charset> element.
    if (charsetDeclaration !== undefined) {
        setCharsetDeclaration(resource.doc, charsetDeclaration)
    }

    if (addMetadata) {
        // Add metadata about the snapshot to the snapshot itself.
        setMementoTags(resource.doc, { originalUrl: resource.url, datetime: snapshotTime })
    }

    // Set a strict Content Security Policy in a <meta> tag.
    const csp = [
        "default-src 'none'", // By default, block all connectivity and scripts.
        "img-src data:", // Allow inlined images.
        "media-src data:", // Allow inlined audio/video.
        "style-src data: 'unsafe-inline'", // Allow inlined styles.
        "font-src data:", // Allow inlined fonts.
        "frame-src data:", // Allow inlined iframes.
    ].join('; ')
    setContentSecurityPolicy(resource.doc, csp)

    // Return the resulting DOM as a string
    const html = resource.string
    return html
}

/**
 * Recursively inlines all subresources as data URLs.
 * @param {Object} resource - the resource object representing the DOM with its subresources.
 * @param {Object} options
 * @returns nothing; the resource will be mutated.
 */
async function deepInlineSubresources(resource: Resource, options: CreateSingleFileOptions = {}) {
    await Promise.allSettled(
        (resource.links as Link[]).map(async link => {
            if (!link.isSubresource) {
                // Nothing to do.
                return
            } else if (!link.resource) {
                // The link defines a subresource, but we do not have the resource's content.
                // TODO we may want to do something here. Turn target into about:invalid? For
                // now, we rely on the content security policy to prevent loading this resource.
                return
            }

            // First recurse into the linked subresource, so we start at the tree's leaves.
            await deepInlineSubresources(link.resource, options)

            // Convert the (now self-contained) subresource into a data URL.
            const dataUrl = await blobToDataURL(link.resource.blob)

            setLinkTarget(link, dataUrl, options)
        }),
    )
}

function setLinkTarget(
    link: Link,
    target: string,
    { keepOriginalAttributes }: CreateSingleFileOptions = {},
) {
    // Optionally, remember the attribute's original value (if applicable).
    // TODO should this be done elsewhere? Perhaps the link.target setter?
    if (isHtmlAttributeDefinedLink(link) && keepOriginalAttributes) {
        const noteAttribute = `data-original-${link.from.attribute}`
        // Multiple links may be contained in one attribute (e.g. a srcset); we must act
        // only at the first one, therefore we check for existence of the noteAttribute.
        // XXX This also means that if the document already had 'data-original-...' attributes,
        // we leave them as is; this may or may not be desirable (e.g. it helps toward idempotency).
        if (!link.from.element.hasAttribute(noteAttribute)) {
            const originalValue = link.from.element.getAttribute(link.from.attribute)
            link.from.element.setAttribute(noteAttribute, originalValue)
        }
    }

    // Replace the link target with the data URL. Note that link.target is a setter that will update
    // the resource itself.
    link.target = target

    // Remove integrity attribute, if any. (should only be necessary if the content of the
    // subresource has been modified, but we keep things simple and blunt)
    // TODO should this be done elsewhere? Perhaps the link.target setter?
    if (isHtmlAttributeDefinedLink(link) && link.from.element.hasAttribute('integrity')) {
        link.from.element.removeAttribute('integrity')
        // (we could also consider modifying or even adding integrity attributes..)
    }
}

function isHtmlAttributeDefinedLink(link: Link): link is HtmlAttributeDefinedLink {
    return (link as HtmlAttributeDefinedLink).from.element
        && (link as HtmlAttributeDefinedLink).from.attribute
}
