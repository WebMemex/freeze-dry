import setMementoTags from './set-memento-tags'
import setCharsetDeclaration from './set-charset-declaration'
import setContentSecurityPolicy from './set-content-security-policy'
import { GlobalConfig } from './types'
import { DomResource } from './resource'

/**
 * Add relevant metadata to the DOM, as instructed by the `config`.
 * @param {Object} resource - the resource object representing the DOM with its subresources. Will
 * be mutated.
 * @returns nothing; the resource will be mutated.
 */
export default async function finaliseSnapshot(
    resource: DomResource,
    config: Pick<GlobalConfig,
        | 'charsetDeclaration'
        | 'addMetadata'
        | 'setContentSecurityPolicy'
        | 'now'
    >
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
