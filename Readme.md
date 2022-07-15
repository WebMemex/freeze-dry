---
layout: top_layout
---

# Freeze-dry: web page conservation

Freeze-dry captures a web page as it is currently shown in the browser. It takes the DOM, grabs its
subresources such as images and stylesheets, and compiles them all into a single string of HTML.

The resulting HTML document is a static, self-contained snapshot of the page, that could for example
be used for archival, offline viewing, or static republishing; it could be saved on a usb stick or
attached to an email, and be opened on any device.

Technically, `freeze-dry` is a JavaScript function that is run on a web page. It is mainly intended
for use by browser extensions and headless browsers. Much of its behaviour can be
[customised](#customising-freeze-drys-behaviour) if desired.


## How does it compare to…

Freeze-drying a web page is comparable to making a screenshot, or ‘printing’ to a PDF file. But the
snapshot adapts to the viewer’s screen size, allows text to be selected, can be read by a screen
reader, and so on; just as it would on the original web page.

It is thus more comparable to web browsers’ *“Save As…”* feature, except that it puts page resources
inside the file (not in a folder next to it), and it captures the current view, after scripts
executed (and it removes the scripts).

Freeze-dry is most similar to what browser extensions like [SingleFile][] or [WebScrapbook][] do. It
is used in (and spun off from) the [WebMemex][] browser extension.

But the main difference from all the above: freeze-dry is a JavaScript/TypeScript module, and highly
customisable, so it can be used in other software for various snapshotting (or other) purposes.

For example, the researchers at Ink & Switch found freeze-dry their *“[favorite solution]”* to make web page clippings for their Capstone creativity tool:

> “The solution we settled on for Capstone is freeze-dry. Its use was just a few lines of code.
>
> Freeze Dry takes the page’s DOM as it looks in the moment, with all the context of the user’s browser including authentication cookies and modifications made to the page dynamically via Javascript. It disables anything that will make the page change (scripts, network access). It captures every external asset required to faithfully render that and inlines it into the HTML.
>
> We felt that this is a philosophically-strong approach to the problem. Freeze-dry can save to a serialized `.HTML` file for viewing in any browser; for Capstone, we stored the clipped page as one giant string in the app’s datastore.”

[SingleFile]: https://github.com/gildas-lormeau/SingleFile
[WebScrapbook]: https://addons.mozilla.org/en-US/firefox/addon/webscrapbook/
[WebMemex]: https://webmemex.org/
[favorite solution]: https://www.inkandswitch.com/capstone/#our-favorite-solution-freeze-dry


## How does it work?

As a first approximation, `freezeDry` can be thought of as a simple function that captures the DOM
and returns it as a string, like this:

    async function simpleFreezeDry() { return document.documentElement.outerHTML; }

However, freezeDry does a lot more: inline frame contents and subresources (as `data:` URLs), remove
scripts and interactivity, expand relative links, timestamp the snapshot, etc.

For a detailed explanation, see [How freeze-dry works][].

[How freeze-dry works]: ./how-it-works/


## Usage

Get the module, e.g. using `npm`:

    npm install freeze-dry

Then, in your code:

    import freezeDry from 'freeze-dry'
    …
    const html = await freezeDry(document, options)

In a few seconds, `freezeDry` should return your snapshot as a string (potentially a very long one).

The `options` parameter is optional. In fact, `document` is optional too (it defaults to
`window.document`). For usage details, see [its documentation](api/functions/freezeDry.html).


### Customising freeze-dry’s behaviour

The `options` argument to the `freezeDry()` function lets you tweak its behaviour. For example,
instead of inlining subresources as `data:` URLs, you could store the subresources separately;
perhaps to create an [MHTML][] file, or to store each resource on [IPFS][]. See the [FreezeDryConfig
documentation](api/interfaces/FreezeDryConfig.html) for all options.

If `freezeDry`’s options don’t suffice for your needs, you can even build your own custom
`freezeDry`-ish function by directly using freeze-dry’s internals. To get started, have a look at
the [API documentation](api/), especially the [`Resource`](api/classes/Resource.html) class, and peek
at the [implementation of `FreezeDryer`][].

[MHTML]: https://tools.ietf.org/html/rfc2557
[IPFS]: https://ipfs.io
[implementation of `FreezeDryer`]: https://github.com/WebMemex/freeze-dry/blob/main/src/freeze-dry.ts
