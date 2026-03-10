import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@builder/core': path.resolve(__dirname, '../src/index.ts'),
      '@ui/blocks': path.resolve(__dirname, '../../ui/src/index.ts'),
      '@ui/utils': path.resolve(__dirname, '../../ui/src/utils'),
      '@ui': path.resolve(__dirname, '../../ui/src'),
    },
  },
  server: {
    port: 3002,
    open: true,
  },
});
