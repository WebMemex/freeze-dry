const markdownIt = require('markdown-it')
const markdownItAnchor = require('markdown-it-anchor')
const pluginTOC = require('eleventy-plugin-toc')

module.exports = eleventyConfig => {
  eleventyConfig.setLibrary(
    'md',
    // @ts-ignore
    markdownIt().use(markdownItAnchor, {
      // why aren’t slugs standardised…
      slugify: s => s.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g,''),
    })
  )
  eleventyConfig.addPlugin(pluginTOC, {
    tags: ['h2', 'h3'],
    wrapper: 'div',
    ul: true,
  })
  return {
    dir: {
      input: "docs",
      output: "_site",
    },
    templateFormats: ['html', 'md', 'css'],
  }
}
