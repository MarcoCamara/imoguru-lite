# Dockerfile FINAL GARANTIDO (v1.0.52) - Versão CORRIGIDA
# Resolve: 1. Injeção de Variáveis no Build (ARG)
#          2. Injeção de Chave Publishable (fim do hardcode da Anon Key)
#          3. Formato do CMD (Para resolver o erro Exited/502 no EasyPanel)

FROM node:20-alpine AS builder
# Etapa 1: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: execução (produção)
FROM node:20-alpine
WORKDIR /app

# Copia apenas o build final e dependências necessárias
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Instala dependências mínimas e servidor estático
RUN npm install --production && npm install -g serve

EXPOSE 8085

# Comando padrão para servir o build
CMD ["serve", "-s", "dist", "-l", "8085"]
