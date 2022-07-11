import { FrameElement, UrlString, SubresourceType } from '../../types'
import { Resource, DomResource } from '..' // TODO Remove need for this (recursive) import

/**
 * A representation of a link between web resources.
 *
 * A Link contains:
 * - `from`: an {@link Anchor} representing the place this link ‘points from’.
 * - `target`: the link target, possibly relative URL.
 * - `absoluteTarget`: the link target, expanded to an absolute URL if needed.
 * - `isSubresource`: whether the link’s target is considered a subresource.
 * - `subresourceType`: what type of subresource it links to (if applicable).
 * - `resource`: if available, the `Resource` that this link targets.
 *
 * @category Links
 */
export type Link = NonSubresourceLink | SubresourceLink

/**
 * A representation of a link between web resources.
 *
 * This interface is not for direct use, but is extended by all subtypes of {@link Link}.
 *
 * @category Links
 */
interface Link_base {
    /**
     * The link’s target URL.
     *
     * This is the exact value as it appears in the document, and may thus be
     * a relative URL. For most use cases `absoluteTarget` is more useful than `target`.
     *
     * This property can be written to, which will modify the resource containing the link.
     */
    target: string;

     /**
      * The link’s target URL as an absolute URL.
      *
      * This takes into account factors like the `<base href="...">` element.
      *
      * If the target is not a valid (relative) URL, absoluteTarget equals undefined.
      */
    readonly absoluteTarget?: UrlString;

     /**
      * A boolean indicating whether the resource being linked to is normally considered a
      * subresource of the document. For example, the `src` of an `<img>` element specifies a
      * subresource because the image is considered *part of* the document, while the `href` of an
      * `<a>` or the `action` of a `<form>` merely *point to* another resource.
      */
    readonly isSubresource: boolean;

     /**
      * Information about where the link points ‘from’ (the place where it is defined) in the DOM or
      * stylesheet.
      */
    readonly from: Anchor;
}

/**
 * A {@link Link} that refers to resources without making them ‘part of’ the document.
 *
 * Note the [WHATWG HTML spec](https://html.spec.whatwg.org/multipage/links.html#hyperlink)
 * calls such (and *only* such) links ‘hyperlinks’.
 *
 * @category Links
 */
export interface NonSubresourceLink extends Link_base {
    readonly isSubresource: false;
    readonly subresourceType?: undefined;
}

/**
 * A link that makes its target ‘part of’ the document.
 *
 * @category Links
 */
export interface SubresourceLink extends Link_base {
    readonly isSubresource: true;

    /**
     * Indicates the type of resource (`image`, `style`, ...). This corresponds to what is now
     * called the ‘destination’ in the [WHATWG fetch spec](https://fetch.spec.whatwg.org/#concept-request-destination).
     */
    readonly subresourceType?: SubresourceType;

    /**
     * If the subresource is available, it can be assigned to this attribute.
     */
    // TODO Remove this ‘upward’ dependency.
    resource?: Resource;
}


/**
 * The place a link points ‘from’. For links in HTML or CSS, this is the place where the link is
 * defined (only an HTTP `Link` header can specify the anchor of a link).
 *
 * @category Links
 */
export interface Anchor {
    // TODO Remove this ‘upward’ dependency.
    resource?: Resource;
}

/**
 * An {@link Anchor} that points from the attribute of an HTML element.
 *
 * @category Links
 */
export interface AttributeAnchor<E extends Element, A extends string> extends Anchor {
    element: E;
    attribute: A;
    // Range is kept optional while it is not yet implemented for the `style` attribute (it depends
    // on CssAnchor.range)
    rangeWithinAttribute?: [number, number];
}

/**
 * An {@link Anchor} that points from the text content of an HTML (`<style>`) element.
 *
 * @category Links
 */
export interface TextContentAnchor<E extends Element> extends Anchor {
    element: E;
    // Range is kept optional because not yet implemented (it depends on CssAnchor.range)
    rangeWithinTextContent?: [number, number];
}

/**
 * An {@link Anchor} that points from inside a CSS stylesheet.
 *
 * @category Links
 */
