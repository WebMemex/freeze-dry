import setMementoTags from './set-memento-tags'
import setCharsetDeclaration from './set-charset-declaration'
import setContentSecurityPolicy from './set-content-security-policy/index'
import { GlobalConfig } from './types'
import { Link, HtmlAttributeDefinedLink } from './extract-links/types'
import { DomResource } from './resource'

type CreateSingleFileConfig = Pick<GlobalConfig,
    | 'charsetDeclaration'
    | 'addMetadata'
    | 'keepOriginalAttributes'
    | 'setContentSecurityPolicy'
    | 'now'
    | 'glob'
>

/**
 * Add relevant metadata to the DOM, as instructed by the `config`.
 * @param {Object} resource - the resource object representing the DOM with its subresources. Will
 * be mutated.
 * @returns nothing; the resource will be mutated.
 */
export default async function finaliseSnapshot(
    resource: DomResource,
    config: CreateSingleFileConfig
) {
    // Create/replace the <meta charset> element.
    if (config.charsetDeclaration !== undefined) {
        setCharsetDeclaration(resource.doc, config.charsetDeclaration)
    }

    if (config.addMetadata) {
        // Add metadata about the snapshot to the snapshot itself.
        setMementoTags(resource.doc, { originalUrl: resource.url, datetime: config.now })
    }

    if (config.setContentSecurityPolicy) {
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
    }
}

/**
 * Set the link’s target to a new URL.
 * @param {Object} link - the link to modify.
 * @param {string} target - the link’s new target.
 * @param {boolean} [config.keepOriginalAttributes=false] - Whether to preserve the value of an
 * element attribute if its URLs are inlined, by noting it as a new 'data-original-...' attribute.
 */
export function setLinkTarget(
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

    // Replace the link target. Note that this will update the resource itself.
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

/**
 * Turn a Blob into a base64-encoded data URL.
 * @param {boolean} blob - the blob to serialise.
 * @returns {string} dataUrl - the data URL.
 */
export async function blobToDataUrl(blob: Blob, config: Pick<GlobalConfig, 'glob'>): Promise<string> {
    const binaryString = await new Promise<string>((resolve, reject) => {
        const reader = new config.glob.FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsBinaryString(blob)
    })
    const dataUrl = `data:${blob.type};base64,${config.glob.btoa(binaryString)}`
    return dataUrl
}
