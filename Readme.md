# Freeze-dry: web page conservation

Freeze-dry stores a web page as it is shown in the browser. It takes the DOM, and returns it as an
HTML string, after having and inlined external resources such as images and stylesheets (as `data:`
URLs).

It also ensures the snapshot is static and completely offline: all scripts are removed, and any
attempt at internet connectivity is blocked by adding a content security policy. The resulting HTML
document is a static, self-contained snapshot of the page.

For more details about how this exactly works, see [src/Readme.md](src/Readme.md).

## Usage

    const html = await freezeDry(document)

`document` can be omitted, in which case it will default to `window.document`.

Optionally, the document's URL can be overridden. This will influence the expansion of relative
URLs, and is useful for cases where the document was constructed dynamically (e.g. using
[DOMParser][]).

    const html = await freezeDry(document, { docUrl: 'https://example.com/page' })

Note that the resulting string can easily be several megabytes when pages contain images, videos,
fonts, etcetera.


[DOMParser]: https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
