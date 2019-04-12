// @flow strict

import { extractLinksFromDom, extractLinksFromCss } from './extract-links/index.js'
import { documentOuterHTML, pathForDomNode, domNodeAtPath, postcss } from './package.js'
import { Interface } from 'readline';
import { makeLinksAbsolute } from './dry-resources.js';
import makeDomStatic from './make-dom-static/index.js';
import setMementoTags from './set-memento-tags.js'
import setContentSecurityPolicy from './set-content-security-policy/index.js'

/*::
export type Resource =
  | DocumentResource
  | StyleSheetResource
  | PlainResource


export interface Bundler {
  fetch(Resource):Promise<Response>;
  resolveURL(Resource):Promise<string>;
  getDocument(HTMLIFrameElement):?Document;
}

interface Archiver {
  +url:string;
  text(ArchiveOptions):Promise<string>;
  blob(ArchiveOptions):Promise<Blob>;
}

interface ResourceLink {
  target:string;
  +absoluteTarget:string;
  +isSubresource:true;
}

export type From <element:Element, attribute> = {
  +attribute: attribute;
  +element: element;
  +rangeWithinTextContent: [number, number];
}

interface StyleLink extends ResourceLink  {
  +subresourceType: "style";
  +from: From<HTMLElement, ?"style">;
}

interface ImageLink extends ResourceLink  {
  +subresourceType: "image";
  +from: From<HTMLElement, string>;
}

interface ObjectLink extends ResourceLink {
  +subresourceType: "object";
  +from: From<HTMLElement, string>;
}

interface DocumentLink extends ResourceLink {
  +subresourceType: "document";
  +from: From<HTMLIFrameElement, "src">;
}

interface ScriptLink extends ResourceLink {
  +subresourceType: "script";
  +from: From<HTMLScriptElement, "src">;
}

interface AudioLink extends ResourceLink {
  +subresourceType: "audio";
  +from: From<HTMLSourceElement, "src">;
}

interface VideoLink extends ResourceLink {
  +subresourceType: "video";
  +from: From<HTMLSourceElement, "src">;
}

interface EmbedLink extends ResourceLink {
  +subresourceType: "embed";
  +from: From<HTMLEmbedElement, "embed">;
}

interface TrackLink extends ResourceLink {
  +subresourceType: "track";
  +from: From<HTMLTrackElement, "src">;
}

interface FontLink extends ResourceLink {
  +subresourceType: "font";
  +from: From<HTMLElement, string>;
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

export type ArchiveOptions = {
  contentSecurityPolicy?:true|string;
  metadata?:?{time:Date}
}
*/


class IO {
  /*::
  io:Bundler
  response:Promise<Response>
  sourceText:Promise<string>
  sourceBlob:Promise<Blob>
  */
  constructor(io/*:Bundler*/) {
    this.io = io
  }
  static async fetch(resource) {
    return resource.io.fetch(resource)
  }
  get response() {
    const self/*:any*/ = this
    Object.defineProperty(this, "response", { value: this.io.fetch(self) })
  }
  static async toText(resource) {
    const response = await resource.response
    return await response.text()
  }
  get sourceText() {
    Object.defineProperty(this, "sourceText", { value:IO.toText(this)  })
  }
  static async toBlob(resource) {
    const response = await resource.response
    return await response.blob() 
  }
  get sourceBlob() {
    Object.defineProperty(this, "sourceBlob", { value:IO.toBlob(this)  })
  }
}

class PlainResource extends IO {
  /*::
  +link:Link
  +parent:Resource
  resources:Promise<Iterable<Resource>>;
  */
  constructor(parent/*:Resource*/, link/*:Link*/) {
    super(parent.io)
    this.parent = parent
    this.link = link
  }
  get url()/*:string*/ {
    return this.link.absoluteTarget
  }
  get resourceType() {
    return this.link.subresourceType
  }
  get links() {
    return []
  }
  get resources() {
    return []
  }
  async text() {
    const response = await this.response
    return response.text()
  }
  async blob() {
    const response = await this.response
    return response.blob()
  }
  replaceURL(url) {
    this.link.target = url
  }

