import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // ***********************************************
  // ⚡ AJUSTES PARA DEPLOY NO EASY PANEL / VPS
  // Base absoluta para evitar 404 em roteamento React
  base: "/",

  server: {
    // O frontend precisa escutar em 0.0.0.0 (acessível externamente)
    host: "0.0.0.0",
    port: 80, // ✅ porta interna agora igual à exposta (corrigido)
    strictPort: true, // falha se a porta já estiver em uso
    cors: true, // ✅ permite comunicação com backend em outra porta/container
  },

  plugins: [
    react(),
    // ✅ o componentTagger só roda em modo de desenvolvimento
    mode === "development" && componentTagger(),
  ].filter(Boolean),

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

  preview: {
    host: "0.0.0.0",
    port: 80, // ✅ igual ao server.port — evita conflito de proxy
  },
}));
