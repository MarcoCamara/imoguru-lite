import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Configuração para produção no EasyPanel / Hostinger
export default defineConfig(({ mode }) => ({
  // Base absoluta — evita 404 em rotas React Router
  base: "/",

  // Configurações do servidor de desenvolvimento (npm run dev)
  server: {
    host: "0.0.0.0", // necessário para acesso externo
    port: 80,         // o EasyPanel exige que o container escute na 80
    strictPort: true,
    cors: true,
    // 🔁 Proxy opcional: permite chamadas diretas ao backend local (dev only)
    proxy: {
      "/api": {
        target: "http://localhost:8080", // backend local ou container
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Plugins
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  // Resolução de aliases (import "@/components/...")
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Configuração de build para produção
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

  // Preview (npm run preview / produção)
  preview: {
    host: "0.0.0.0",
    port: 80,
  },
}));
