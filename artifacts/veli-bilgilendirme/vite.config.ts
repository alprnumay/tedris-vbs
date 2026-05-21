import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  /** Windows’ta `node_modules/.vite` silinirken EPERM (kilit) hatalarını azaltmak için önbellek proje içi ayrı dizinde. */
  cacheDir: path.resolve(import.meta.dirname, ".vite-cache"),
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    /** Yerel frontend → Railway API: tarayıcıda CORS yok, istek aynı origin `/api`. */
    proxy: {
      "/api": {
        target:
          process.env.VITE_API_PROXY_TARGET ||
          "https://workspaceapi-server-production-c211.up.railway.app",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});