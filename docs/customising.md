# Customising freeze-dry

Default freezeDry returns self-contained, single html string.

Other uses, other needs:
- skip some subresources
- save subresources separately, rather than inlining them as data: URLs
- remove, replace, or add content
- …


## Customise URLs for subresources (instead of `data:` URLs)

newUrlForResource

processSubresource

(Note you may have to change the
`Content-Security-Policy` to allow your subresources to be loaded.)


## Customise fetching of subresources

fetchResource

E.g. cache.


## Tweak content

custom dry().



## Define a `processSubresource` callback

### Breadth-first recursion

Normally, freeze-dry can only finish once it got all subresources. E.g. a stylesheet containing a background image: first inline the image in the stylesheet, then the stylesheet in the html page.

However, in some use cases you might not need to have the subresources yet.

#### Freezing proxy

Further still, in some cases you might not care about getting all subresources; you could get them lazily once they are requested. Use Resource.fromLink directly with a URL and resourceType.

    Resource.fromLink({ absoluteTarget: request.url, subresourceType: request.headers.get('Sec-Fetch-Dest')})


## Fully customised: implement your own freezeDry

Your particular needs not served by the above? Don’t use freezeDry function itself, but use the components it provides to [build your own][].

[build your own]: build-your-own.md
