# Freeze-dry: web page conservation

Freeze-dry stores a web page as it is shown in the browser. It takes the DOM, and returns it as an
HTML string, after having and inlined external resources such as images and stylesheets (as `data:`
URLs).

It also ensures the snapshot is static and completely offline: all scripts are removed, and any
attempt at internet connectivity is blocked by adding a content security policy. The resulting HTML
document is a static, self-contained snapshot of the page.

For more details about how this exactly works, see [src/Readme.md](src/Readme.md).

## Usage

    const html = await freezeDry(document, options)

The `options` object is optional, and even `document` can be omitted, in which case it will default
to `window.document`. Possible options are:
- `timeout` (number): Maximum time (in milliseconds) spent on fetching the page's subresources. The
  resulting HTML will have only succesfully fetched subresources inlined.
- `docUrl` (string): overrides the documents's URL. This will influence the expansion of relative
  URLs, and is useful for cases where the document was constructed dynamically (e.g. using
  [DOMParser][]).
- `charsetDeclaration` (string): The value put into the <meta charset="…"> element of the snapshot.
   Default is 'utf-8'. If you will store/serve the returned string using an encoding other than
   UTF8, pass its name here; or pass null or an empty string to omit the declaration altogether.
- `addMetadata` (boolean): If true (the default), a `meta` and `link` tag will be added to the
  returned html, noting the documents URL and time of snapshotting (that is, the current time).
  <details>

  The meta data mimics the HTTP headers defined for the [Memento][] protocol. The added headers look
  like so:

      <meta http-equiv="Memento-Datetime" content="Sat, 18 Aug 2018 18:02:20 GMT">
      <link rel="original" href="https://example.com/main/page.html">

  </details>

- `rememberOriginalUrls` (boolean): If true (the default), preserves the original value of an
  element attribute if its URLs are inlined, by noting it as a new `data-original-...` attribute.
  For example, `<img src="bg.png">` would become `<img src="data:..." data-original-src="bg.png">`.
  Note this is an unstandardised workaround to keep URLs of subresources available; unfortunately
  URLs inside stylesheets are still lost.
- `contentSecurityPolicy` (string or object): Add a `<meta>` tag with the given content security
  policy to the snapshot. The default value disallows loading any external resources.
- `now` (Date): Overrides the snapshot time (only relevant when `addMetadata` is true). Mainly
  intended for testing purposes.
- `fetchResource`: custom function for fetching resources; should be API-compatible with the global
  `fetch()`, but may also return an object `{ blob, url }` instead of a `Response`.
- `glob`: Overrides the global window object that is used for accessing global DOM interfaces.
  Defaults to `doc.defaultView` or (if that is absent) the global `window`. Intended for (testing)
  environments where `freezeDry` is not run ‘in’ but ‘on’ a DOM (e.g. some [jsdom][] setups).

Note that the resulting string can easily be several megabytes when pages contain images, videos,
fonts, etcetera.


[DOMParser]: https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
[Memento]: https://tools.ietf.org/html/rfc7089
[jsdom]: https://github.com/jsdom/jsdom/
