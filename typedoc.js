module.exports = {
  excludePrivate: true,
  excludeProtected: true,
  excludeExternals: true,
  sort: ['source-order'],
  includeVersion: true,
  entryPoints: ['src'],
  out: '../apidocs',
  githubPages: false,
  hideGenerator: true,
}
