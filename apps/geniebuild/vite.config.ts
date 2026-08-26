import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // strictPort: true so Vite fails loudly if 3002 is busy instead of
        // silently picking 3003 — easier to spot port conflicts.
        strictPort: true,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Force the API URL globally for all shared packages
        'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:1111/admin/v1'),
        'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:1111/admin/v1')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@ui/blocks': path.resolve(__dirname, './src/ui-blocks/index.tsx'),
          '@schema/core': path.resolve(__dirname, '../schema/src'),
          '@shared/siteSectionOrder': path.resolve(__dirname, '../../backend/additional/siteSectionOrder.mjs'),
        }
      }
    };
});
