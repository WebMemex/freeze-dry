import whenAllSettled from 'when-all-settled'
import { urlToDataUrl } from './common'


/**
* Finds all url(...) occurrences in a string of CSS, then fetches and inlines
* them as data URLs.
* Returns the processed (and possibly much larger) string of CSS.
* 
* @param {string} stylesheetText - text of a stylesheet
* @param {string} stylesheetUrl - URL of the stylesheet
* @returns {string} stylesheetText - text of stylesheet with data URLs
*/
async function inlineStylesheetContents({stylesheetText, stylesheetUrl}) {
    const cssFindUrlsPattern = /url\s*\(\s*('|")?\s*([^"')]+?)\s*\1\s*\)/ig
    const cssExtractUrlPattern = /url\s*\(\s*('|")?\s*([^"')]+?)\s*\1\s*\)/i
    const cssUrls = stylesheetText.match(cssFindUrlsPattern)
    if (!cssUrls) {
        return stylesheetText
    }
    const urls = cssUrls.map(urlString => {
        const match = urlString.match(cssExtractUrlPattern)
        return match
            ? new URL(match[2], stylesheetUrl)
            : undefined
    })
    const dataUrls = await Promise.all(urls.map(urlToDataUrl))
    dataUrls.forEach((dataUrl, i) => {
        stylesheetText = stylesheetText.replace(cssUrls[i], `url(${dataUrl})`)
    })
    return stylesheetText
}

/**
* In every <link rel="stylesheet"> tag, inline the stylesheet as a data URL,
* and inline every URL within that stylesheet.
* 
* @param {HTMLElement} rootElement - root of the tree of elements to be processed
* @param {string} docUrl - document url of the page
*/
async function inlineLinkedStylesheets({rootElement, docUrl}) {
    const querySelector = 'link[rel*="stylesheet"][href]'
    const linkElements = Array.from(rootElement.querySelectorAll(querySelector))
    const jobs = linkElements.map(async linkEl => {
        const stylesheetUrl = new URL(linkEl.getAttribute('href'), docUrl)
        let stylesheetText
        try {
            // Fetch the stylesheet itself.
            const response = await fetch(stylesheetUrl, {cache: 'force-cache'})
            stylesheetText = await response.text()
            // Fetch and replace URLs inside the stylesheet.
            stylesheetText = await inlineStylesheetContents({
                stylesheetText,
                stylesheetUrl,
            })
        } catch (err) {
            stylesheetText = '/* Oops! Freeze-dry failed to save this stylesheet. */'
        }
        const styleEl = rootElement.ownerDocument.createElement('style')
        styleEl.innerHTML = stylesheetText

        // Type is practically always text/css, the default, but copy it anyway.
        const type = linkEl.getAttribute('type')
        if (type) {
            styleEl.setAttribute('type', type)
        }

        // Replace the <link /> element with the inlined <style>...</style>.
        linkEl.parentNode.replaceChild(styleEl, linkEl)
    })
    await whenAllSettled(jobs)
}

/**
* In every <style>...</style> block, inline any URLs it contains.
* 
* @param {HTMLElement} rootElement - root of the tree of elements to be processed
* @param {string} docUrl - document url of the page
*/
async function inlineStyleTagContents({rootElement, docUrl}) {
    const querySelector = 'style[type="text/css"],style:not([type])'
    const styleElements = Array.from(rootElement.querySelectorAll(querySelector))
    const jobs = styleElements.map(async styleEl => {
        let stylesheetText = styleEl.innerHTML
        stylesheetText = await inlineStylesheetContents({
            stylesheetText,
            stylesheetUrl: docUrl,
        })
        styleEl.innerHTML = stylesheetText
    })
    await whenAllSettled(jobs)
}

/**
* In every <sometag style="..."> inline style, inline any URLs it contains.
* 
* @param {HTMLElement} rootElement - root of the tree of elements to be processed
* @param {string} docUrl - document url of the page
*/
async function inlineInlineStyleContents({rootElement, docUrl}) {
    const querySelector = '*[style]'
    const elements = Array.from(rootElement.querySelectorAll(querySelector))
    const jobs = elements.map(async element => {
        let inlineStyleText = element.getAttribute('style')
        inlineStyleText = await inlineStylesheetContents({
            stylesheetText: inlineStyleText,
            stylesheetUrl: docUrl,
        })
        element.setAttribute('style', inlineStyleText)
    })
    await whenAllSettled(jobs)
}

/*
* Freeze dry all the components of an inline stylesheet
* 
* @param {HTMLElement} rootElement - root of the tree of elements to be processed
* @param {string} docUrl - document url of the page
*/
export default async function inlineStyles({rootElement, docUrl}) {
    const jobs = [
        inlineLinkedStylesheets({rootElement, docUrl}),
        inlineStyleTagContents({rootElement, docUrl}),
        inlineInlineStyleContents({rootElement, docUrl}),
    ]
    await whenAllSettled(jobs)
}
