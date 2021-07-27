import { Link, HtmlAttributeDefinedLink } from './extract-links/types'
import { GlobalConfig } from './types'

/**
 * Set the link’s target to a new URL.
 * @param {Object} link - the link to modify.
 * @param {string} target - the link’s new target.
 * @param {boolean} [config.keepOriginalAttributes=false] - Whether to preserve the value of an
 * element attribute if its URLs are inlined, by noting it as a new 'data-original-...' attribute.
 */
export default function setLinkTarget(
    link: Link,
    target: string,
    config: Pick<GlobalConfig, 'keepOriginalAttributes'>,
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
