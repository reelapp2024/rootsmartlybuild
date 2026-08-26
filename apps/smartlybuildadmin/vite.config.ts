import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = (
    env.VITE_BackendUrl ||
    env.VITE_BACKEND_URL ||
    env.BackendUrl ||
    env.BACKEND_URL ||
    ""
  ).replace(/\/+$/, "");
  const apiUrl =
    (env.VITE_API_URL || "").trim() ||
    (backendUrl ? `${backendUrl}/admin/v1` : "");

  return {
    server: {
      host: "::",
      port: 8080,
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
    build: {
      target: "es2020",
      outDir: "dist",
      chunkSizeWarningLimit: 2000,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(
      Boolean
    ),
    define: {
      "import.meta.env.VITE_BackendUrl": JSON.stringify(backendUrl),
      "import.meta.env.BackendUrl": JSON.stringify(backendUrl),
      "import.meta.env.VITE_API_URL": JSON.stringify(
        apiUrl.endsWith("/") ? apiUrl : apiUrl ? `${apiUrl}/` : ""
      ),
      "import.meta.env.VITE_IMAGES_BASE_URL": JSON.stringify(
        env.VITE_IMAGES_BASE_URL || backendUrl
      ),
    },
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
