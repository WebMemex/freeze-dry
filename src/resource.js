// @flow strict

import { extractLinksFromDom, extractLinksFromCss } from './extract-links/index.js'
import { documentOuterHTML, pathForDomNode, domNodeAtPath, postcss } from './package.js'
import makeDomStatic from './make-dom-static/index.js';
import setMementoTags from './set-memento-tags.js'
import setContentSecurityPolicy from './set-content-security-policy/index.js'

/*::
import type { Link, DocumentLink, TopLink, StyleLink } from "./link.js"

export interface IO {
  fetch(string):Promise<Response>;
  resolveURL(Resource):Promise<string>;
  getDocument(HTMLIFrameElement):?Document;
}


export type ArchiveOptions = {
  url:string;
  contentSecurityPolicy:string;
  metadata?:?{time:Date};
  keepOriginalAttributes?:boolean;
}

type Parent = {
  +options:ArchiveOptions;
  +io:IO;
}

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

export class Resource {
  /*::
  +io:IO
  +options:ArchiveOptions

  +link:Link
  +parent:Parent
  sourceURL:string;
  linkedResources:?Promise<Iterable<Resource>>;

  sourceResponse:?Promise<Response>
  sourceText:?Promise<string>
  sourceBlob:?Promise<Blob>
  */
  constructor(parent/*:Parent*/, link/*:Link*/) {
    const { io, options } = parent
    this.io = io
    this.parent = parent
    this.options = options
    this.link = link
    this.sourceURL = this.link.absoluteTarget
  }
  static makeLinkAbsolute(link/*:Link*/, {url}/*:Resource*/)/*:Link*/ {
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

  // URL for this resource
  get url()/*:string*/ {
    return this.link.absoluteTarget
  }
  // Resource type
  get resourceType()/*:string*/ {
    return this.link.subresourceType || "unknown"
  }

  // Links to subresources. Default resource has none subclasses can override
  // to extract links from the resource content.
  async links()/*:Promise<Link[]>*/ {
    return []
  }
  // Immediate subresources represented as `Resource` instances.
  // This just calls static function with a same name and caches result for
  // subsequent calls.
  resources()/*:Promise<Iterable<Resource>>*/ {
    const {linkedResources} = this
    if (linkedResources) {
      return linkedResources
    } else {
      const linkedResources = Resource.resources(this)
      this.linkedResources = linkedResources
      return linkedResources
    }
  }
  static async resources(resource/*:Resource*/)/*:Promise<Iterable<Resource>>*/ {
    const links = await resource.links()
    return Resource.resourceIterator(resource, links)
  }
  // Function just turns subresource links into resource instances.
  static * resourceIterator(resource/*:Resource*/, links/*:Link[]*/)/*:Iterable<Resource>*/ {
    for (const link of links) {
      switch (link.subresourceType) {
        case "image":
        case "audio":
        case "video":
        case "font": {
          yield new Resource(resource, link)
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


  text() {
    return this.downloadText()
  }
  blob() {
    return this.downloadBlob()
  }

  // Downloads content for this resource. Function also caches result so that
  // subsequent calls can avoid IO. Actual implementation implementation is
  // in the static function.
  download()/*:Promise<Response>*/ {
    const { sourceResponse } = this
    if (sourceResponse) {
      return sourceResponse
    } else {
      const sourceResponse = Resource.download(this)
      this.sourceResponse = sourceResponse
      return sourceResponse
    }
  }
  static async download(resource/*:Resource*/)/*:Promise<Response>*/ {
    const response = await resource.io.fetch(resource.url)
    return response
  }

  // Same as download except returns string for the downloaded content.
  downloadText()/*:Promise<string>*/ {
    const { sourceText } = this
    if (sourceText) {
      return sourceText
    } else {
      const sourceText = Resource.downloadText(this)
      this.sourceText = sourceText
      return sourceText
    }
  }
  static async downloadText(resource/*:Resource*/)/*:Promise<string>*/ {
    const response = await resource.download()
    return await response.text()
  }


  // Same as download except reutrns blob for the downloaded content.
  static async downloadBlob(resource/*:Resource*/)/*:Promise<Blob>*/ {
    const response = await resource.download()
    const blob = await response.blob()
    return blob
  }
  downloadBlob()/*:Promise<Blob>*/ {
    const { sourceBlob } = this
    if (sourceBlob) {
      return sourceBlob
    } else {
      const sourceBlob = Resource.downloadBlob(this)
      this.sourceBlob = sourceBlob
      return sourceBlob
    }
  }

  // Returns freeze-dryed string representation of this resource. For leaf
  // sub-resource (like this implementation) it's just a correspondting content.
  // Non leaf resources will override this with logic with one that replaces
  // sub-resource links and then serializes it.
  text() {
    return this.downloadText()
  }
  // Same as `text()` above except returns `Blob`.
  blob() {
    return this.downloadBlob()
  }

  // This is MUTABLE operation. It is invoked by a parent resource to swap the
  // URL of the subresource with a replacement.
  // CAUTION: This also mutates corresponding dom elements.
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



export class DocumentResource extends Resource {
  /*::
  +options:ArchiveOptions;
  +link:DocumentLink|TopLink;
  +sourceDocument:?Document;
  +parent:DocumentResource;
  document:?Document;
  documentLinks:?Promise<Link[]>
  documentResources:?Promise<Iterable<Resource>>
  */
  get isRoot() {
    return this.link.subresourceType === "top"
  }
  get resourceType()/*:string*/ {
    return "document"
  }
  get sourceDocument()/*:?Document*/ {
    const { link, parent } = this
    if (link.subresourceType === "document") {
      const { element } = link.from
      const document = parent.sourceDocument
      const frame = document && DocumentResource.getFrame(element, document)
      const sourceDocument = frame && this.io.getDocument(frame)
      return sourceDocument
    } else {
      return link.source
    }
  }
  static getFrame(frame/*:HTMLIFrameElement*/, document/*:Document*/)/*:?HTMLIFrameElement*/ {
    return domNodeAtPath(pathForDomNode(frame, frame.ownerDocument), document)
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
  static async links(resource/*:DocumentResource*/)/*:Promise<Link[]>*/ {
    const document = await resource.captureDocument()
    return extractLinksFromDom(document, {docUrl:resource.url}).map(link => Resource.makeLinkAbsolute(link, resource))
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
  static * documentResourceIterator(resource/*:DocumentResource*/, links/*:Link[]*/)/*:Iterable<Resource>*/ {
    for (const link of links) {
      if (link.isSubresource) {
        switch (link.subresourceType) {
          case "image": 
          case "audio":
          case "video":
          case "font": {
            yield new Resource(resource, link)
            break
          }
          case "document": {
            yield new DocumentResource(resource, link)
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
    }
    const document = await this.captureDocument()
    makeDomStatic(document)
    // TODO: Consult @treora if it was intended to add CSP & momento data only
    // on the top document. Implementation used to generate data URLs for all
    // resources so it was not that useful there, however if resources are saved
    // in separate files it might make sense to add metadata everywhere.
    // At the moment we just do it on the top document to match assumbtions in
    // tests.
    if (this.isRoot) {
      this.setMetadata(document, this.options)
    }
    return documentOuterHTML(document)
  }
  async blob() {
    const text = await this.text()
    return new Blob([text], {type:"text/html"})
  }
  setMetadata(document/*:Document*/, options/*:ArchiveOptions*/) {
    const { metadata, contentSecurityPolicy } = options

    if (metadata) {
      setMementoTags(document, {
        originalUrl: this.url || document.URL,
        datetime: metadata.time
      })
    }
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


export class StyleSheetResource extends Resource {
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
      const links = extractLinksFromCss(css, url).map(link => Resource.makeLinkAbsolute(link, resource))
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
  static async downloadStyleSheetText(resource/*:StyleSheetResource*/) {
    const { source, css } = await resource.downloadStyleSheet()
    const sourceText = css
      ? css.toResult().css
      : source
    return source
  }
  async text() {
    const resources = await this.resources()
    for (const resource of resources) {
      const url = await resource.io.resolveURL(resource)
      resource.replaceURL(url)
    }

    const { source, css } = await this.downloadStyleSheet()
    const text = css ? css.toResult().css : source
    return text
  }
  async blob() {
    const text = await this.text()
    return new Blob([text], {type: "text/css"});
  }
}
