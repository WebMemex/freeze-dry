import type { UrlString } from '../types'

export type SubresourceType = 'audio' | 'document' | 'embed' | 'font' | 'image' | 'object'
    | 'script' | 'style' | 'track' | 'video'

export interface AttributeInfo {
    readonly attribute: string,
    readonly elements: string[];
    readonly parse: Parser;
    readonly isSubresource: boolean;
    readonly subresourceType?: SubresourceType;
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
