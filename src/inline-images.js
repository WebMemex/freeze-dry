import whenAllSettled from 'when-all-settled'
import { inlineUrlsInAttributes } from './common'

/**
* Get the URLs from the srcset attribute
* 
* @param {string} srcsetValue - value of the srcset attribute
* @returns {Array} URLs - array of URLs 
*/
export function getUrlsFromSrcset(srcsetValue) {
    // srcset example: srcset="http://image 2x, http://other-image 1.5x"
    const URLs = srcsetValue.split(',').map(srcsetItem =>
        srcsetItem.trim().split(/\s+/)[0]
    )
    return URLs
}

const attributesToInline = [
    {
        elements: 'img',
        attributes: 'src',
        fixIntegrity: true,
    },
    {
        elements: 'img',
        attributes: 'srcset',
        attrToUrls: getUrlsFromSrcset,
    },
    {
        elements: 'link[rel~=icon]',
        attributes: 'href',
        fixIntegrity: true,
    },
]

/**
* Convert the images into a data URL that can be viewed locally
* 
* @param {HTMLElement} rootElement - root document for the function
* @param {string} docUrl - document url of the page
*/
export default async function inlineImages({rootElement, docUrl}) {
    const jobs = attributesToInline.map(options =>
        inlineUrlsInAttributes({...options, rootElement, docUrl})
    )
    await whenAllSettled(jobs)
}
