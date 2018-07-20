# Freeze-dry implementation description

Freeze-dry takes the following steps:
1. Capture the current state of the DOM, i.e. the page as it is currently rendered.
2. Fetch the subresources, recursively building the tree of subresources.
3. Tweak the DOM to make it static and context-free.
4. Make it self-contained by inlining subresources as data URLs.

## Step 1: Capture the DOM

To freeze the DOM in its current state, we clone the given document, as well as documents inside its
frames. Anything that needs the live document is done in this step. We also extract all links in
each document, to build a tree of subresources in the following step; see
[extract-links/Readme.md](extract-links/Readme.md) for details.

In principle, all subsequent steps should be executable in a background script, worker, or
elsewhere, as they will only deal with the clone of the document. However, this possibility is not
yet implemented.

<details><summary><b>
Caveat: grabbing cross-origin frame/iframe content
</b></summary>

Although we try to clone each Document living inside an iframe (recursively), it may be impossible
to access these inner documents because of the browser's single origin policy. If the document
inside a frame cannot be accessed, its current state cannot be captured. In step 2 however, we will
fetch the document by the frame's `src` URL, and use that as its DOM. At least for framed documents
that do not heavily depend on scripts the result should be very similar.

When freeze-dry is run from a more privileged environment, such as a browser extension, it could
work around the single origin policy. A future improvement would be to allow providing a custom
function `getDocInFrame(element)` to enable such workarounds.
</details>

## Step 2: Fetch subresources, recursively

In step 1 and 2 we build a tree of resources and their subresources. In step 1, the document and
documents inside its frames were captured. In step 2, other subresources are collected recursively,
such as images, stylesheets, images and fonts used inside stylesheets, and so on. The result is
stored in a tree composed of `resource`s and `link`s.

<details><summary><b>
Resource object structure
</b></summary>

Each `resource` is represented as an object with the following properties:
- `url`: URL of the resource.
- `blob`: a Blob with the resource content.
- `links`: an array of `link`s, providing a live view on the links defined in the resource.
   Changing the target of a link will change the resource contents. See
  [extract-links/Readme.md](extract-links/Readme.md) for details about links.
  When a subresource is fetched, it is remembered as a property `resource` on the corresponding link
  object, thus forming a tree of resources.
- `string` (optional): the resource as a string. Available only on DOM and CSS resources.
- `doc` (optional): holds the Document object, on a DOM resource.
</details>

To get each resource's contents, we simply use the global `fetch` method, while telling it to get
resources from the cache if possible. This is not ideal, and often still triggers a re-request of
the resource, but I don't know of a more direct way to access the resource.

## Step 3: "Dry" the resources to make them static and context-free

We have to apply some tweaks to the document and its subresources, so the snapshot will behave
neatly when viewed.

Most significantly, we remove all scripts. For many use cases it would be nice to retain them for
interactive features, but unfortunately their behaviour cannot easily be reasoned about, and keeping
them may mess up the page or compromise the viewer's privacy and security.

Also, we make `contenteditable` elements non-editable (except form inputs, as disabling would change
their appearance).

For the purpose of making the document 'context-free', we turn all relative URLs into absolute URLs.

## Step 4: Create a fully self-contained html document

Having captured and tweaked the DOM and its subresources, the final step is to assemble all
resources together to create a single, self-contained document. Starting from the leaves of the
resource tree, the links to subresources are turned into a [data URL][]s, meaning that the full
content of the resource is inlined into the link using base64 encoding.

Because the original URL of a subresource might be relevant for the reader, an extra attribute is
added to keep it available. For example, the original value of the `src` attribute of an `<img>`
would be kept in an attribute called `data-original-src` (although there is currently no spec for
this). However, for URLs in stylesheets no such solution has been implemented as a stylesheet has no
obvious place for such notes; though perhaps we could put them in comments.

One more important tweak is to add a [Content Security Policy][] in a `<meta>` tag, that instructs
the browser to not allow any scripts nor any connectivity to the internet; we only permit
subresources that are given as data URLs. This tag reliably ensures that even if freeze-dry makes a
mistake, or misses some type of resource, no harm can be done.

This output step could easily be replaced with a different implementation, in order to produce
different types of output. For example, you could create an [MHTML][] file or store each resource on
[IPFS][].

[data URL]: https://tools.ietf.org/html/rfc2397
[Content Security Policy]: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
[MHTML]: https://tools.ietf.org/html/rfc2557
[IPFS]: https://ipfs.io
