# ----------------------------
# ✅ Dockerfile para EasyPanel Hostinger (porta 80)
# ----------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Produção
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist

# EasyPanel espera porta 80
EXPOSE 80

# Serve frontend na porta 80
CMD ["serve", "-s", "dist", "-l", "80"]

