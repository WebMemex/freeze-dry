module.exports = {
  excludePrivate: true,
  excludeProtected: true,
  excludeExternals: true,
  sort: ['source-order'],
  categorizeByGroup: false,
  categoryOrder: [ // Alas, source-order does not suffice for the categories..
    'Main', 'Config', 'Resources', 'Links', 'Util', // For top-level exports
    'Output options', 'Subresource options', // For FreezeDryConfig
    '*', // Anything categories we forgot.
    'Other', // Other always at the end.
  ],
  includeVersion: true,
  entryPoints: [
    'src/index.ts',
  ],
  out: '../apidocs',
  name: 'Freeze-dry API documentation',
  readme: 'none',
  githubPages: false,
  hideGenerator: true,
  plugin: './typedoc-theme',
  customCss: './typedoc-theme/mytheme.css', // the theme should include this css, but not sure how.
  theme: 'mytheme',
}
