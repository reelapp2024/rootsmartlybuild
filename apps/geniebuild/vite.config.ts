import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** Prefer Railway/OS process.env over .env files. */
function pickEnv(fileEnv: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const fromProcess = String(process.env[key] || '').trim();
    if (fromProcess) return fromProcess;
    const fromFile = String(fileEnv[key] || '').trim();
    if (fromFile) return fromFile;
  }
  return '';
}

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, '.', '');
  const backendUrl = pickEnv(
    fileEnv,
    'VITE_BackendUrl',
    'VITE_BACKEND_URL',
    'BackendUrl',
    'BACKEND_URL'
  ).replace(/\/+$/, '');

  const legacyApi = pickEnv(fileEnv, 'VITE_API_URL');
  const apiUrl =
    legacyApi.replace(/\/+$/, '') ||
    (backendUrl ? `${backendUrl}/admin/v1` : '');

  let imagesBase = pickEnv(fileEnv, 'VITE_IMAGES_BASE_URL');
  if (
    backendUrl &&
    (!imagesBase || /localhost|127\.0\.0\.1/i.test(imagesBase))
  ) {
    imagesBase = backendUrl;
  }
  if (!imagesBase) imagesBase = backendUrl;

  const gemini = pickEnv(fileEnv, 'GEMINI_API_KEY');

  const define: Record<string, string> = {
    'process.env.API_KEY': JSON.stringify(gemini),
    'process.env.GEMINI_API_KEY': JSON.stringify(gemini),
  };
  if (backendUrl) {
    define['import.meta.env.VITE_BackendUrl'] = JSON.stringify(backendUrl);
    define['import.meta.env.BackendUrl'] = JSON.stringify(backendUrl);
  }
  if (apiUrl) {
    define['process.env.VITE_API_URL'] = JSON.stringify(apiUrl);
    define['import.meta.env.VITE_API_URL'] = JSON.stringify(apiUrl);
  }
  if (imagesBase) {
    define['import.meta.env.VITE_IMAGES_BASE_URL'] = JSON.stringify(
      imagesBase.replace(/\/+$/, '')
    );
  }

  console.log('[vite:@geniebuild] BackendUrl=', backendUrl || '(missing)');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: true,
      allowedHosts: true,
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: true,
      allowedHosts: true,
    },
    plugins: [react()],
    define,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@ui/blocks': path.resolve(__dirname, './src/ui-blocks/index.tsx'),
        '@schema/core': path.resolve(__dirname, '../schema/src'),
        '@shared/siteSectionOrder': path.resolve(
          __dirname,
          '../../backend/additional/siteSectionOrder.mjs'
        ),
      },
    },
  };
});
