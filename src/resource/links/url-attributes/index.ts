import { html40, html52, whatwg } from './attribute-lists'
import { merge, uniq } from './util'
import type { AttributeInfo, AttributeInfoDict } from './types'

// Helper for combining two object's element lists.
const mergeAttributeInfos: (info1: AttributeInfo, info2: AttributeInfo) => AttributeInfo =
    (info1, info2) => (info1 === info2 ? info1 : {
        ...info1,
        ...info2,
        elements: uniq(info1.elements.concat(info2.elements)),
    })

// Export the union of all attributes.
const allAttributes: AttributeInfoDict = merge([whatwg, html52, html40], mergeAttributeInfos)
export default allAttributes

export * from './types'
