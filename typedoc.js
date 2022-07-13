module.exports = {
  excludePrivate: true,
  excludeProtected: true,
  excludeExternals: true,
  sort: ['source-order'],
  categorizeByGroup: false,
  categoryOrder: ['Main', 'Config', 'Resources', 'Links', 'Util', 'Other'],
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
