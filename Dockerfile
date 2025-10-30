# Dockerfile FINAL GARANTIDO (v1.0.52) - Versão CORRIGIDA
# Resolve: 1. Injeção de Variáveis no Build (ARG)
#          2. Injeção de Chave Publishable (fim do hardcode da Anon Key)
#          3. Formato do CMD (Para resolver o erro Exited/502 no EasyPanel)

FROM node:20-alpine AS builder
WORKDIR /app

# Argumentos de Build: Estes valores são passados pelo `docker build --build-arg...`
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

COPY package.json ./
# .
RUN npm install
COPY . .

# CRÍTICO: INJEÇÃO CORRETA - Cria o .env.production usando os argumentos (ARG).
# Garante que as variáveis do EasyPanel sejam usadas no build do VITE.
RUN echo "VITE_SUPABASE_URL=$VITE_SUPABASE_URL" > .env.production && \
    echo "VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY" >> .env.production

# Rodar a build com as variáveis de produção
RUN npm run build

FROM node:20-alpine
WORKDIR /app
# Apenas copie o resultado da build
COPY --from=builder /app/dist ./dist
COPY package.json ./
RUN npm install --production
RUN npm install -g serve

# PORTA ESTÁVEL
EXPOSE 8085 
# CORREÇÃO CRÍTICA: Uso do formato JSON (Exec Form) para o CMD
CMD ["serve", "-s", "dist", "-l", "8085"]