import getBaseUrl from './get-base-url'
import { syncingParsedView } from './parse-tools'
import { findLinksInCssSynced } from './from-css'
import urlAttributes from './url-attributes/index'
import type { UrlString } from '../../types'
import type { HtmlLink } from './types'
import type { AttributeInfo } from './url-attributes'

/**
 * Find all links in an HTML Document.
 *
 * @param doc - The Document to find links in.
 * @param options.docUrl - Can be specified to override `doc.URL`.
 * @returns The found links. Each {@link Link} provides a live, editable view on one URL inside
 * the DOM.
 */
export function findLinksInDom(doc: Document, {
    docUrl = undefined,
}: {
    docUrl?: UrlString,
} = {}): HtmlLink[] {
    const baseUrl = docUrl !== undefined
        ? getBaseUrl(doc, docUrl)
        : undefined // No override; functions will read the correct value from <node>.baseURI.

    const rootElement = doc.documentElement // = the <html> element.
    const links = [
        ...findLinksInAttributes({ rootElement, baseUrl, docUrl }),
        ...findLinksInStyleAttributes({ rootElement, baseUrl }),
        ...findLinksInStyleTags({ rootElement, baseUrl }),
    ]
    return links
}

function findLinksInAttributes({
    rootElement,
    baseUrl,
    docUrl,
}: {
    rootElement: Element,
    baseUrl?: UrlString,
    docUrl?: UrlString,
}): HtmlLink[] {
    // For each known attribute type, we find all elements having it.
    // Note the 'style' attribute is handled separately, in findLinksInStyleAttributes below.
    const links = Object.values(urlAttributes).flatMap(attributeInfo => {
        const { attribute, elements: elementNames } = attributeInfo
        const selector = elementNames
            .map(name => `${name}[${attribute}]`) // Only find elements having the attribute set.
            .join(', ')
        const elements = Array.from(rootElement.querySelectorAll(selector))
        const links = elements.flatMap(element =>
            linksInAttribute({ element, attributeInfo, baseUrl, docUrl })
        )
        return links // links of this attribute type
    })
    return links // links in all attributes of all elements
}

// Gets the links (usually just one) inside the specified attribute of the given element.
function linksInAttribute({
    element,
    attributeInfo,
    baseUrl,
    docUrl
}: {
    element: Element,
    attributeInfo: AttributeInfo,
    baseUrl?: UrlString,
    docUrl?: UrlString,
}): HtmlLink[] {
    const { attribute, parse, makeAbsolute } = attributeInfo

    // Get a live&editable view on the URL(s) in the attribute.
    const parsedAttributeView = syncingParsedView({
        parse,
        // XXX We treat an absent attribute as an empty string; feels slightly wrong.
        get: () => element.getAttribute(attribute) || '',
        set: value => { element.setAttribute(attribute, value) },
    })

    const links = parsedAttributeView.map<HtmlLink>(tokenView => ({
        get target() { return tokenView.token },
        set target(newUrl) { tokenView.token = newUrl },
        get absoluteTarget() {
            return makeAbsolute(this.target, element, baseUrl, docUrl)
        },

        get from() {
            const index = tokenView.index
            return {
                get element() { return element },
                get attribute() { return attribute },
                get rangeWithinAttribute() {
                    return [index, index + tokenView.token.length] as [number, number]
                },
            }
        },

        // These values are constant, but we use getters anyway to emphasise they are read-only.
        get isSubresource() { return attributeInfo.isSubresource },
        get subresourceType() { return attributeInfo.subresourceType },
    } as HtmlLink)) // TODO actually typecheck; may need a revisit of attribute info format.
    return links
}

function findLinksInStyleAttributes({
    rootElement,
    baseUrl,
}: {
    rootElement: Element,
    baseUrl?: UrlString,
}): HtmlLink[] {
    // TODO try using element.style instead of parsing the attribute value ourselves.
    const querySelector = '*[style]'
    const elements = Array.from(rootElement.querySelectorAll(querySelector))
    const links = elements.flatMap(element => {
        // Find the links in the CSS using a live&editable view on the attribute value.
        const cssLinks = findLinksInCssSynced({
            // XXX We treat an absent attribute as an empty string; feels slightly wrong.
            get: () => element.getAttribute('style') || '',
            set: newValue => { element.setAttribute('style', newValue) },
            baseUrl: baseUrl || (element.baseURI as UrlString),
        })

        // Tweak the links to describe the 'from' info from the DOM's perspective.
        const links = cssLinks.map<HtmlLink>(link => {
            // Use javascript's prototype inheritance, overriding the `from` property descriptor.
            const newLink: HtmlLink = Object.create(link, {
                from: {
                    get: () => ({
                        get element() { return element },
                        get attribute() { return 'style' },
                        get rangeWithinAttribute() { return link.from.range },
                    }),
                },
            })
            return newLink
        })

        return links // links in the style attribute of *this* element
    })
    return links // links in the style attributes of *all* elements
}

function findLinksInStyleTags({
    rootElement,
    baseUrl,
}: {
    rootElement: Element,
    baseUrl?: UrlString,
}): HtmlLink[] {
    const querySelector = 'style[type="text/css" i], style:not([type])'
    const elements = Array.from(rootElement.querySelectorAll(querySelector))

    const links = elements.flatMap(element => {
        // Find the links in the CSS using a live&editable view on the content.
        const cssLinks = findLinksInCssSynced({
            // A <style> element's textContent should never be null, but we please the type checker.
            get: () => element.textContent || '',
            set: newValue => { element.textContent = newValue },
            baseUrl: baseUrl || (element.baseURI as UrlString),
        })

        // Tweak the links to describe the 'from' info from the DOM's perspective.
        const links = cssLinks.map<HtmlLink>(cssLink => {
            // Use javascript's prototype inheritance, overriding the `from` property descriptor.
            const htmlLink: HtmlLink = Object.create(cssLink, {
                from: {
                    get: () => ({
                        get element() { return element },
                        get rangeWithinTextContent() { return cssLink.from.range },
                    }),
                },
            })
            return htmlLink
        })

        return links // links in this style element
    })
    return links // links in all <style> tags
}
