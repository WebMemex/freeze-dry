import type { UrlString } from '../types'

/**
 * A string indicating the type of subresource expected by a parent resource, e.g. `'image'` or
 * `'style'`. Note this is not the same as a MIME type.
 *
 * This corresponds to what is now called the ‘destination’ in the [WHATWG fetch spec](https://fetch.spec.whatwg.org/#concept-request-destination).
 */
export type SubresourceType = 'audio' | 'document' | 'embed' | 'font' | 'image' | 'object'
    | 'script' | 'style' | 'track' | 'video'

/**
 * Details on an HTML attribute relevant for extracting links from it.
 */
export interface AttributeInfo {
    /**
     * The name of the attribute.
     * @example src
     */
    readonly attribute: string,
    /**
     * The elements this attribute can appear on, as an array of CSS Selectors.
     * @example ['img', 'input[type=image i]']
     */
    readonly elements: string[];
    /**
     * Parser for the attribute value, returns an array of zero, one, or multiple URLs.
     * Each url is an object `{ token, index }`, to help replacing the url on the right spot.
     * (to e.g. replace the correct 5 in <meta http-equiv="refresh" content="5; url=5">)
     */
    readonly parse: Parser;
    /**
     * Whether the attribute's URL refers to an "external resource"; i.e. something that is to be
     * considered "part of"/"transcluded into" the current document, rather than just referred to.
     * Might be slightly subjective in some cases.
     */
    readonly isSubresource: boolean;
    /**
     * How the subresource is used; corresponds to what is now called the 'destination' in the WHATWG
     * fetch spec (https://fetch.spec.whatwg.org/#concept-request-destination as of 2018-05-17)
     * @example 'image'
     */
    readonly subresourceType?: SubresourceType;
    /**
     * Turn the extracted (possibly) relative URL into an absolute URL.
     * @param url - The (possibly relative) URL.
     * @param element - The element containing the attribute.
     * @param baseUrl - The base URL of the containing document (if it has a `<base>` tag)
     * @param documentURL - The URL of the containing document.
     * @returns A string containing the absolute URL, or undefined if the input is invalid.
     */
    makeAbsolute(
        url: string,
        element: Element,
        baseUrl?: UrlString,
        documentURL?: UrlString,
    ): UrlString | undefined;
}

export type AttributeInfoDict<Key extends string = string> = { [key in Key]: AttributeInfo }

export interface TokenPointer {
    token: string;
    index: number;
    note?: any;
}

export type Parser = (s: string) => TokenPointer[]