  static async resources(resource/*:Resource*/) {
    const links = await resource.links
    return PlainResource.resourceIterator(resource, links)
  }
  get resources()/*:Promise<Iterable<Resource>>*/ {
    const resources = PlainResource.resources(this)
    Object.defineProperty(this, "resources", {value:resources})
    return resources
  }
  static * resourceIterator(resource/*:Resource*/, links) {
    for (const link of links) {
      switch (link.subresourceType) {
        case "image":
        case "audio":
        case "video":
        case "font": {
          yield new PlainResource(resource, link)
          break
        }
        case "style": {
          yield new StyleSheetResource(resource, link)
          break
        }
        default: {
          throw Error(`Resource "${resource.resourceType}" can not link to resource of type "${link.subresourceType}"`)
        }
      }
    }
  }
}

class DocumentResource extends IO {
  /*::
  +sourceDocument:Promise<Document> | Document
  document:Promise<Document>
  links:Promise<Link[]>
  resources:Promise<Iterable<Resource>>
  url:string
  */
  constructor(io/*:Bundler*/) {
    super(io)
  }
  static async document(resource) {
    const document = await resource.sourceDocument
    return document.cloneNode(true)
  }
  get resourceType() {
    return "document"
  }
  get document() {
    const document = DocumentResource.document(this)
    Object.defineProperty(this, "document", {value:document})
    return document
  }
  static async links(resource) {
    const document = await resource.document
    return extractLinksFromDom(document)
  }
  get links() {
    const links = DocumentResource.links(this)
    Object.defineProperty(this, "links", {value:links})
    return links
  }
  static async resources(resource/*:DocumentResource*/) {
    const links = await resource.links
    return DocumentResource.resourceIterator(resource, links)
  }
  static * resourceIterator(resource/*:DocumentResource*/, links) {
    for (const link of links) {
      switch (link.subresourceType) {
        case "image": 
        case "audio":
        case "video":
        case "font": {
          yield new PlainResource(resource, link)
          break
        }
        case "document": {
          yield new NestedDocumentResource(resource, link)
          break
        }
        case "style": {
          yield new StyleSheetResource(resource, link)
          break
        }
        default: {
          throw Error(`Resource "${resource.resourceType}" can not link to resource of type "${link.subresourceType}"`)
        }
      }
    }
  }
  get resources()/*:Promise<Iterable<Resource>>*/ {
    const resources = DocumentResource.resources(this)
    Object.defineProperty(this, "resources", {value:resources})
    return resources
  }

  replaceURL(url) {
    this.url = url
  }
  async text(options/*:ArchiveOptions*/ = {}) {
    const resources = await this.resources
    for (const resource of resources) {
      // We go over each resource which may already be fetched & crawled
      // or it could be a fresh wrapper over the link. It is up to bundler
      // to decide if it can resolve URL without fetchich / crawling
      // resource (e.g generate relative link) or fetch the resource and
      // inline or it's links to eentually turn it into data URL.
      const url = await resource.io.resolveURL(resource)
      resource.replaceURL(url)
      // TODO: Incorporate makeLinksAbsolute logic here.
    }
    const document = await this.document
    makeDomStatic(document)
    if (options.metadata) {
      this.setMetadata(document, options.metadata)
    }
    this.setContentSecurityPolicy(document, options.contentSecurityPolicy)
    return documentOuterHTML(document)
  }
  setMetadata(document, metadata) {
    setMementoTags(document, {
      originalUrl: this.url || document.URL,
      datetime: metadata.time
    })
  }
  setContentSecurityPolicy(document, contentSecurityPolicy) {
    // Set a strict Content Security Policy in a <meta> tag.
    const csp = contentSecurityPolicy || [
      "default-src 'none'", // By default, block all connectivity and scripts.
      "img-src data:", // Allow inlined images.
      "media-src data:", // Allow inlined audio/video.
      "style-src data: 'unsafe-inline'", // Allow inlined styles.
      "font-src data:", // Allow inlined fonts.
      "frame-src data:", // Allow inlined iframes.
    ].join('; ')
    setContentSecurityPolicy(document, csp)
  }
  async blob(options/*:ArchiveOptions*/ = {}) {
    const text = await this.text()
    return new Blob([text], {type:"text/html"})
  } 
}

