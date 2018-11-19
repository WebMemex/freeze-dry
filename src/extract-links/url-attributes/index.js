import { html40, html52, whatwg } from './attribute-lists.js'
import { mergeWith, uniq } from './util.js'

// Helper for combining two object's element lists.
const mergeAttributeInfos = (info1, info2) => (info1 === info2 ? info1 : {
    ...info1,
    ...info2,
    elements: uniq(info1.elements.concat(info2.elements)),
})

// Export the union of all attributes.
export default mergeWith(mergeAttributeInfos)(whatwg, html52, html40)
