FROM node:20-alpine
WORKDIR /app
# Instalar wget para healthcheck
RUN apk add --no-cache wget
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
