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
