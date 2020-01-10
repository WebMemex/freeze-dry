import { FrameElement } from '../types/util'
import { Resource } from '../types/resource' // TODO Remove need for this (recursive) import

// This alias is used to explicitly state which strings are guaranteed/presumed to be absolute URLs.
export type UrlString = string

export interface Link {
    // The link's target URL. This is the exact value as it appears in the document, and may thus be
    // a relative URL. This property can be written to, which will modify the document.
    target: string;

    // The link's target URL as an absolute URL. This takes into account factors like the <base
    // href="..."> tag, so usually you may prefer to use `absoluteTarget` rather than `target`.
    readonly absoluteTarget: UrlString;

    // A boolean indicating whether the resource being linked to is normally considered a
    // subresource of the document. For example, the `src` of an `<img>` tag specifies a subresource
    // because the image is considered *part of* the document, while the `href` of an `<a>` or the
    // `action` of a `<form>` merely *point to* another resource.
    readonly isSubresource: boolean;

    // Information needed to find the link in the DOM or stylesheet, for scenarios where one needs
    // to do more than just reading or modifying the link target.
    readonly from: Anchor;
}


export interface Anchor {
}

export interface AttributeAnchor<E extends Element, A extends string> extends Anchor {
    element: E;
    attribute: A;
    // Range is kept optional while it is not yet implemented for the 'style' attribute (it depends
    // on CssAnchor.range)
    rangeWithinAttribute?: [number, number];
}

export interface TextContentAnchor<E extends Element> extends Anchor {
    element: E;
    // Range is kept optional because not yet implemented (it depends on CssAnchor.range)
    rangeWithinTextContent?: [number, number];
}

export interface CssAnchor extends Anchor {
    // The character position of the URL inside the stylesheet text.
    range?: [number, number]; // optional because not yet implemented
}


export interface HtmlLink extends Link {
    readonly from: AttributeAnchor<any, any> | TextContentAnchor<any>;
}

export interface SubresourceLink extends Link {
    readonly isSubresource: true;

    // Indicates the type of resource (`image`, `style`, ...). This corresponds to what is now
    // called the 'destination' in the WHATWG fetch spec. See <https://fetch.spec.whatwg.org/#concept-request-destination>
    readonly subresourceType?: string;

    // If the subresource is available, it can be assigned to this attribute.
    // TODO Remove this ‘upward’ dependency.
    resource?: Resource;
}

type HtmlSubresourceLink = HtmlLink & SubresourceLink

export interface HtmlAudioLink extends HtmlSubresourceLink {
    readonly subresourceType: "audio";
    readonly from: AttributeAnchor<HTMLSourceElement, "src">;
}

export interface HtmlDocumentLink extends HtmlSubresourceLink {
    readonly subresourceType: "document";
    readonly from: AttributeAnchor<FrameElement, "src">;
}

export interface HtmlEmbedLink extends HtmlSubresourceLink {
    readonly subresourceType: "embed";
    readonly from: AttributeAnchor<HTMLEmbedElement, "embed">;
}

export interface HtmlFontLink extends HtmlSubresourceLink {
    readonly subresourceType: "font";
    readonly from: TextContentAnchor<HTMLStyleElement>;
}

export interface HtmlImageLink extends HtmlSubresourceLink {
    readonly subresourceType: "image";
    readonly from:
        | AttributeAnchor<HTMLBodyElement, "background">
        | AttributeAnchor<HTMLLinkElement, "href">
        | AttributeAnchor<HTMLImageElement | HTMLInputElement, "src">
        | AttributeAnchor<HTMLVideoElement, "poster">
        | AttributeAnchor<HTMLImageElement | HTMLSourceElement, "srcset">
        | TextContentAnchor<HTMLStyleElement>
        ;
}

export interface HtmlObjectLink extends HtmlSubresourceLink {
    readonly subresourceType: "object";
    readonly from: AttributeAnchor<Element, string>;
}

export interface HtmlScriptLink extends HtmlSubresourceLink {
    readonly subresourceType: "script";
    readonly from: AttributeAnchor<HTMLScriptElement, "src">;
}

export interface HtmlStyleLink extends HtmlSubresourceLink {
    readonly subresourceType: "style";
    readonly from:
        | AttributeAnchor<Element, "style">
        | TextContentAnchor<HTMLStyleElement>
        ;
}

export interface HtmlTrackLink extends HtmlSubresourceLink {
    readonly subresourceType: "track";
    readonly from: AttributeAnchor<HTMLTrackElement, "src">;
}

export interface HtmlVideoLink extends HtmlSubresourceLink {
    readonly subresourceType: "video";
    readonly from: AttributeAnchor<HTMLSourceElement, "src">;
}


// For CSS, we can easily enumerate all possible link types.
export type CssLink = CssFontLink | CssImageLink | CssStyleLink

export interface CssLink_base {
    readonly from: CssAnchor;
}

type CssSubresourceLink = CssLink_base & SubresourceLink

export interface CssFontLink extends CssSubresourceLink {
    readonly subresourceType: "font";
}

export interface CssImageLink extends CssSubresourceLink {
    readonly subresourceType: "image";
}

export interface CssStyleLink extends CssSubresourceLink {
    readonly subresourceType: "style";
}
