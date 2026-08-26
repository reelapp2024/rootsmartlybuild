import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    watch: {
      // Watch workspace packages for HMR - CRITICAL for auto-reload
      ignored: [
        '**/node_modules/**',
        '!**/node_modules/@ui/**',
        '!**/apps/schema/**'
      ],
      // Use polling for better file system watching (helps with workspace packages)
      usePolling: false,
      // Increase interval for polling if needed
      interval: 100,
    },
    hmr: {
      // Enable HMR for workspace packages
      overlay: true,
      // Force full page reload if HMR fails (better for workspace packages)
      clientPort: 8080,
    },
    // Force reload on workspace package changes
    fs: {
      // Allow serving files from workspace packages
      allow: ['..'],
      strict: false,
    },
  },
  build: {
    // Emit code compatible with React Snap's Chromium
    target: "es2020",
    // Match your postbuild/react-snap source
    outDir: "dist",
    // Raise the warning threshold if you have big chunks
    chunkSizeWarningLimit: 2000,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@schema/core": path.resolve(__dirname, "../schema/src"),
      "@shared/siteSectionOrder": path.resolve(__dirname, "../../backend/additional/siteSectionOrder.mjs"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
    preserveSymlinks: false,
  },
  optimizeDeps: {
    exclude: [],
    esbuildOptions: {},
  },
  // Clear cache on each dev start
  clearScreen: false,
}));
