// @flow strict

import { extractLinksFromDom, extractLinksFromCss } from './extract-links/index.js'
import { documentOuterHTML, postcss, pathForDomNode, domNodeAtPath } from './package.js'
/*::
import type { Link, From } from "./extract-links/from-dom.js"
export type { Link, From }
export type Resource =
  | DocumentResource
  | DOMParserResource
  | ParsedStyleSheet
  | PlainStyleSheet
  | PlainResource
*/


class ResourceResponse extends Response {
  /*::
  +href:string
  set url(url:string) {}
  */
  constructor(url/*:string*/) {
    super()
    this.href = url
  }
  get url() {
    return this.href
  }
}

class DOMRootResource extends ResourceResponse {
  /*::
  +sourceDocument:Document;
  +document:Document & {contentType?:string}
  +href:string;
  links:Link[];
  outerHTML:string;
  */
  get contentType() {
    return this.document.contentType ||"text/html"
  }
  get links()/*:Link[]*/ {
    const links = extractLinksFromDom(this.document, { docUrl:this.url })
    for (const link of links) {
      if (link.subresourceType === "document") {
        const sourceFrameElement/*:HTMLIFrameElement*/ = domNodeAtPath(
          pathForDomNode(link.from.element, this.document),
          this.sourceDocument
        )
        link.from.sourceElement = sourceFrameElement
      }
    }
    Object.defineProperty(this, "links", { value:links })
    return links
  }
  get outerHTML() {
    const html = documentOuterHTML(this.document)
    Object.defineProperty(this, "outerHTML", {value:html})
    return html
  }
  async text()/*:Promise<string>*/ {
    return this.outerHTML
  }
  async blob() {
    return new Blob([this.outerHTML], { type: this.contentType })
  }
}


export class DOMParserResource extends DOMRootResource {
  /*::
  +source:string;
  document:Document & {contentType?:string}
  */
  constructor(url/*:string*/, source/*:string*/) {
    super(url)
    this.source = source
  }
  get sourceDocument() {
    return document
  }
  get document() {
    const parser = new DOMParser()
    const document = parser.parseFromString(this.source, 'text/html')
    Object.defineProperty(this, "document", {value:document})
    return document
  }
}


export class DocumentResource extends DOMRootResource {
  /*::
  +sourceDocument:Document;
  +document:Document & {contentType?:string};
  links:Link[];
  outerHTML:string;
  */
  constructor(url/*:string*/, document/*:Document*/) {
    super(url)
    this.sourceDocument = document
    this.document = document.cloneNode(/* deep = */ true)
  }
}

export class ParsedStyleSheet extends ResourceResponse {
  /*::
  href:string;
  links:Link[];
  css:any;
  */
  constructor(url/*:string*/, links/*:Link[]*/, css/*:any*/) {
    super(url)
    this.links = links
    this.css = css
  }
  async text()/*:Promise<string>*/ {
    return this.css.toResult().css
  }
  async blob() {
    return new Blob([await this.text()], { type: 'text/css' })
  }
}

export class PlainStyleSheet extends ResourceResponse {
  /*::
  url:string;
  links:Link[];
  css:string;
  */
  constructor(url/*:string*/, links/*:Link[]*/, css/*:string*/) {
    super(url)
    this.links = links
    this.css = css
  }
  async text()/*:Promise<string>*/ {
    return this.css
  }
  async blob() {
    return new Blob([this.css], { type: 'text/css' })
  }
}

export class PlainResource extends ResourceResponse {
  /*::
  url:string;
  links:Link[];
  response:Promise<Response>;
  */
  constructor(url/*:string*/, links/*:Link[]*/, response/*:Promise<Response>*/) {
    super(url)
    this.links = links
    this.response = response
  }
  async text()/*:Promise<string>*/ {
    const response = await this.response
    return await response.text()
  }
  async blob() {
    const response = await this.response
    return await response.blob()
  }
}

export class StyleSheetResource extends ResourceResponse {
  /*::
  url:string;
  links:Link[];
  response:Promise<Response>;
  content:?string;
  source:?string;
  */
  constructor(url/*:string*/, response/*:Promise<Response>*/) {
    super(url)
    this.response = response
  }
  get contentType() {
    return "text/css"
  }
  async sourceText() {
    const {source} = this
    if (source != null) {
      return source
    } else {
      const response = await this.response
      const source = await response.text()
      this.source = source
      return source
    }
  }
  async text()/*:Promise<string>*/ {
    if (this.content != null) {
      return this.content
    } else {
      const source = await this.sourceText()
      try {
        const sheet = postcss.parse(source)
        const links = extractLinksFromCss(sheet, this.url)
        const text = sheet.toResult().css
        this.content = text
        return text
      } catch (err) {
        this.content = source
        return source
      }
    }
  }
  async blob() {
    const text = await this.text()
    return new Blob([text], {type:this.contentType})
  }
}