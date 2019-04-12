// @flow strict

import archiver from "./archiver.js"
import { blobToDataURL } from './package.js'

/*::
import type { Link, From, Resource } from "./archiver.js"
export type Options = {
  timeout?:number;
  docUrl?:string;
  addMetadata?:boolean;
  keepOriginalAttributes?:boolean;
  now?:Date;

  getDocInFrame?: (HTMLIFrameElement) => ?Document;
  fetch?: (Resource) => Promise<Response>;
  fetchResource?:Fetch;
  resolveURL?: (Resource) => Promise<string>;
}

type Fetch = (input:RequestInfo, init?:RequestOptions) =>
  Promise<{url:string, blob:Promise<Blob>}|Response>
*/

const fetcher = (fetchWith/*:Fetch*/) => async (resource/*:Resource*/)/*:Promise<Response>*/ => {
  const response = await fetchWith(resource.url, {
    cache: 'force-cache',
    redirect: 'follow',
  })

  return response instanceof Response
    ? response
    : toResponse(response)
}

const toResponse = async (resource) => {
  const blob = typeof resource.blob === 'function'
    ? await resource.blob()
    : await resource.blob
  const response = new Response(blob)
  Object.defineProperty(response, "url", {value:resource.url})
  return response
}

const resourceToDataURL = async (resource/*:Resource*/) => {
  const blob = await resource.blob()
  return await blobToDataURL(blob)
}

const getFrameDocument = (iframe/*:HTMLIFrameElement*/)/*:?Document*/ => {
  try {
    return iframe.contentDocument
  } catch (_) {
    return null
  }
}

export const archive = async (doc/*:Document*/=window.document, {
  timeout = Infinity,
  docUrl = doc.URL,
  addMetadata = true,
  keepOriginalAttributes = true,
  getDocInFrame = getFrameDocument,
  fetchResource = self.fetch,
  fetch,
  resolveURL = resourceToDataURL,
  now = new Date(),
}/*:Options*/ = {}) => {
  const io = {
    fetch: fetch ? fetch : fetcher(fetchResource),
    resolveURL: resolveURL,
    getDocument: getDocInFrame
  }
  const resource = archiver(io, doc, {
    url: docUrl,
    keepOriginalAttributes,
    contentSecurityPolicy: "",
    metadata: addMetadata ? {time:now} : null
  })
  const html = await resource.text()
  return html
}
