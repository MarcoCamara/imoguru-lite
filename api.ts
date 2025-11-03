import axios from "axios";

// Cria uma instância global do Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // 🔗 vem do .env.production
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15s de timeout (opcional, mas recomendado)
});

export default api;
