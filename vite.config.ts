import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __APP_BUILD_SHA__: JSON.stringify(
      process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || "local"
    ),
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __APP_BUILD_BRANCH__: JSON.stringify(
      process.env.VERCEL_GIT_COMMIT_REF || process.env.GIT_BRANCH || "local"
    ),
  },
}));
