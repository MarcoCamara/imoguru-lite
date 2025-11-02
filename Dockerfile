# ----------------------------
# ✅ Dockerfile definitivo (porta 8085, serve global, sem erros)
# ----------------------------

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ----------------------------
# Stage 2: Production
# ----------------------------
FROM node:20-alpine
WORKDIR /app

# Instala servidor estático e dependências mínimas
RUN apk add --no-cache bash && npm install -g serve

COPY --from=builder /app/dist ./dist

# Expondo a porta correta (8085)
EXPOSE 8085

# Servindo o build com "serve"
CMD ["serve", "-s", "dist", "-l", "8085"]

