import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: '.vite/build',
    lib: {
      entry: resolve(__dirname, 'src/preload/index.ts'),
      formats: ['cjs'],
      fileName: () => 'preload.js',
    },
    rollupOptions: {
      external: ['electron'],
      output: {
        entryFileNames: 'preload.js',
      },
    },
    target: 'chrome120',
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
});
