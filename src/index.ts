// Export freezeDry both as default and as a named export, to allow either of these:
//     import freezeDry from 'freeze-dry';
//     const { freezeDry } = require('freeze-dry');
export { freezeDry as default } from './freeze-dry'
export * from './freeze-dry'
export * from './resource'
export { default as blobToDataUrl } from './blob-to-data-url'
export { default as makeDomStatic } from './make-dom-static'
export * from './make-dom-static'
export { default as setCharsetDeclaration } from './set-charset-declaration'
export { default as setContentSecurityPolicy } from './set-content-security-policy'
export { default as setMementoTags } from './set-memento-tags'
export { default as setLinkTarget } from './set-link-target'

export * from './types'
export * from './extract-links/types'
export * from './extract-links/url-attributes/types'
