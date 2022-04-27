const path = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    outDir: "vite-bundles",
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'freezeDry',
      formats: ['es', 'umd', 'cjs'],
      fileName: (format) => `freeze-dry.${format}.js`
    },
  }
})
