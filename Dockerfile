# Frontend Dockerfile - produção (servir build com serve)
# Assumimos que o código do frontend está na raiz do repositório (como no seu caso).

FROM node:20-alpine AS builder
WORKDIR /app

# Copia package*, instala e builda o projeto
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

# Stage de produção: servidor leve
FROM node:20-alpine AS runner
WORKDIR /app

# instala serve (necessário /bin/sh)
RUN apk add --no-cache bash curl
# copia apenas o build final
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# instalar apenas dependências de produção se necessário (opcional)
RUN npm ci --production --silent || true
# instalar servidor estático
RUN npm install -g serve --silent

# Expor a porta interna que o container vai escutar
EXPOSE 8085

# usar porta 8085 internamente (você pediu 8085)
CMD ["serve", "-s", "dist", "-l", "8085"]
