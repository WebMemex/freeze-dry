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
  fetchResource?: (Resource) => Promise<Response>;
  resolveURL?: (Resource) => Promise<string>;
}
*/

const fetchSubresource = async (resource/*:Resource*/) => {
  return await self.fetch(resource.url, {
    cache: 'force-cache',
    redirect: 'follow',
  })
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

const archive = async (doc=window.document, {
  timeout = Infinity,
  docUrl = doc.URL,
  addMetadata = true,
  keepOriginalAttributes = true,
  getDocInFrame = getFrameDocument,
  fetchResource = fetchSubresource,
  resolveURL = resourceToDataURL,
  now = new Date(),
}/*:Options*/ = {}) => {
  const io = {
    fetch: fetchResource,
    resolveURL: resolveURL,
    getDocument: getDocInFrame
  }
  const resource = archiver(io, doc, docUrl)
  const metadata = addMetadata ? {time:now} : null
  const html = await resource.text({ metadata })
  return html
}