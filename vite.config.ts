import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // ***********************************************
  // ⚡ CORREÇÃO CRÍTICA PARA DEPLOY NO DOCKER/EASYPANEL
  // Usa caminhos absolutos para produção (melhor para VPS)
  base: mode === 'production' ? '/' : './', 
  // ***********************************************

  server: {
    host: "localhost",
    port: 8085,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Otimizações para produção
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
}));
