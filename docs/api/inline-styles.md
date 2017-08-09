# Inline Images
## `inlineStylesheetContents({stylesheetText, stylesheetUrl}) => string`
Find all url(...) occurrances in a string of CSS, then fetched and inlines them as data URLs.

#### Arguments

1. `stylesheetText` (`string`): Text of the stylesheet.
2. `stylesheetUrl` (`string`): URL of the stylesheet.

#### Returns

`string`: Processed stylesheet text with inlined URLs.

#### Examples

```es6
console.log(stylesheetText)    <!-- div{background-image: url("https://example.com/background.png")} -->
const processedStylesheet = inlineStylesheetContents({stylesheetText, stylesheetUrl})
console.log(processedStylesheet)    <!-- div{background-image: url("data:image/png;base64,...")} -->
```

## `inlineLinkedStylesheets({rootElement, docUrl}) => void`
Inline the stylesheet as a data URL by fetching the data from the ```<link rel="stylesheet">``` URL and inline every URL in that stylesheet.

#### Arguments

1. `rootElement` (`HTMLElement`): Root document for the function to operate on.
2. `docUrl` (`string`): Document URL of the page.

#### Examples

```es6
```

## `inlineStyleTagContents({rootElement, docUrl}) => void`
Inline any URLs contained in the ```<style>...</style>``` block.

#### Arguments

1. `rootElement` (`HTMLElement`): Root document for the function to operate on.
2. `docUrl` (`string`): Document URL of the page.

#### Examples

```es6
console.log(rootElement)    <!-- <html><head><style>div{background-image: url('https://example.com/background.png')}</style></head></html> -->
inlineStyleTagContents({rootElement, docUrl})
console.log(rootElement)    <!-- <html><head><style>div{background-image: url("data:image/png;base64,...")}</style></head></html> -->
```

## `inlineInlineStyleContents({rootElement, docUrl}) => void`
Inline any URLs contained in the ```<sometag style="...">```inline style.

#### Arguments

1. `rootElement` (`HTMLElement`): Root document for the function to operate on.
2. `docUrl` (`string`): Document URL of the page.

#### Examples

```es6
console.log(rootElement)    <!-- <html><body><div style="background-image: url('https://example.com/background.png')"></div></body></html> -->
inlineInlineStyleContents({rootElement, docUrl})
console.log(rootElement)    <!-- <html><body><div style="background-image: url('data:image/png;base64,...')"></div></body></html> -->
```

## `inlineStyles({rootElement, docUrl}) => void`
Freeze dry all the components of an inline stylesheet.

#### Arguments

1. `rootElement` (`HTMLElement`): Root document for the function to operate on.
2. `docUrl` (`string`): Document URL of the page.

#### Examples

```es6
```