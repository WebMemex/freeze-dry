import { UrlString, FrameElement } from '../types/util'

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
    element: Element;
}

export interface AttributeAnchor<E extends HTMLElement, A extends string> extends Anchor {
    element: E;
    attribute: A;
    // Range is kept optional while it is not yet implemented for the 'style' attribute
    rangeWithinAttribute?: [number, number];
}

export interface TextContentAnchor<E extends HTMLElement> extends Anchor {
    element: E;
    rangeWithinTextContent?: [number, number]; // optional because not yet implemented
}


export interface SubresourceLink extends Link {
    readonly isSubresource: true;

    // Indicates the type of resource (`image`, `style`, ...). This corresponds to what is now
    // called the 'destination' in the WHATWG fetch spec. See <https://fetch.spec.whatwg.org/#concept-request-destination>
    readonly subresourceType?: string;
}

export interface AudioLink extends SubresourceLink {
    readonly subresourceType: "audio";
    readonly from: AttributeAnchor<HTMLSourceElement, "src">;
}

export interface DocumentLink extends SubresourceLink {
    readonly subresourceType: "document";
    readonly from: AttributeAnchor<FrameElement, "src">;
}

export interface EmbedLink extends SubresourceLink {
    readonly subresourceType: "embed";
    readonly from: AttributeAnchor<HTMLEmbedElement, "embed">;
}

export interface FontLink extends SubresourceLink {
    readonly subresourceType: "font";
}

export interface ImageLink extends SubresourceLink {
    readonly subresourceType: "image";
}

export interface ObjectLink extends SubresourceLink {
    readonly subresourceType: "object";
    readonly from: AttributeAnchor<HTMLElement, string>;
}

export interface ScriptLink extends SubresourceLink {
    readonly subresourceType: "script";
    readonly from: AttributeAnchor<HTMLScriptElement, "src">;
}

export interface StyleLink extends SubresourceLink {
    readonly subresourceType: "style";
    readonly from: AttributeAnchor<HTMLElement, "style"> | TextContentAnchor<HTMLStyleElement>;
}

export interface TrackLink extends SubresourceLink {
    readonly subresourceType: "track";
    readonly from: AttributeAnchor<HTMLTrackElement, "src">;
}

export interface VideoLink extends SubresourceLink {
    readonly subresourceType: "video";
    readonly from: AttributeAnchor<HTMLSourceElement, "src">;
}
