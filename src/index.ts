import freezeDry from './freeze-dry'
export default freezeDry
// Also export the default as a named export, so e.g. CommonJS users can type:
//     const { freezeDry } = require('freeze-dry');
export { freezeDry }

export * from './resource'
export { default as blobToDataUrl } from './blob-to-data-url'
export { default as makeDomStatic } from './make-dom-static'
export * from './make-dom-static'
export { default as setCharsetDeclaration } from './set-charset-declaration'
export { default as setContentSecurityPolicy } from './set-content-security-policy'
export { default as setMementoTags } from './set-memento-tags'
export { default as setLinkTarget } from './set-link-target'