export interface CssAnchor extends Anchor {
    // The character position of the URL inside the stylesheet text.
    range?: [number, number]; // optional because not yet implemented
}


/**
 * A {@link Link} defined in an HTML document.
 *
 * @category Links
 */
export type HtmlLink = HtmlNonSubresourceLink | HtmlSubresourceLink

/**
 * A {@link Link} defined in an HTML document.
 *
 * This interface is not for direct use, but is extended by all subtypes of {@link HtmlLink}.
 *
 * @category Links
 */
export interface HtmlLink_base extends Link_base {
    readonly from: AttributeAnchor<Element, string> | TextContentAnchor<any>;
}

/**
 * A {@link Link} defined in an HTML document, that does not link to a subresource.
 *
 * @category Links
 */
export type HtmlNonSubresourceLink = HtmlLink_base & NonSubresourceLink

/**
 * A {@link Link} defined in an HTML document, that links to a subresource.
 *
 * @category Links
 */
export type HtmlSubresourceLink =
    | HtmlUntypedLink
    | HtmlAudioLink
    | HtmlDocumentLink
    | HtmlEmbedLink
    | HtmlFontLink
    | HtmlImageLink
    | HtmlObjectLink
    | HtmlScriptLink
    | HtmlStyleLink
    | HtmlTrackLink
    | HtmlVideoLink

/**
 * A {@link Link} defined in an HTML document, that links to a subresource.
 *
 * This interface is not for direct use, but is extended by all subtypes of {@link HtmlSubresourceLink}.
 *
 * @category Links
 */
type HtmlSubresourceLink_base = HtmlLink_base & SubresourceLink

/**
 * A {@link Link} defined in an HTML document, that links to a subresource of unknown type.
 *
 * @category Links
 */
export interface HtmlUntypedLink extends HtmlSubresourceLink_base {
    readonly subresourceType: undefined;
}

/**
 * A {@link Link} defined in an HTML document, that links to an `audio` subresource.
 *
 * @category Links
 */
export interface HtmlAudioLink extends HtmlSubresourceLink_base {
    readonly subresourceType: "audio";
    readonly from: AttributeAnchor<HTMLAudioElement | HTMLSourceElement, "src">;
}

/**
 * A {@link Link} defined in an HTML document, that links to a `document` subresource.
 *
 * @category Links
 */
export interface HtmlDocumentLink extends HtmlSubresourceLink_base {
    readonly subresourceType: "document";
    readonly from: AttributeAnchor<FrameElement, "src"> & { resource?: DomResource };
    resource?: DomResource;
}

/**
 * A {@link Link} defined in an HTML document, that links to an `embed` subresource.
 *
 * @category Links
 */
export interface HtmlEmbedLink extends HtmlSubresourceLink_base {
    readonly subresourceType: "embed";
    readonly from: AttributeAnchor<HTMLEmbedElement, "embed">;
}

/**
 * A {@link Link} defined in an HTML document, that links to a `font` subresource.
 *
 * @category Links
 */
export interface HtmlFontLink extends HtmlSubresourceLink_base {
    readonly subresourceType: "font";
    readonly from: TextContentAnchor<HTMLStyleElement>;
}

/**
 * A {@link Link} defined in an HTML document, that links to an `image` subresource.
 *
 * @category Links
 */
export interface HtmlImageLink extends HtmlSubresourceLink_base {
    readonly subresourceType: "image";
    readonly from:
        | AttributeAnchor<HTMLBodyElement, "background">
        | AttributeAnchor<HTMLLinkElement, "href">
        | AttributeAnchor<HTMLImageElement | HTMLInputElement, "src">
        | AttributeAnchor<HTMLVideoElement, "poster">
        | AttributeAnchor<HTMLImageElement | HTMLSourceElement, "srcset">
        | TextContentAnchor<HTMLStyleElement>
        | AttributeAnchor<HTMLElement, "style">
        ;
}

/**
 * A {@link Link} defined in an HTML document, that links to an `object` subresource.
 *
 * Such a link is created by a `<object>` element’s `data` attribute (in HTML 4).
 *
 * @category Links
 */