class RootResource extends DocumentResource {
  static new(io/*:Bundler*/, document/*:Document*/, url/*:string*/=document.URL)/*:Archiver*/ {
    return new RootResource(io, document, url)
  }
  constructor(io/*:Bundler*/, sourceDocument/*:Document*/, url/*:string*/) {
    super(io)
    this.sourceDocument = sourceDocument
    this.url = url
  }
  async archive() {
    const resources = await this.resources
    for (const resource of resources) {

    }
  }
}

class NestedDocumentResource extends DocumentResource {
  /*::
  +link:DocumentLink;
  +parent:DocumentResource;
  sourceDocument:Promise<Document>|Document;
  */
  constructor(parent/*:DocumentResource*/, link/*:DocumentLink*/) {
    super(parent.io)
    this.link = link
    this.parent = parent
  }
  static getDocument(frame/*:HTMLIFrameElement*/)/*:?Document*/ {
    try {
      return frame.contentDocument
    } catch(error) {
      return null
    }
  }
  static getFrame(frame/*:HTMLIFrameElement*/, document/*:Document*/)/*:?HTMLIFrameElement*/ {
    return domNodeAtPath(pathForDomNode(frame, frame.ownerDocument), document)
  }
  static async sourceDocument(resource)/*:Promise<Document>*/ {
    const { link, parent } = resource
    const parentSourceDocument = await parent.sourceDocument
    const frame = link.from.element 
    const sourceFrame = parent.sourceDocument
      ? NestedDocumentResource.getFrame(frame, parentSourceDocument)
      : null
    
    const sourceDocument = sourceFrame
      ? NestedDocumentResource.getDocument(sourceFrame)
      : null

    const document = sourceDocument
      ? sourceDocument
      : new DOMParser().parseFromString(await resource.sourceText, "text/html")

    return document
  }
  get sourceDocument() {
    const document = NestedDocumentResource.sourceDocument(this)
    Object.defineProperty(this, "sourceDocument", { value: document })
    return document
  }
}

/*::
interface PostCSS {
  toResult():{css:string}
}

type StyleSheet = {
  url:string;
  css:?PostCSS;
  links:Link[];
  source:string;
}
*/

class StyleSheetResource extends PlainResource {
  /*::
  +link:StyleLink;
  links:Promise<Link[]>;
  styleSheet:Promise<StyleSheet>
  */
  constructor(parent/*:Resource*/, link/*:StyleLink*/) {
    super(parent, link)
    this.parent = parent
  }
  get styleSheet() {
    const styleSheet = StyleSheetResource.styleSheet(this)
    Object.defineProperty(this, "styleSheet", {value:styleSheet})
    return styleSheet
  }
  static async styleSheet(resource/*:StyleSheetResource*/)/*:Promise<StyleSheet>*/ {
    const response = await resource.response
    const source = await resource.sourceText
    try {
      const css = postcss.parse(source)
      const url = response.url || resource.link.absoluteTarget
      const links = extractLinksFromCss(css, url)
      return {css, links, source, url}
    } catch(error) {
      return {css:null, links:[], source, url:resource.link.absoluteTarget}
    }
  }
  static async links(resource) {
    const { links } = await resource.styleSheet
    return links
  }
  get links() {
    const links = StyleSheetResource.links(this)
    Object.defineProperty(this, "links", {value:links})
    return links
  }
  async text()/*:Promise<string>*/ {
    const { source, css } = await this.styleSheet
    if (css) {
      return css.toResult().css
    } else {
      return source
    }
  }
  async blob()/*:Promise<Blob>*/ {
    const text = await this.text()
    return new Blob([text], {type: "text/css"});
  }
}


export default RootResource.new