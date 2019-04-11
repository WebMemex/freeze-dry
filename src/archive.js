// @flow strict

import captureDom from './capture-dom.js'
import crawlSubresourcesOfDom from './crawl-subresources.js'
import dryResources from './dry-resources.js'
import createSingleFile from './create-single-file.js'
import { blobToDataURL } from './package.js'

import { whenAllSettled, postcss, documentOuterHTML } from './package.js'

import { extractLinksFromDom, extractLinksFromCss } from './extract-links/index.js'
import { DocumentResource, DOMParserResource, StyleSheetResource, PlainResource } from "./resource.js"

/*::
import type { Link, From, Resource } from "./resource.js"
export interface Bundler<result, state, resource> {
  timeout?:number;
  docUrl?:string;
  addMetadata?:boolean;
  keepOriginalAttributes?:boolean;
  now?:Date;
  getDocInFrame?: (HTMLIFrameElement) => ?Document;

  toURL: (resource) => string;
  request: (url:string) => Promise<resource>;
  fetch: (resource) => Promise<Response>;

  open: () => Promise<state>;
  write: (state, Resource) => Promise<state>;
  close: (state) => Promise<result>
}


type Options = {
  timeout?:number;
  docUrl?:string;
  addMetadata?:boolean;
  keepOriginalAttributes?:boolean;
  now?:Date;
}
*/

export class Archive/*::<r, s, a>*/ {
  /*::
  bundler:Bundler<r, s, a>
  options:Options
  state:s
  getDocInFrame: HTMLIFrameElement => ?Document
  requests:Map<string, Promise<a>>
  resources:Map<string, Promise<Resource>>
  */
  constructor(bundler/*:Bundler<r, s, a>*/, options/*:Options*/) {
    this.options = options
    this.getDocInFrame = bundler.getDocInFrame || Archive.getDocInFrame
    this.requests = new Map()
    this.resources = new Map()
  }
  static getDocInFrame(frame/*:HTMLIFrameElement*/)/*:?Document*/ {
    try {
      return frame.contentDocument
    } catch (_) {
      return null
    }
  }

  static bundle/*::<r, a>*/(
    doc/*:Document*/,
    bundler/*:Bundler<r, s, a>*/,
    options/*:Options*/ = {}
  )/*:Archive<r, s, a>*/ {
    const archive = new Archive(bundler, options)
    archive.bundle(new DocumentResource(options.docUrl || document.URL, document))
    return archive
  }
  async bundle(resource/*:Resource*/) {
    this.state = await this.bundler.open()
    this.crawlDOM(resource)
  }
  async crawlDOM(resource/*:Resource*/) {
    const types = new Set(['image', 'document', 'style', 'video', 'font'])
    for (const link of resource.links) {
      if (!link.isSubresource && !types.has(link.subresourceType)) {
        const resource = await this.crawlSubresource(link)
        this.crawl(resource)
      }
    }
  }
  async crawl(resource/*:Resource*/) {
    for (const link of resource.links) {
      const resource = this.crawlSubresource(link)
      this.resources.set(link.absoluteTarget, resource)
      this.crawl(await resource)
    }
  }
  request(url/*:string*/)/*:Promise<a>*/ {
    const request = this.bundler.request(url)
    this.requests.set(url, request)
    return request
  }
  async download(resource/*:a*/)/*:Promise<[string, Response]>*/ {
    const url = this.bundler.toURL(resource)
    const response = await this.bundler.fetch(resource)
    return [url, response]
  }
  async crawlSubresource(link/*:Link*/)/*:Promise<Resource>*/ {
    switch (link.subresourceType) {
      // Images cannot have subresources (actually, SVGs can! TODO)
      case "image":
        return this.crawlLeafSubresource(link)
      case "document":
        return this.crawlDocument(link)
      case "style": 
        return this.crawlStylesheet(link)
      // Videos cannot have subresources (afaik; maybe they can?)
      case "video":
        return this.crawlLeafSubresource(link)
      // Fonts cannot have subresources (afaik; maybe they can?)
      case "font":
        return this.crawlLeafSubresource(link)
      default:
        throw new Error(`Not sure how to crawl subresource of type ${link.subresourceType}`)
    }
  }
  async archiveResource(resource/*:Resource*/) {
    await this.bundler.write(this.state, resource)
  }
  async crawlLeafSubresource(link/*:Link*/)/*:Promise<Resource>*/ {
    const request = await this.request(link.absoluteTarget)
    const url = this.bundler.toURL(request)
    const response = this.bundler.fetch(request)
    const resource = new PlainResource(url, [], response)
    this.archiveResource(resource)
    return resource
  }
  async crawlDocument(link/*:Link*/)/*:Promise<Resource>*/ {
    const frame/*:any*/ = link.from.sourceElement
    const document = frame && this.getDocInFrame(frame)
    if (document) {
      const request = await this.request(link.absoluteTarget)
      const url = this.bundler.toURL(request)
      return new DocumentResource(url, document)
    } else {
      // Apparently we could not capture the frame's DOM in the initial step. To still do the best
      // we can, we fetch and parse the framed document's html source and work with that.
      const request = await this.request(link.absoluteTarget)
      const [url, response] = await this.download(request)
      const html = await response.text()
      return new DOMParserResource(url, html)
    }
  }
  async crawlStylesheet(link/*:Link*/) {
    const request = await this.request(link.absoluteTarget)
    const url = this.bundler.toURL(request)
    const response = this.bundler.fetch(request)
    return new StyleSheetResource(url, response)
  }

  
  async fetch(url/*:string*/)/*:Promise<Response>*/ {
    const resource = this.resources.get(url)
    if (resource) {
      return resource
    } else {
      return new Response("Not found", { status: 404 })
    }
  }
}



const maxWait = timeout => timeout === Infinity
    ? promise => promise
    : promise => Promise.race([
        promise,
        new Promise(resolve => setTimeout(resolve, timeout)),
    ])

