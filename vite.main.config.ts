import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: '.vite/build',
    lib: {
      entry: resolve(__dirname, 'src/main/index.ts'),
      formats: ['cjs'],
      fileName: () => 'main.js',
    },
    rollupOptions: {
      external: ['electron', 'better-sqlite3'],
      output: {
        entryFileNames: 'main.js',
      },
    },
    target: 'node18',
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
});
