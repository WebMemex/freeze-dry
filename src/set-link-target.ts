import type { Link, HtmlAttributeDefinedLink } from './resource'

/**
 * Set the link’s target to a new URL.
 *
 * Essentially this performs `link.target = target`, but with extra steps:
 * - If the link is defined by an attribute of an HTML element, the element’s `integrity` attribute
 *  (if any) is removed. (In case the new target has different content, the integrity attribute
 *  could prevent it from being loaded.)
 * - If the link is defined by an attribute of an HTML element, and `config.rememberOriginalUrls` is
 *  `true`, the attribute’s existing value is preserved in a `data-original-…` attribute.
 *
 * Note that modifying a {@link Link}’s target updates the {@link Resource} that defines the link.
 *
 * @param link - The link to modify.
 * @param target - The link’s new target: a relative or absolute URL.
 * @param config.rememberOriginalUrls - If true, and the link is defined by an attribute of an HTML
 * element, the attribute’s existing value is preserved in a `data-original-…` attribute.
 */
export default function setLinkTarget(
    link: Link,
    target: string,
    config: { rememberOriginalUrls?: boolean } = {},
) {
    // Optionally, remember the attribute's original value (if applicable).
    if (isHtmlAttributeDefinedLink(link) && config.rememberOriginalUrls) {
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
