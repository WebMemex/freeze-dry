import setMementoTags from './set-memento-tags'
import setCharsetDeclaration from './set-charset-declaration'
import setContentSecurityPolicy from './set-content-security-policy/index'
import { GlobalConfig } from './types'
import { Link, HtmlAttributeDefinedLink } from './extract-links/types'
import { DomResource, Resource } from './resource'

type CreateSingleFileConfig = Pick<GlobalConfig,
    | 'charsetDeclaration'
    | 'addMetadata'
    | 'keepOriginalAttributes'
    | 'now'
    | 'glob'
>

/**
 * Serialises the DOM resource+subresources into a single, self-contained string of HTML.
 * @param {Object} resource - the resource object representing the DOM with its subresources. Will
 * be mutated.
 * @returns {string} html - the resulting HTML.
 */
export default async function createSingleFile(
    resource: DomResource,
    subresources: AsyncIterable<Resource>,
    config: CreateSingleFileConfig
): Promise<string> {
    for await (const subresource of subresources) {
        // Just wait for all the subresources to arrive.
    }

    await deepInlineSubresources(resource, config)

    // Create/replace the <meta charset> element.
    if (config.charsetDeclaration !== undefined) {
        setCharsetDeclaration(resource.doc, config.charsetDeclaration)
    }

    if (config.addMetadata) {
        // Add metadata about the snapshot to the snapshot itself.
        setMementoTags(resource.doc, { originalUrl: resource.url, datetime: config.now })
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
async function deepInlineSubresources(resource: Resource, config: CreateSingleFileConfig) {
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
            await deepInlineSubresources(link.resource, config)

            // Convert the (now self-contained) subresource into a data URL.
            const dataUrl = await blobToDataUrl(link.resource.blob, config)

            setLinkTarget(link, dataUrl, config)
        }),
    )
}

function setLinkTarget(
    link: Link,
    target: string,
    config: Pick<CreateSingleFileConfig, 'keepOriginalAttributes'>,
) {
    // Optionally, remember the attribute's original value (if applicable).
    if (isHtmlAttributeDefinedLink(link) && config.keepOriginalAttributes) {
        const noteAttribute = `data-original-${link.from.attribute}`
        // Multiple links may be contained in one attribute (e.g. a srcset); we must act
        // only at the first one, therefore we check for existence of the noteAttribute.
        // XXX This also means that if the document already had 'data-original-...' attributes,
        // we leave them as is; this may or may not be desirable (e.g. it helps toward idempotency).
        if (!link.from.element.hasAttribute(noteAttribute)) {
            const originalValue = link.from.element.getAttribute(link.from.attribute) ?? ''
            link.from.element.setAttribute(noteAttribute, originalValue)
        }
    }

    // Replace the link target with the data URL. Note that this will update the resource itself.
    link.target = target

    // Remove integrity attribute, if any (not always necessary, but we keep things simple for now)
    if (isHtmlAttributeDefinedLink(link) && link.from.element.hasAttribute('integrity')) {
        link.from.element.removeAttribute('integrity')
    }
}

function isHtmlAttributeDefinedLink(link: Link): link is HtmlAttributeDefinedLink {
    const from = link.from as HtmlAttributeDefinedLink['from']
    return from.element !== undefined && from.attribute !== undefined
}

async function blobToDataUrl(blob: Blob, config: Pick<GlobalConfig, 'glob'>): Promise<string> {
    const binaryString = await new Promise<string>((resolve, reject) => {
        const reader = new config.glob.FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsBinaryString(blob)
    })
    const dataUrl = `data:${blob.type};base64,${config.glob.btoa(binaryString)}`
    return dataUrl
}
