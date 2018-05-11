import multisplice from 'multisplice'

import { html52 } from './url-attributes/attribute-lists'


export default async function fixLinks({rootElement, baseURI, docUrl}) {
    // TODO use merger of all specs?
    const attributeInfos = Object.values(html52)

    for (const attributeInfo of attributeInfos) {
        const { attribute, elements: elementNames, parse, makeAbsolute } = attributeInfo
        const selector = elementNames
            .map(name => `${name}[${attribute}]`) // Only find elements having the attribute set.
            .join(', ')
        const elements = [...rootElement.querySelectorAll(selector)]
        elements.forEach(element => {
            // Read the attribute's value
            const attributeValue = element.getAttribute(attribute)
            const extractedUrls = parse(attributeValue)

            // Make its URL(s) absolute
            const maybeMakeAbsolute = url => {
                if (url.startsWith('#')) {
                    // Leave within-document links unchanged.
                    // TODO consider doing this only if the target is within rootElement.
                    return url
                }
                const absoluteUrl = makeAbsolute(url, element, baseURI, docUrl)
                return absoluteUrl
            }
            const splicer = multisplice(attributeValue)
            extractedUrls.forEach(({ url, index }) => {
                splicer.splice(index, index + url.length, maybeMakeAbsolute(url))
            })
            const newAttributeValue = splicer.toString()

            // Replace it with the new value.
            if (newAttributeValue !== attributeValue) {
                element.setAttribute(attribute, newAttributeValue)
                // Remember the old value.
                element.setAttribute(`data-original-${attribute}`, attributeValue)
            }
        })
    }
}
