# Remove Scripts
## `removeScriptElements({rootElement}) => void`
Find all ```<script>...</script>``` occurrances in a document and remove them.

#### Arguments

1. `rootElement` (`HTMLElement`): Root document for the function to operate on.

#### Examples

```es6
console.log(rootElement)    <!-- <html><script>alert('Hi');</script></html> -->
removeNoscripts({rootElement})
console.log(rootElement)    <!-- <html></html> -->
```

## `removeEventHandlers({rootElement}) => void`
Find all ```<script>...</script>``` occurrances in a document and remove them.

#### Arguments

1. `rootElement` (`HTMLElement`): Root document for the function to operate on.

#### Examples

```es6
console.log(rootElement)    <!-- <html><body><div onhover="handler()">Hover</div></body></html> -->
removeNoscripts({rootElement})
console.log(rootElement)    <!-- <html><body><div>Hover</div></body></html> -->
```

## `removeJavascriptHrefs({rootElement}) => void`
Find all ```javascript:``` link occurrances in a document and remove them.

#### Arguments

1. `rootElement` (`HTMLElement`): Root document for the function to operate on.

#### Examples

```es6
console.log(rootElement)    <!-- <html><body><<a href="javascript:my_function();">Click</a></body></html> -->
removeNoscripts({rootElement})
console.log(rootElement)    <!-- <html><body><a href="javascript:">Click</a></body></html> -->
```

## `removeScripts({rootElement}) => void`
Removes all kinds of scripts contained in the given document.

#### Arguments

1. `rootElement` (`HTMLElement`): Root document for the function to operate on.

#### Examples

```es6
```