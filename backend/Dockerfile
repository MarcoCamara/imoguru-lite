# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app

# Healthcheck tool
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci --silent
COPY . .

# Expor porta do app
EXPOSE 3001

# IMPORTANT: garanta que o server escute 0.0.0.0
CMD ["node", "server.js"]

