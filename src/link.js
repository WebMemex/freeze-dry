// @flow strict

/*::
interface ResourceLink {
  target:string;
  +absoluteTarget:string;
  +isSubresource:true;
}

export type From <element:Node, attribute> = {
  +attribute: attribute;
  +element: element;
  +rangeWithinTextContent: [number, number];
}

export interface StyleLink extends ResourceLink  {
  +subresourceType: "style";
  +from: From<HTMLElement, ?"style">;
}

export interface ImageLink extends ResourceLink  {
  +subresourceType: "image";
  +from: From<HTMLElement, string>;
}

export interface ObjectLink extends ResourceLink {
  +subresourceType: "object";
  +from: From<HTMLElement, string>;
}

export interface DocumentLink extends ResourceLink {
  +subresourceType: "document";
  +from: From<HTMLIFrameElement, "src">;
}

export interface ScriptLink extends ResourceLink {
  +subresourceType: "script";
  +from: From<HTMLScriptElement, "src">;
}

export interface AudioLink extends ResourceLink {
  +subresourceType: "audio";
  +from: From<HTMLSourceElement, "src">;
}

export interface VideoLink extends ResourceLink {
  +subresourceType: "video";
  +from: From<HTMLSourceElement, "src">;
}

export interface EmbedLink extends ResourceLink {
  +subresourceType: "embed";
  +from: From<HTMLEmbedElement, "embed">;
}

export interface TrackLink extends ResourceLink {
  +subresourceType: "track";
  +from: From<HTMLTrackElement, "src">;
}

export interface FontLink extends ResourceLink {
  +subresourceType: "font";
  +from: From<HTMLElement, string>;
}

export interface TopLink {
  target:string;
  +absoluteTarget:string;
  +subresourceType:"top";
  +source: Document;
  +from:null;
}

export type Link =
  | StyleLink
  | ImageLink
  | ObjectLink
  | DocumentLink
  | ScriptLink
  | VideoLink
  | AudioLink
  | FontLink
  | EmbedLink
  | TrackLink
  | TopLink
*/