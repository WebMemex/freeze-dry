# Fix Links
## `fixLinks({rootElement, docUrl}) => void`
Converts all the anchor links(```eg. <a href="#home">Home</a>```) to the page to their respective absolute URLs if ```<head>``` is not present in the document, else it appends a base element to the head containing the document URL of the page.

#### Arguments

1. `rootElement` (`HTMLElement`): Root document for the function to operate on.
2. `docUrl` (`string`): Document URL of the page.

#### Examples

```es6
console.log(rootElement)    <!-- <html><head></head><body><a href="#home">Home</a></body></html> -->
fixLinks({rootElement, docUrl})
console.log(node)    <!-- <html><head><base href='https://example.com'></head><body><a href="#home">Home</a></body></html> -->

console.log(rootElement)    <!-- <html><body><a href="#home">Home</a></body></html> -->
fixLinks({rootElement, docUrl})
console.log(node)    <!-- <html><body><a href="https://example.com/#home">Home</a></body></html> -->
```