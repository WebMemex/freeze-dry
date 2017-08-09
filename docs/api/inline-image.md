# Inline Images
## `getUrlsFromSrcset(srcsetValue) => Array`
Takes a srcset attribute value string and returns an array of URLs contained in it.

#### Arguments

1. `srcsetValue` (`string`): String containing the srcset attribute value.

#### Returns

`Array`: String array containing all the URLs contained in the srcset attribute value string provided.

#### Examples

```es6
console.log(srcsetValue)    <!-- small.jpg 500w, medium.jpg 1000w, large.jpg 2000w -->
const urls = getUrlsFromSrcset(srcsetValue)
console.log(urls)    <!-- ['small.jpg', 'medium.jpg', 'large.jpg'] -->
```

## `inlineImages({rootElement, docUrl}) => void`
Converts all the inline image URLs to a data URL.

#### Arguments

1. `rootElement` (`HTMLElement`): Root document for the function to operate on.
2. `docUrl` (`string`): Document URL of the page.

#### Examples

```es6
console.log(rootElement)    <!-- <html><head></head><body><img src="https://example.com/background.jpeg" /></body></html> -->
inlineImages({rootElement, docUrl})
console.log(rootElement)    <!-- <html><head></head><body><img src="data:image/jpeg;base64,..." /></body></html> -->

```