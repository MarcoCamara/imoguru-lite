# -------------------------------------------------
# ✅ Etapa 1: Build da aplicação React (Vite)
# -------------------------------------------------
FROM node:20-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia arquivos de dependências primeiro (melhor cache)
COPY package*.json ./

# Instala dependências de build
RUN npm install

# Copia todo o restante do código
COPY . .

# Gera o build de produção
RUN npm run build

# -------------------------------------------------
# ✅ Etapa 2: Servidor de Produção
# -------------------------------------------------
FROM node:20-alpine

# Define diretório de trabalho
WORKDIR /app

# Instala servidor estático leve
RUN npm install -g serve

# Copia apenas os arquivos necessários do build
COPY --from=builder /app/dist ./dist

# Define variável de ambiente padrão
ENV NODE_ENV=production

# O EasyPanel escuta por padrão na porta 80
EXPOSE 80

# Healthcheck opcional (detecção de falhas automáticas)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -q --spider http://localhost:80 || exit 1

# Comando final: iniciar o servidor
CMD ["serve", "-s", "dist", "-l", "80"]


