/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BackendUrl?: string;
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_IMAGES_BASE_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_UPLOAD_URL?: string;
  readonly VITE_API_KEY?: string;
  readonly VITE_ENVIRONMENT?: string;
  readonly VITE_SITENEXTJS_PREVIEW_URL?: string;
  readonly VITE_WEBSITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
