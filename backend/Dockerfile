# -------------------------------------------------
# 🧠 Backend - Node.js (Produção)
# -------------------------------------------------
FROM node:20-alpine

# Define diretório de trabalho dentro do container
WORKDIR /app

# Copia arquivos de dependências primeiro (melhor cache no build)
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm ci --only=production

# Copia o restante do código da aplicação
COPY . .

# Define variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3001
ENV TZ=America/Sao_Paulo

# Expõe a porta interna usada pelo app (mesma configurada no compose)
EXPOSE 3001

# Healthcheck opcional (o compose já usa, mas deixa pronto se rodar isolado)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -q --spider http://localhost:3001/health || exit 1

# Comando para iniciar o servidor (ajuste se o seu arquivo for index.js ou app.js)
CMD ["node", "server.js"]


