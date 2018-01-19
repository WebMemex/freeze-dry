# Remove No-Scripts
## `removeNoscripts({rootElement}) => void`
Find all ```<noscript>``` occurrances in a document and remove them.

#### Arguments

1. `rootElement` (`HTMLElement`): Root document for the function to operate on.

#### Examples

```es6
console.log(rootElement)    <!-- <html><noscript>Your browser doesn't support JavaScript</noscript></html> -->
removeNoscripts({rootElement})
console.log(rootElement)    <!-- <html></html> -->
```