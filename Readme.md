# Freeze-dry: web page conservation

Freeze-dry captures a web page as it is currently shown in the browser. It takes the DOM, grabs its
subresources such as images and stylesheets, and compiles them all into a single string of HTML.

The resulting HTML document is a static, self-contained snapshot of the page, that could for example
be used for archival, offline viewing, or static republishing; it could be saved on a usb stick or
attached to an email, and be opened on any device.

Freeze-drying a web page is comparable to making a screenshot, or ‘printing’ to a PDF file. But the
snapshot adapts to the viewer’s screen size, allows text to be selected, can be read by a screen
reader, and so on; just as it would on the original web page.

Technically, `freeze-dry` is a JavaScript function that is run on a web page. It is mainly intended
for use by browser extensions and headless browsers. Much of its behaviour can be [customised][] if
needed.


## Usage

Get the module, e.g. using `npm`:

    npm install freeze-dry

Then, in your code:

    import freezeDry from 'freeze-dry'
    …
    const html = await freezeDry(document, options)

In a few seconds, `freezeDry` should return your snapshot as a string (potentially a very long one).

The `options` parameter is optional. In fact, `document` is too (it defaults to `window.document`).

### Customising freeze-dry’s behaviour

The `options` argument to the `freezeDry()` function lets you tweak its behaviour. For example,
instead of inlining subresources as `data:` URLs, you could store the subresources separately;
perhaps to create an [MHTML][] file, or store each resource on [IPFS][].

See the [API][] documentation for all options, and the [customising][] page for examples.

If `freezeDry`’s options don’t suffice for your needs, you can even ‘[build your own][]’ custom
freeze-dry-ish function in just a few lines of code, by directly using freeze-dry’s internals.

[MHTML]: https://tools.ietf.org/html/rfc2557
[IPFS]: https://ipfs.io
[customising]: docs/customising.md
[build your own]: docs/build-your-own.md


### All options

Possible options are:
- `timeout` (number): Maximum time (in milliseconds) spent on fetching the page's subresources. The
  resulting HTML will have only succesfully fetched subresources inlined.
- `signal` (AbortSignal): Signal to abort subresource fetching at any moment. As with `timeout`, the
  resulting HTML will have only succesfully fetched subresources inlined.
- `docUrl` (string): overrides the documents's URL. This will influence the expansion of relative
  URLs, and is useful for cases where the document was constructed dynamically (e.g. using
  [DOMParser][]).
- `charsetDeclaration` (string): The value put into the <meta charset="…"> element of the snapshot.
   Default is 'utf-8'. If you will store/serve the returned string using an encoding other than
   UTF8, pass its name here; or pass null or an empty string to omit the declaration altogether.
- `addMetadata` (boolean): If true (the default), a `meta` and `link` tag will be added to the
  returned html, noting the documents URL and time of snapshotting (that is, the current time).
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

[DOMParser]: https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
[jsdom]: https://github.com/jsdom/jsdom/
