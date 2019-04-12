// @flow strict

import archiver from "./archiver.js"
import { blobToDataURL } from './package.js'

/*::
import type { Link, From, Resource } from "./archiver.js"


// Optional parameters can be passed to an archive function to customize it
// it's behavior.
export type Options = {
  // Maximum time (in milliseconds) spent on fetching document subresources.
  // Resulting HTML will only have only succesfully fetched subresources
  // inlined.
  timeout?:number;
  // URL to override doc.URL.
  docUrl?:string;
  // Whether to note the snapshotting time and the document's URL in an extra
  // meta and link tag.
  addMetadata?:boolean;
  // Whether to preserve the value of an element attribute if its URLs are
  // inlined, by noting it as a new 'data-original-...' attribute.
  // For example, <img src="bg.png"> would become
  // <img src="data:..." data-original-src="bg.png">.
  // Note this is an unstandardised workaround to keep URLs of subresources
  // available; unfortunately URLs inside stylesheets are still lost.
  keepOriginalAttributes?:boolean;
  // Override the snapshot time (only relevant when addMetadata=true).
  now?:Date;
  // Optional function to customize how to obtain an iframe's contentDocument.
  // Defaults to simply trying to access frame.contentDocument. Should return
  // null if accessing the contentDocument fails. This is useful in cases
  // where more privileged API is availble that can overcome cross-origin
  // boundries.
  getDocInFrame?: (HTMLIFrameElement) => ?Document;
  // Custom function for fetching resources; It should be API-compatible with
  // the global fetch(), but may also return { blob, url } instead of a
  // `Response`.
  // DEPRICATED: I would like to depricate this in favor of `fetch` below.
  fetchResource?:Fetch;

  // Custom function used for turning document subresources into URLs that
  // will be used in place of the original URLs. Function is passed `Resource`
  // instance representing a subresource. It has `url` property corresponding
  // to the resource. Function can either simply return an alternative URL or
  // get `resource.text()` / `resource.body()` and turn that into data URL.
  // Calling those methods would recurse the resource traversal that is:
  // 1. Obtain contents of the resource.
  // 2. Analyzing resource for it's immediate subresources.
  // 3. Swapping subresource URLs with ones returned by `resolveURL` (that can
  //    recurse down the resource tree).
  // 4. Serializing resource (with swapped URLs) to text / blob.
  resolveURL?: (Resource) => Promise<string>;
  // Custom function used for fetching document subresource into `Response`
  // object. This is a replacement for a `fetchResource` option that enables
  // more advanced use cases because as described above `Resource` instance
  // provides methods to automate process of freezing subresources.
  fetch?: (string) => Promise<Response>;
}

type Fetch = (input:RequestInfo, init?:RequestOptions) =>
  Promise<{url:string, blob:Promise<Blob>}|Response>
*/

const fetcher = (fetchWith/*:Fetch*/) => async (url/*:string*/)/*:Promise<Response>*/ => {
  const response = await fetchWith(url, {
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
