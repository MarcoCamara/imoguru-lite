# -------------------------------------------------
# ✅ Etapa 1: Build da aplicação React (Vite)
# -------------------------------------------------
FROM node:20-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia arquivos de dependências primeiro (melhor cache)
# -------------------------------------------------
# ✅ Etapa 1: Build da aplicação React (Vite)
# -------------------------------------------------
FROM node:20-alpine AS builder

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia apenas os arquivos de dependência primeiro (melhor cache)
COPY package*.json ./

# Instala dependências (somente as necessárias)
RUN npm ci

# Copia o restante do código da aplicação
COPY . .

# Gera o build de produção do Vite
RUN npm run build


# -------------------------------------------------
# ✅ Etapa 2: Servidor de Produção (com "serve")
# -------------------------------------------------
FROM node:20-alpine

# Define o diretório de trabalho
WORKDIR /app

# Instala o servidor estático leve
RUN npm install -g serve

# Copia o build gerado na etapa anterior
COPY --from=builder /app/dist ./dist

# Define variável de ambiente de produção
ENV NODE_ENV=production

# Porta interna do container (o EasyPanel só aceita 80)
EXPOSE 80

# Healthcheck opcional (o EasyPanel pode reiniciar se falhar)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -q --spider http://localhost:80 || exit 1

# Comando final: inicia o servidor estático
CMD ["serve", "-s", "dist", "-l", "80"]



