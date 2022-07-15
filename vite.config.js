import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  publicDir: command == 'serve' ? 'test/example-website' : false,
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'freezeDry',
    },
    rollupOptions: {
      output: {
        exports: 'named', // avoids warning about mix of default & named exports.
      },
    },
  },
}))
