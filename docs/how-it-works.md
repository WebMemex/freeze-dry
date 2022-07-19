# How freeze-dry works

As a first approximation, `freezeDry` can be thought of as a simple function that captures the DOM
and returns it as a string, like this:

    async function simpleFreezeDry() { return document.documentElement.outerHTML; }

However, freezeDry does a lot more: inline frame contents and subresources (as `data:` URLs), remove
scripts and interactivity, expand relative links, timestamp the snapshot, etc.


## Freeze-drying, step by step

Freeze-dry takes the following steps:

1. Capture the document in its current state by cloning its DOM (and the DOMs inside frames,
   recursively).

2. Process the document’s subresources (images, stylesheets, etc.), recursively.

   For each subresource, it takes these steps:
   1. Fetch the subresource (ideally from browser cache).
   2. Recurse: process this subresource’s subresources (e.g. a stylesheet may link to fonts and
      images).
   3. ‘Dry’ the subresource, making it static and context-free (expand relative links).
   4. Update the parent resource’s link to this subresource. The default behaviour is to inline
      each subresource into the document as a [data URL][].

3. ‘Dry’ the DOM, making it static and context-free (remove scripts, expand relative links, etc.).

4. Finalise the snapshot (e.g. add metadata about it’s original location).

The resulting DOM is turned into a string of HTML, ready to e.g. be written to a file.

Below, each step is explained in detail.


### Step 1: Capture the DOM

To ‘freeze’ the DOM in its current state, freeze-dry [clones][] the given document, and each
document embedded in an (i)frame (recursively, in case any frame itself contains frames).

This step is performed synchronously. Subsequent steps include asynchronous actions (mainly fetching
subresources), but only operate on the cloned DOM. Any changes to the DOM (e.g. by its own scripts)
happening after Step 1 should therefore not influence the result.


### Step 2: Process subresources, recursively

Freeze-dry captures the page along with its images, stylesheets, and other subresources. This
includes subresources of those subresources, e.g. a font or background image file that is linked in
a stylesheet.

