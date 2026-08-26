import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const backendUrl = (
      env.VITE_BackendUrl ||
      env.VITE_BACKEND_URL ||
      env.BackendUrl ||
      env.BACKEND_URL ||
      ''
    ).replace(/\/+$/, '');
    // Derive admin API from BackendUrl; keep legacy VITE_API_URL as override
    const apiUrl =
      (env.VITE_API_URL || '').trim() ||
      (backendUrl ? `${backendUrl}/admin/v1` : '');

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: true,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.VITE_BackendUrl': JSON.stringify(backendUrl),
        'import.meta.env.BackendUrl': JSON.stringify(backendUrl),
        'process.env.VITE_API_URL': JSON.stringify(apiUrl),
        'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
        'import.meta.env.VITE_IMAGES_BASE_URL': JSON.stringify(
          env.VITE_IMAGES_BASE_URL || backendUrl
        ),
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
