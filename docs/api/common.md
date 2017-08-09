# Common
## `removeNode(node) => void`
Removes the node from the document object in which it is contained.

#### Arguments

1. `node` (`Node`): A node which is to be removed from the document object.


#### Examples

```es6
const node = window.document.implementation.createHTMLDocument()
console.log(node)    <!-- <html><head></head><body></body></html> -->
removeNode(node.querySelector('head'))
console.log(node)    <!-- <html><body></body></html> -->
```

## `urlToDataUrl(url) => string`
Fetches the contents from the URL provided and converts the data into a data URL. Returns ```about:invalid``` if there is an error.

#### Arguments

1. `url` (`string`): URL from where the data is to fetched.

#### Returns

1. `string`: Data URL containing the data fetched from the provided URL.

#### Examples

```es6
await dataUrl = await urlToDataUrl('https://example.com/path/to/img.png')
console.log(dataUrl)    <!-- data:image/png;base64,... -->
```

## `inlineUrlsInAttributes({elements, attributes, attrToUrls, fixIntegrity, rootElement, docUrl}) => void`
Converts the inline URLs in the HTML document to data URLs.

#### Arguments

1. `elements` (`string`): Query selector string used to select only matching elements from the document.
2. `attributes` (`string`): Query selector string for attributes to select only matching attributes from the elements.
3. `attrToUrls` (`function`): Function to get the URL from the selected attribute.
4. `fixIntegrity` (`boolean`):
5. `rootElement` (`HTMLElement`): Root document for the function to operate on.
6. `docUrl` (`string`): Document URL of the page.


#### Examples

```es6

```