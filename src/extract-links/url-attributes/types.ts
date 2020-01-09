import { UrlString } from '../types'

export type SubresourceType = 'audio' | 'audioworklet' | 'document' | 'embed' | 'font' | 'image'
    | 'manifest' | 'object' | 'paintworklet' | 'report' | 'script' | 'serviceworker'
    | 'sharedworker' | 'style' | 'track' | 'video' | 'worker' | 'xslt'

export interface AttributeInfo {
    readonly attribute: string,
    readonly elements: string[];
    readonly parse: Parser;
    readonly isSubresource: boolean;
    readonly subresourceType?: SubresourceType;
    makeAbsolute(
        url: string,
        element: Element,
        baseUrl?: string,
        documentURL?: string
    ): UrlString | undefined;
}

export interface AttributeInfoDict { [key: string]: AttributeInfo }

export interface TokenPointer {
    token: string;
    index: number;
    note?: any;
}

export type Parser = (s: string) => TokenPointer[]
