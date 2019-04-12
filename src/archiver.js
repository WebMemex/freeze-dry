// @flow strict

import { extractLinksFromDom, extractLinksFromCss } from './extract-links/index.js'
import { documentOuterHTML, pathForDomNode, domNodeAtPath, postcss } from './package.js'
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
  text():Promise<string>;
  blob():Promise<Blob>;
}

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

interface TopLink {
  target:string;
  +absoluteTarget:string;
  +subresourceType:"top";
  +from: null;
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

export type ArchiveOptions = {
  url:string;
  contentSecurityPolicy:string;
  metadata?:?{time:Date};
  keepOriginalAttributes?:boolean;
}

type Parent = {
  +options:ArchiveOptions;
  +io:Bundler;
}
*/


class IO {
  /*::
  +io:Bundler
  +options:ArchiveOptions
  sourceResponse:?Promise<Response>
  sourceText:?Promise<string>
  sourceBlob:?Promise<Blob>
  */
  constructor(io/*:Bundler*/, options/*:ArchiveOptions*/) {
    this.io = io
    this.options = options
  }
  static async download(resource/*:IO*/)/*:Promise<Response>*/ {
    const $resource/*:any*/ = resource
    const response = await resource.io.fetch($resource)
    return response
  }
  static async downloadText(resource/*:IO*/)/*:Promise<string>*/ {
    const response = await resource.download()
    return await response.text()
  }
  static async downloadBlob(resource/*:IO*/)/*:Promise<Blob>*/ {
    const response = await resource.download()
    const blob = await response.blob()
    return blob
  }
  download()/*:Promise<Response>*/ {
    const { sourceResponse } = this
    if (sourceResponse) {
      return sourceResponse
    } else {
      const sourceResponse = IO.download(this)
      this.sourceResponse = sourceResponse
      return sourceResponse
    }
  }
  downloadText()/*:Promise<string>*/ {
    const { sourceText } = this
    if (sourceText) {
      return sourceText
    } else {
      const sourceText = IO.downloadText(this)
      this.sourceText = sourceText
      return sourceText
    }
  }
  downloadBlob()/*:Promise<Blob>*/ {
    const { sourceBlob } = this
    if (sourceBlob) {
      return sourceBlob
    } else {
      const sourceBlob = IO.downloadBlob(this)
      this.sourceBlob = sourceBlob
      return sourceBlob
    }
  }
}


const makeLinkAbsolute = (link, {url}) => {
  const { hash } = new URL(link.absoluteTarget)
  const urlWithoutHash = url => url.split('#')[0]
  if (hash && urlWithoutHash(link.absoluteTarget) === urlWithoutHash(url)) {
    // The link points to a fragment inside the resource itself.
    // We make it relative.
    link.target = hash
  } else {
    // The link points outside the resource (or to the resource itself).
    // We make it absolute.
    link.target = link.absoluteTarget
  }
  return link
}

class PlainResource extends IO {
  /*::
  +link:Link
  +parent:Parent
  linkedResources:?Promise<Iterable<Resource>>;
  sourceURL:string;
  */
  constructor(parent/*:Parent*/, link/*:Link*/) {
    const {io, options} = parent
    super(io, options)
    this.parent = parent
    this.link = link
    this.sourceURL = this.link.absoluteTarget
  }
  get url()/*:string*/ {
    return this.link.absoluteTarget
  }
  get resourceType()/*:string*/ {
    return this.link.subresourceType || "unknown"
  }
  async links()/*:Promise<Link[]>*/ {
    return []
  }
  text() {
    return this.downloadText()
  }
  blob() {
    return this.downloadBlob()
  }
  resources()/*:Promise<Iterable<Resource>>*/ {
    const {linkedResources} = this
    if (linkedResources) {
      return linkedResources
    } else {
      const linkedResources = PlainResource.resources(this)
      this.linkedResources = linkedResources
      return linkedResources
    }
  }
  static async resources(resource/*:PlainResource*/)/*:Promise<Iterable<Resource>>*/ {
    const links = await resource.links()
    return PlainResource.resourceIterator(resource, links)
  }
  static * resourceIterator(resource/*:Resource*/, links/*:Link[]*/) {
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
  replaceURL(url/*:string*/) {
    const { link, options: { keepOriginalAttributes } } = this
    const { from } = link
    if (keepOriginalAttributes && from && from.element && from.attribute) {
      const { element, attribute } = from
      const noteAttribute = `data-original-${from.attribute}`
      // Multiple links may be contained in one attribute (e.g. a srcset); we must act
      // only at the first one, therefore we check for existence of the noteAttribute.
      // XXX This also means that if the document already had 'data-original-...' attributes,
      // we leave them as is; this may or may not be desirable (e.g. it helps toward idempotency).
      if (!element.hasAttribute(noteAttribute)) {
        const originalValue = from.element.getAttribute(attribute) || ""
        element.setAttribute(noteAttribute, originalValue)
      }
    }

    // Replace the link target with the data URL. Note that link.target is a setter that will update
    // the resource itself.
    link.target = url

    // Remove integrity attribute, if any. (should only be necessary if the content of the
    // subresource has been modified, but we keep things simple and blunt)
    // TODO should this be done elsewhere? Perhaps the link.target setter?
    if (from && from.element && from.element.hasAttribute('integrity')) {
      from.element.removeAttribute('integrity')
      // (we could also consider modifying or even adding integrity attributes..)
    }
  }
}

class DocumentResource extends PlainResource {
  /*::
  +options:ArchiveOptions;
  +link:DocumentLink|TopLink;
  +sourceDocument:?Document;
  documentLinks:?Promise<Link[]>
  documentResources:?Promise<Iterable<Resource>>
  */
  get resourceType()/*:string*/ {
    return "document"
  }
  captureDocument()/*:Promise<Document>*/ {
    throw Error("captureDocument must be implemented by subclass")
  }
  static async links(resource/*:DocumentResource*/) {
    const document = await resource.captureDocument()
    return extractLinksFromDom(document).map(link => makeLinkAbsolute(link, resource))
  }
  links()/*:Promise<Link[]>*/ {
    const {documentLinks} = this
    if (documentLinks) {
      return documentLinks
    } else {
      const documentLinks = DocumentResource.links(this)
      this.documentLinks = documentLinks
      return documentLinks
    }
  }
  static async documentResources(resource/*:DocumentResource*/) {
    const links = await resource.links()
    return DocumentResource.documentResourceIterator(resource, links)
  }
  static * documentResourceIterator(resource/*:DocumentResource*/, links) {
    for (const link of links) {
      if (link.isSubresource) {
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
  }
  resources()/*:Promise<Iterable<Resource>>*/ {
    const { documentResources } = this
    if (documentResources) {
      return documentResources
    } else {
      const documentResources = DocumentResource.documentResources(this)
      this.documentResources = documentResources
      return documentResources
    }
  }
  async text() {
    const resources = await this.resources()
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
    const document = await this.captureDocument()
    makeDomStatic(document)
    if (this.options.metadata) {
      this.setMetadata(document, this.options.metadata)
    }
    this.setContentSecurityPolicy(document, this.options.contentSecurityPolicy)
    return documentOuterHTML(document)
  }
  async blob() {
    const text = await this.text()
    return new Blob([text], {type:"text/html"})
  }
  setMetadata(document/*:Document*/, metadata) {
    setMementoTags(document, {
      originalUrl: this.url || document.URL,
      datetime: metadata.time
    })
  }
  setContentSecurityPolicy(document/*:Document*/, contentSecurityPolicy/*:string*/) {
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
}

class RootLink {
  /*::
  target:string
  +subresourceType:"top"
  from:null
  */
  constructor(url) {
    this.subresourceType = "top"
    this.target = url
    this.from = null
  }
  get absoluteTarget() {
    return this.target
  }
}

class RootResource extends DocumentResource {
  /*::
  +sourceDocument:Document
  document:?Document
  */
  constructor(parent/*:Parent*/, link/*:TopLink*/, sourceDocument/*:Document*/) {
    super(parent, link)
    this.sourceDocument = sourceDocument
  }
  async captureDocument() {
    const {document} = this
    if (document) {
      return document
    } else {
      const document = this.sourceDocument.cloneNode(true)
      this.document = document
      return document
    }
  }
  get url() {
    return this.link.target
  }
  static new(io/*:Bundler*/, document/*:Document*/, options/*:ArchiveOptions*/)/*:Archiver*/ {
    return new RootResource({io, options}, new RootLink(options.url), document)
  }
  async archive() {
    const resources = await this.resources()
    for (const resource of resources) {

    }
  }
}

class NestedDocumentResource extends DocumentResource {
  /*::
  +link:DocumentLink;
  +parent:DocumentResource;
  document:?Document
  */
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
  get sourceDocument()/*:?Document*/ {
    const { link, parent } = this
    const { element } = link.from
    const document = parent.sourceDocument
    const frame = document && NestedDocumentResource.getFrame(element, document)
    const sourceDocument = frame && NestedDocumentResource.getDocument(frame)
    return sourceDocument
  }
  async captureDocument()/*:Promise<Document>*/ {
    const {document} = this
    if (document) {
      return document
    } else {
      const { sourceDocument } = this
      const document = sourceDocument
        ? sourceDocument.cloneNode(true)
        : new DOMParser().parseFromString(await this.downloadText(), "text/html")
      this.document = document
      return document
    }
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
  styleLinks:?Promise<Link[]>;
  styleSheet:?Promise<StyleSheet>
  */
  constructor(parent/*:Resource*/, link/*:StyleLink*/) {
    super(parent, link)
    this.parent = parent
  }
  downloadStyleSheet()/*:Promise<StyleSheet>*/ {
    const { styleSheet } = this
    if (styleSheet) {
      return styleSheet
    } else {
      const styleSheet = StyleSheetResource.downloadStyleSheet(this)
      this.styleSheet = styleSheet
      return styleSheet
    }
  }
  static async downloadStyleSheet(resource/*:StyleSheetResource*/)/*:Promise<StyleSheet>*/ {
    const response = await resource.download()
    const source = await response.text()
    try {
      const css = postcss.parse(source)
      const url = response.url || resource.link.absoluteTarget
      const links = extractLinksFromCss(css, url)
      return {css, links, source, url}
    } catch(error) {
      return {css:null, links:[], source, url:resource.link.absoluteTarget}
    }
  }
  static async links(resource/*:StyleSheetResource*/) {
    const {links} = await resource.downloadStyleSheet()
    return links
  }
  links()/*:Promise<Link[]>*/ {
    const { styleLinks } = this
    if (styleLinks) {
      return styleLinks
    } else {
      const styleLinks = StyleSheetResource.links(this)
      this.styleLinks = styleLinks
      return styleLinks
    }
  }
  async text()/*:Promise<string>*/ {
    const { source, css } = await this.downloadStyleSheet()
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