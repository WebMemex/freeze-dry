import { html40, html52, whatwg } from './attribute-lists'
import { mergeWith, uniq } from './util'
import type { AttributeInfo, AttributeInfoDict } from './types'

// Helper for combining two object's element lists.
const mergeAttributeInfos: (info1: AttributeInfo, info2: AttributeInfo) => AttributeInfo =
    (info1, info2) => (info1 === info2 ? info1 : {
        ...info1,
        ...info2,
        elements: uniq(info1.elements.concat(info2.elements)),
    })

// Export the union of all attributes.
const allAttributes: AttributeInfoDict =
    mergeWith<AttributeInfo, AttributeInfoDict>(mergeAttributeInfos)(whatwg, html52, html40)
export default allAttributes
