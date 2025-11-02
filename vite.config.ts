import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // ***********************************************
  // ⚡ AJUSTES PARA DEPLOY NO EASY PANEL / VPS
  // Base deve ser absoluta para evitar 404 em roteamento React
  base: mode === "production" ? "/" : "/",

  server: {
    // O EasyPanel precisa que o Vite ouça em 0.0.0.0 (não apenas localhost)
    host: "0.0.0.0",
    port: 80, // Agora alinhado ao Dockerfile (porta esperada pelo proxy)
  },

  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    outDir: "dist",
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },

  css: {
    postcss: "./postcss.config.js",
  },
}));

