import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * Prefer Railway/OS process.env over .env files so production builds
 * never overwrite VITE_BackendUrl with an empty loadEnv() result.
 */
function pickEnv(fileEnv: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const fromProcess = String(process.env[key] || "").trim();
    if (fromProcess) return fromProcess;
    const fromFile = String(fileEnv[key] || "").trim();
    if (fromFile) return fromFile;
  }
  return "";
}

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), "");
  const backendUrl = pickEnv(
    fileEnv,
    "VITE_BackendUrl",
    "VITE_BACKEND_URL",
    "BackendUrl",
    "BACKEND_URL"
  ).replace(/\/+$/, "");

  const legacyApi = pickEnv(fileEnv, "VITE_API_URL");
  const apiUrl =
    legacyApi.replace(/\/+$/, "") ||
    (backendUrl ? `${backendUrl}/admin/v1` : "");

  // Never bake localhost image base into a Railway build when BackendUrl is set
  let imagesBase = pickEnv(fileEnv, "VITE_IMAGES_BASE_URL", "VITE_API_BASE_URL");
  if (
    backendUrl &&
    (!imagesBase ||
      /localhost|127\.0\.0\.1/i.test(imagesBase))
  ) {
    imagesBase = backendUrl;
  }
  if (!imagesBase) imagesBase = backendUrl;

  const define: Record<string, string> = {};
  if (backendUrl) {
    define["import.meta.env.VITE_BackendUrl"] = JSON.stringify(backendUrl);
    define["import.meta.env.BackendUrl"] = JSON.stringify(backendUrl);
  }
  if (apiUrl) {
    define["import.meta.env.VITE_API_URL"] = JSON.stringify(
      apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`
    );
  }
  if (imagesBase) {
    define["import.meta.env.VITE_IMAGES_BASE_URL"] = JSON.stringify(
      imagesBase.replace(/\/+$/, "")
    );
  }

  console.log("[vite] BackendUrl=", backendUrl || "(missing)");
  console.log("[vite] API_URL=", apiUrl || "(missing)");

  if (
    (process.env.RAILWAY_ENVIRONMENT || process.env.CI) &&
    !backendUrl &&
    !legacyApi
  ) {
    throw new Error(
      "[vite] VITE_BackendUrl is required for Railway/CI builds. " +
        "Set VITE_BackendUrl=https://your-backend.up.railway.app (origin only) on the admin service."
    );
  }

  return {
    server: {
      host: "::",
      port: 8080,
      allowedHosts: true,
      watch: {
        ignored: [
          "**/node_modules/**",
          "!**/node_modules/@ui/**",
          "!**/apps/schema/**",
        ],
        usePolling: false,
        interval: 100,
      },
      hmr: {
        overlay: true,
        clientPort: 8080,
      },
      fs: {
        allow: [".."],
        strict: false,
      },
    },
    preview: {
      host: "::",
      port: 8080,
      allowedHosts: true,
    },
    build: {
      target: "es2020",
      outDir: "dist",
      chunkSizeWarningLimit: 2000,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(
      Boolean
    ),
    define,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@schema/core": path.resolve(__dirname, "../schema/src"),
        "@shared/siteSectionOrder": path.resolve(
          __dirname,
          "../../backend/additional/siteSectionOrder.mjs"
        ),
        react: path.resolve(__dirname, "./node_modules/react"),
        "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      },
      dedupe: ["react", "react-dom"],
      preserveSymlinks: false,
    },
    optimizeDeps: {
      exclude: [],
      esbuildOptions: {},
    },
    clearScreen: false,
  };
});
