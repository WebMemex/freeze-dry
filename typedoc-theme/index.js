// Use ts-node to use our typedoc theme without having to transpile and package it first.
require('ts-node').register({
  transpileOnly: true,
  scope: true,
  scopeDir: '.',
  compilerOptions: {
    // Options needed for Typedoc’s JSX custom implementation.
    // See <https://github.com/TypeStrong/typedoc/blob/dd15e08a6b3ee5b23227ff37716c506af8b2d126/src/lib/utils/jsx.ts>
    jsx: 'react',
    jsxFactory: 'JSX.createElement',
    jsxFragmentFactory: 'JSX.Fragment',
  },
})

module.exports = require('./mytheme')