Freeze-dry searches the page for attributes that define subresource links (see the note below on
[what counts as a subresource](#what-counts-as-a-subresource)). It also finds links inside the CSS
in `style` attributes and `<style>` elements.


#### Subresource step 1:

Fetch the subresource. Ideally the browser provides it from its cache, since it likely already
obtained it in order to display the page.

#### Subresource step 2: Recurse: process this subresource’s subresources

These four subresource steps are applied to each ‘sub-subresource’. For example, a stylesheet may
link to fonts and images, so each of those is processed first before continuing.

#### Subresource step 3: ‘Dry’ the subresource

What happens in this step depends on the type of subresource.

Most types of subresource don’t need any changes. Stylesheets may have relative links, which are
converted to absolute links. Framed documents get the same treatment as described below in
freeze-dry’s [Step 3](#step-3-dry-the-page).

#### Subresource step 4: Update the parent resource’s link to this subresource.

Unless instructed otherwise (see the option `newUrlForResource`), freeze-dry will inline each
subresource inside the resulting HTML by encoding each link as a [data URL][].

For example, the document `http://example.org/page` may contain an image: `<img src="logo.png">`.
After fetching the image file, freeze-dry base64-encodes it into a string, e.g.
`iVBORw0KGgoAAAANSUhE………iQAAAABJRU5ErkJggg==` (note [this can be large](#snapshot-file-size-when-using-data-urls)).

The `src` attribute of the image tag is replaced with this string. To remember its original value
(e.g. for archival interests), freeze-dry also creates an attribute `data-original-src`.

The resulting tag in the snapshot’s HTML is:

    <img data-original-src="logo.png" src="data:image/png;base64,iVBORw0KGgoAAAANSUhE………iQAAAABJRU5ErkJggg==">


### Step 3: ‘Dry’ the page

After inlining its subresources, freeze-dry tweaks to the document to try make its HTML represent
its current state as accurately as possible.
neatly when viewed. This step is also applied to each framed document (see [Subresource step 3](#subresource-step-3-dry-the-subresource)
above).

All relative URLs in the document are expanded to become absolute URLs, to ensure that links in the
snapshotted page still point to the intended locations.

Importantly, Freeze-dry removes all scripts. For many use cases it may be nice to retain scripts for
interactive features, but unfortunately they also bring problems:
 - They may mess up the snapshotted DOM as they were written to be executed on the original source
   HTML.
 - They may request arbitrary resources from the internet that were not contained in the snapshot.
 - They could compromise the viewer’s privacy and security.

As it is infeasible to determine whether a script would cause any of the above issues, the reliable
solution is removing scripts altogether. Freeze-dry removes `<script>` elements, but also
all `on…` attributes (`onclick` etc.) and `javascript:` links.

Freeze-dry also removes `<noscript>` elements. Freeze-dry is assumed to run in a JavaScript-enabled
browser, after JavaScript has been executed. If the snapshot would be viewed in a
JavaScript-disabled browser, it should therefore not show any `<noscript>` content.

Also, it removes other forms of interactivity. The `contenteditable` attribute is removed from any
elements that have it. Form inputs are still left as inputs, to avoid changing their appearance
(existing input is currently not captured; see [issue #19][]).


### Step 4: Finalise the snapshot

Freeze-dry finalises the snapshot by adding some tags:

1. It adds snapshot metadata: the current date&time, and the page’s original URL. See the option
   `addMetadata` to override this default.

   This metadata mimics the HTTP headers defined for the [Memento][] protocol. The added headers
   look like so:

       <meta http-equiv="Memento-Datetime" content="Sat, 18 Aug 2018 18:02:20 GMT">
       <link rel="original" href="https://example.com/main/page.html">

2. It sets a [Content Security Policy][] in a `<meta>` tag, to instruct a browser opening the
   snapshot that it should not load any subresources from the web; only `data:` URLs are allowed.
   Ideally all subresources are inlined in the snapshot, and all scripts are removed, so this policy
   has no effect, but in case of mistakes this tag improves security and ensures that ‘what you see
   is what you got’. See the option `contentSecurityPolicy` to override this default.

3. It sets the `<meta charset="utf-8">` at the top of the `<head>`; under the assumption that you
   will store/serve the snapshot in the UTF-8 character encoding. See the option
   `charsetDeclaration` to override this default.


[data URL]: https://tools.ietf.org/html/rfc2397
[clones]: https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode
[obese website]: https://idlewords.com/talks/website_obesity.htm
[issue #19]: https://github.com/WebMemex/freeze-dry/issues/19 "#19 - Keep value of form inputs"
[Memento]: https://tools.ietf.org/html/rfc7089
[Content Security Policy]: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP


## Notes

### What counts as a subresource

A web page’s subresources are the resources it links to which a web browser may load to display the
page. Each subresource is defined by a link, but not each link defines a subresource: the `src`
attribute of an `<img>` element defines a subresource, but the `href` of an `<a>` element does not
(the latter is called ‘jump link’ or just ‘hyperlink’, depending on who you ask).

Unfortunately, browsers do not provide a way to list a document’s (subresource) links. The DOM
provides `document.links`, but this is an old relic that only lists `<link>`, `<a>` and `<area>`
elements. Web standards do list the various attributes that can define a link (or even multiple
links, as with an image’s `srcset`), and note for each whether this link is a subresource link.
Freeze-dry combines the lists from the [HTML 4.0][], [HTML 5.2][], and the [WHATWG HTML][]
specifications. See the source files in `src/resource/links`.

An (i)frame’s `src` document is considered a subresource too. Rather than fetching its `src` URL in
Step 2, its DOM is already captured in Step 1 (if possible; see [the note below](#grabbing-cross-origin-frameiframe-content)).
However, an (i)frame without a `src` and/or with a `srcdoc` attribute is different: the document in
the frame is not considered a subresource (and *its* subresources are considered direct subresources
of its parent document).

[HTML 4.0]: https://www.w3.org/TR/REC-html40/index/attributes.html
[HTML 5.2]: https://www.w3.org/TR/2017/REC-html52-20171214/fullindex.html#attributes-table
[WHATWG HTML]: https://html.spec.whatwg.org/multipage/indices.html#attributes-3


### Grabbing cross-origin frame/iframe content

In Step 1, freeze-dry tries to clone each document living inside an (i)frame, recursively. However,
accessing these framed documents may be impossible because of the browser’s security restrictions
(the single origin policy).

If the document inside a frame cannot be accessed, its current state cannot be captured. In this
case, its `src` URL will be fetched as with any other subresource in Step 2. The obtained HTML will
be parsed (but any scripts it contains are not executed), and then processed as it would have been
if the framed document was captured directly (its subresources are processed, etc.). So the snapshot
will include the framed document, but without any modifications made to it by scripts.

When freeze-dry is run from a more privileged environment, such as a browser extension, it could
work around this issue, but this is not yet provided for.


### Snapshot file size when using data URLs

Freeze-dry’s default behaviour is to inline stylesheets, images and other subresources into the
HTML, by turning each into a [data URL][]. Obviously, the resulting HTML file gets large. Expect a
couple of megabytes for a typical [obese website][].

While the original specification of data URLs considered that they *“are likely to be
inappropriate”* for anything larger than a few hundred characters, modern browsers can deal with
much more than that.

Note however that the size is more than just the sum of the resources themselves: the base64
encoding takes one byte to encode 6 bits (= log₂ 64), so each subresource takes 33% extra space
(exactly like it happens with email attachments).

Moreover, a sub-subresource will be base64-encoded twice, and so forth. For example, a background
image in a linked stylesheet is encoded as a data URL:

    background: cover url(data:image/png;base64,iVBORw0KGgoAAAANSUhE………iQAAAABJRU5ErkJggg==)

…and then the stylesheet is base64-encoded into the HTML:

    <link rel="stylesheet"
        href="data:text/css;base64,QGltcG9ydCAnZGF0YTp0………PScpIHJlcGVhdDsKfQo="
        data-original-href="/style/style.css">

This background image size is thus grown by a factor 8/6 * 8/6 = 16/9 ≈ 78% overhead.

On the other hand, the removal of scripts from the page may hugely reduce the page size again.

The size overhead may be an acceptable cost for the benefit it provides: a webpage snapshot in a
single file can easily be shared via e.g. email or usb stick, and can be opened in any browser.

However, if you use freeze-dry as a part of larger archival software, you likely want to store
subresources individually (e.g. using content-addressed storage), and avoid duplicating subresources
that are included by many pages. See the option `newUrlForResource`.
