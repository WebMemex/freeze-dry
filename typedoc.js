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
  githubPages: false,
  hideGenerator: true,
}