export interface HtmlObjectLink extends HtmlSubresourceLink_base {
    readonly subresourceType: "object";
    readonly from: AttributeAnchor<HTMLObjectElement, "data">;
}

/**
 * A {@link Link} defined in an HTML document, that links to a `script` subresource.
 *
 * Such a link is created by a `<script>` element’s `src` attribute.
 *
 * @category Links
 */
export interface HtmlScriptLink extends HtmlSubresourceLink_base {
    readonly subresourceType: "script";
    readonly from: AttributeAnchor<HTMLScriptElement, "src">;
}

/**
 * A {@link Link} defined in an HTML document, that links to a `style` subresource.
 *
 * Such a link is created by a `<link rel="stylesheet">` element’s `href` attribute, or by an
 * `@import` at-rule inside a `<style>` element’s CSS content.
 *
 * @category Links
 */
export interface HtmlStyleLink extends HtmlSubresourceLink_base {
    readonly subresourceType: "style";
    readonly from:
        | AttributeAnchor<HTMLLinkElement, "href">
        | TextContentAnchor<HTMLStyleElement>
        ;
}

/**
 * A {@link Link} defined in an HTML document, that links to a `track` subresource.
 *
 * Such a link is created by a `<track>` element’s `src` attribute.
 *
 * @category Links
 */
export interface HtmlTrackLink extends HtmlSubresourceLink_base {
    readonly subresourceType: "track";
    readonly from: AttributeAnchor<HTMLTrackElement, "src">;
}

/**
 * A {@link Link} defined in an HTML document, that links to a `video` subresource.
 *
 * Such a link is created by a `<video>` or `<source>` element’s `src` attribute.
 *
 * @category Links
 */
export interface HtmlVideoLink extends HtmlSubresourceLink_base {
    readonly subresourceType: "video";
    readonly from:
        | AttributeAnchor<HTMLSourceElement, "src">
        | AttributeAnchor<HTMLVideoElement, "src">
        ;
}

/**
 * A {@link Link} defined in an HTML document by some element’s attribute.
 *
 * Most links are defined this way, except those inside the text content of a `<style>` element.
 *
 * @category Links
 */
export type HtmlAttributeDefinedLink = HtmlLink & { from: AttributeAnchor<Element, string> }

/**
 * A {@link Link} defined in a CSS stylesheet.
 *
 * @category Links
 */
export type CssLink = CssSubresourceLink // (all links in CSS are subresource links)

/**
 * A {@link Link} defined in a CSS stylesheet.
 *
 * This interface is not for direct use, but is extended by all subtypes of {@link CssLink}.
 *
 * @category Links
 */
interface CssLink_base extends Link_base {
    readonly from: CssAnchor;
}

/**
 * A {@link Link} defined in a CSS stylesheet, that links to a subresource.
 *
 * Note that all links in stylesheets are subresource links.
 *
 * @category Links
 */
export type CssSubresourceLink = CssFontLink | CssImageLink | CssStyleLink

/**
 * A {@link Link} defined in a CSS stylesheet, that links to a subresource.
 *
 * Note that all links in stylesheets are subresource links.
 *
 * This interface is not for direct use, but is extended by all subtypes of {@link CssSubresourceLink}.
 *
 * @category Links
 */
type CssSubresourceLink_base = CssLink_base & SubresourceLink

/**
 * A {@link Link} defined in a CSS stylesheet, that links to a `font` subresource.
 *
 * Such a link is created by a `@font-face` at-rule’s `src` value.
 *
 * @category Links
 */
export interface CssFontLink extends CssSubresourceLink_base {
    readonly subresourceType: "font";
}

/**
 * A {@link Link} defined in a CSS stylesheet, that links to a `image` subresource.
 *
 * @category Links
 */
export interface CssImageLink extends CssSubresourceLink_base {
    readonly subresourceType: "image";
}

/**
 * A {@link Link} defined in a CSS stylesheet, that links to a `style` subresource.
 *
 * Such a link is created by an `@import` at-rule.
 *
 * @category Links
 */
export interface CssStyleLink extends CssSubresourceLink_base {
    readonly subresourceType: "style";
}
