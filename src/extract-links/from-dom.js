import getBaseUrl from './get-base-url.js'
import { syncingParsedView } from './parse-tools.js'
import { extractLinksFromCssSynced } from './from-css.js'
import urlAttributes from './url-attributes/index.js'
import { flatMap } from './util.js'

/**
 * Extracts links from an HTML Document.
 * @param {Document} doc - the Document to extract links from.
 * @param {Object} [options]
 * @param {string} [options.docUrl] - can be specified to override doc.URL
 * @returns {Object[]} The extracted links. Each link provides a live, editable view on one URL
 * inside the DOM.
 */
export function extractLinksFromDom(doc, { docUrl } = {}) {
    const baseUrl = docUrl !== undefined
        ? getBaseUrl(doc, docUrl)
        : undefined // No override; functions will read the correct value from <node>.baseURI.

    const rootElement = doc.documentElement // = the <html> element.
    const links = [
        ...extractLinksFromAttributes({ rootElement, baseUrl, docUrl }),
        ...extractLinksFromStyleAttributes({ rootElement, baseUrl }),
        ...extractLinksFromStyleTags({ rootElement, baseUrl }),
    ]
    return links
}

function extractLinksFromAttributes({ rootElement, baseUrl, docUrl }) {
    // For each known attribute type, we find all elements having it.
    // Note the 'style' attribute is handled separately, in extractLinksFromStyleAttributes below.
    const links = flatMap(Object.values(urlAttributes), attributeInfo => {
        const { attribute, elements: elementNames } = attributeInfo
        const selector = elementNames
            .map(name => `${name}[${attribute}]`) // Only find elements having the attribute set.
            .join(', ')
        const elements = Array.from(rootElement.querySelectorAll(selector))
        const links = flatMap(elements, element =>
            linksInAttribute({ element, attributeInfo, baseUrl, docUrl })
        )
        return links // links of this attribute type
    })
    return links // links in all attributes of all elements
}

// Gets the links (usually just one) inside the specified attribute of the given element.
function linksInAttribute({ element, attributeInfo, baseUrl, docUrl }) {
    const { attribute, parse, makeAbsolute } = attributeInfo

    // Get a live&editable view on the URL(s) in the attribute.
    const parsedAttributeView = syncingParsedView({
        parse,
        get: () => element.getAttribute(attribute),
        set: value => { element.setAttribute(attribute, value) },
    })

    const links = parsedAttributeView.map(tokenView => ({
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
                    return [index, index + tokenView.token.length]
                },
            }
        },

        // These values are constant, but we use getters anyway to emphasise they are read-only.
        get isSubresource() { return attributeInfo.isSubresource },
        get subresourceType() { return attributeInfo.subresourceType },
    }))
    return links
}

function extractLinksFromStyleAttributes({ rootElement, baseUrl }) {
    // TODO try using element.style instead of parsing the attribute value ourselves.
    const querySelector = '*[style]'
    const elements = Array.from(rootElement.querySelectorAll(querySelector))
    const links = flatMap(elements, element => {
        // Extract the links from the CSS using a live&editable view on the attribute value.
        const cssLinks = extractLinksFromCssSynced({
            get: () => element.getAttribute('style'),
            set: newValue => { element.setAttribute('style', newValue) },
            baseUrl: baseUrl || element.baseURI,
        })

        // Tweak the links to describe the 'from' info from the DOM's perspective.
        const links = cssLinks.map(link =>
            // Use javascript's prototype inheritance, overriding the `from` property descriptor.
            Object.create(link, {
                from: {
                    get: () => ({
                        get element() { return element },
                        get attribute() { return 'style' },
                        get rangeWithinAttribute() { return link.from.range },
                    }),
                },
            })
        )

        return links // links in the style attribute of *this* element
    })
    return links // links in the style attributes of *all* elements
}

function extractLinksFromStyleTags({ rootElement, baseUrl }) {
    const querySelector = 'style[type="text/css" i], style:not([type])'
    const elements = Array.from(rootElement.querySelectorAll(querySelector))

    const links = flatMap(elements, element => {
        // Extract the links from the CSS using a live&editable view on the content.
        const cssLinks = extractLinksFromCssSynced({
            get: () => element.textContent,
            set: newValue => { element.textContent = newValue },
            baseUrl: baseUrl || element.baseURI,
        })

        // Tweak the links to describe the 'from' info from the DOM's perspective.
        const links = cssLinks.map(link =>
            // Use javascript's prototype inheritance, overriding the `from` property descriptor.
            Object.create(link, {
                from: {
                    get: () => ({
                        get element() { return element },
                        get rangeWithinTextContent() { return link.from.range },
                    }),
                },
            })
        )

        return links // links in this style element
    })
    return links // links in all <style> tags
}
