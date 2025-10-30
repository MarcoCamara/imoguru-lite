## Guia Definitivo de Deploy em VPS (EasyPanel) — Sem Erros

Este roteiro foi revisado para refletir exatamente como seu projeto funciona hoje:
- Node.js 20
- Frontend Vite servindo estático na porta 8085
- Backend Express na porta 3001
- Supabase com uso de chave publishable no frontend e credenciais de DB no backend

---

### 1) Supabase de Produção

1. Crie o projeto no Supabase.
2. Guarde:
   - Project URL: `https://jjeyaupzjkyuidrxdvso.supabase.co`
   - Publishable key: `sb_publishable_C677OuylmWQm5SdGO0UqBw_dmMmQIBi`
   - Credenciais de banco (host, porta, database, usuário e senha)

Opcional (backend avançado): service_role NUNCA vai para o frontend.

---

### 2) Variáveis de ambiente corretas

Frontend (somente estas):
```env
VITE_SUPABASE_URL=https://jjeyaupzjkyuidrxdvso.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_C677OuylmWQm5SdGO0UqBw_dmMmQIBi
```

Backend:
```env
DB_HOST=db.jjeyaupzjkyuidrxdvso.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=<sua_senha_do_supabase>
JWT_SECRET=<gere-uma-chave-forte>
BOOTSTRAP_SECRET=<gere-uma-senha-forte>
RESEND_API_KEY=<opcional-se-usar>
CORS_ORIGIN=https://SEU-DOMINIO-DO-FRONT
```

Observações cruciais:
- Não use `DATABASE_URL` no backend; o projeto usa `DB_*` (veja `backend/config/database.js`).
- Não use `anon` nem `service_role` no frontend. Use apenas a publishable key.

---

### 3) Três formas de Deploy no EasyPanel

### **Passo 2: Criar Serviço no EasyPanel**

No EasyPanel você cria um **SERVIÇO** dentro do projeto, não faz upload direto. Escolha uma das opções:

---

#### **Opção A: Compose (Recomendado para começar rápido)** ⭐

**Passos:**
1. Dentro do projeto `imoguru-lite`, clique na aba **"Serviços"**
2. Clique em **"+ Serviço"**
3. Escolha **"Compose"** (modelo com tag BETA verde)
4. Configure:
   - **Nome:** `imoguru-fullstack`
   - **Método de deploy:** Upload do ZIP ou Git
   - Se upload: envie o `imoguru-deploy.zip`
   - O EasyPanel detectará automaticamente o `docker-compose.yml`
5. Cole TODAS as variáveis de ambiente geradas pelo `setup.sh`
6. Clique em **"Deploy"**

**Vantagens:** Frontend e backend sobem juntos, mais simples de gerenciar.

---

#### **Opção B: 2 Serviços Separados (Aplicativo)**

**FRONTEND:**
1. Clique **"+ Serviço"** > Escolha **"Aplicativo"**
2. **Nome:** `imoguru-frontend`
3. **Build Method:** **"Dockerfile"**
4. **Build Context:** `/` (raiz)
5. **Dockerfile:** `Dockerfile` (na raiz)
6. **Variáveis:** Apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
7. **Porta:** `8085`

**BACKEND:**
1. Clique **"+ Serviço"** novamente > **"Aplicativo"**
2. **Nome:** `imoguru-backend`
3. **Build Method:** **"Dockerfile"**
4. **Build Context:** `/backend`
5. **Dockerfile:** `Dockerfile` (dentro de backend/)
6. **Variáveis:** `DB_HOST`, `DB_PORT`, `JWT_SECRET`, etc.
7. **Porta:** `3001`

---

#### **Opção C: Docker Image (já buildada)** 🚀

Se você já fez build local e push para Docker Hub:

1. Crie serviço **"Aplicativo"**
2. Escolha **"Docker Image"** como método
3. Imagem: `marcocamara2025/imoguru-frontend:v1.0.50`
4. Porta: `8085`
5. Não precisa configurar variáveis de build (já foram embutidas)

---

### **Passo 3: Variáveis de Ambiente**

Veja a seção abaixo para as variáveis corretas.

---

### 3) Três formas de Deploy no EasyPanel

#### Opção A — Docker Image (recomendado para frontend)
1. No seu PC, exporte as variáveis e faça build da imagem do frontend com os argumentos:
```bash
export VITE_SUPABASE_URL="https://jjeyaupzjkyuidrxdvso.supabase.co"
export VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_C677OuylmWQm5SdGO0UqBw_dmMmQIBi"

docker build . --no-cache \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
  -t marcocamara2025/imoguru-frontend:v1.0.50

docker push marcocamara2025/imoguru-frontend:v1.0.50
```
2. No EasyPanel, crie um app "Docker Image":
   - Imagem: `marcocamara2025/imoguru-frontend:v1.0.50`
   - Porta: `8085`
   - Não precisa configurar env para o frontend (já foi embutido no build).

3. Crie um app "Dockerfile" ou "Docker Image" para o backend e configure as env `DB_*`, `JWT_SECRET`, `BOOTSTRAP_SECRET`, `CORS_ORIGIN`.

#### Opção B — Dockerfile (build do frontend no EasyPanel)
1. Aponte o EasyPanel para o repositório e `Dockerfile` (raiz). Ele já:
   - Usa Node 20
   - Gera `.env.production` via build-args
   - Serve `dist/` na porta 8085 com `serve`
2. No EasyPanel, em Build Args, defina:
   - `VITE_SUPABASE_URL = https://jjeyaupzjkyuidrxdvso.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY = sb_publishable_C677OuylmWQm5SdGO0UqBw_dmMmQIBi`
3. Para o backend, configure as env conforme a sessão Backend acima.

#### Opção C — Upload do build estático (frontend)
1. Na sua máquina:
```bash
npm install
npm run build
```
2. Faça upload do diretório `dist/` para um app de site estático ou um container Nginx no EasyPanel.
3. Backend permanece em um app separado (Dockerfile/Image) com as env `DB_*` e `CORS_ORIGIN` apontando para a URL pública do frontend.

---

### 3.1) Prós e Contras de cada opção

- Docker Image (frontend)
  - Vantagens: build reproduzível; mais rápido para redeploy; sem dependência do builder do painel.
  - Desvantagens: precisa de registry (Docker Hub) e fazer push a cada mudança.

- Dockerfile (frontend)
  - Vantagens: o EasyPanel constrói direto do repositório; sem precisar de push de imagens.
  - Desvantagens: build no servidor pode ser mais lento; exige setar Build Args no painel.

- Upload estático (frontend)
  - Vantagens: simples, barato, sem runtime Node; ótimo para apenas arquivos do `dist/`.
  - Desvantagens: qualquer mudança requer novo build local e upload; sem variáveis em runtime.

- docker-compose (full stack)
  - Vantagens: sobe front e back juntos; um único comando.
  - Desvantagens: orquestração manual; logs/reciclagem por serviço exigem CLI.

---

### 3.2) Como configurar cada App no EasyPanel

Frontend (Docker Image):
- Tipo: Docker Image
- Image: `marcocamara2025/imoguru-frontend:v1.0.50`
- Exposed Port: `8085`
- Health Check (opcional): HTTP GET `/` porta 8085
- Domínios: adicione seu domínio público

Frontend (Dockerfile):
- Tipo: Dockerfile
- Repositório/branch apontando para a raiz com `Dockerfile`
- Build Args:
  - `VITE_SUPABASE_URL = https://jjeyaupzjkyuidrxdvso.supabase.co`
  - `VITE_SUPABASE_PUBLISHABLE_KEY = sb_publishable_C677OuylmWQm5SdGO0UqBw_dmMmQIBi`
- Exposed Port: `8085`
- Health Check: HTTP GET `/` porta 8085

Frontend (Upload estático):
- Tipo: Static Site ou Nginx container servindo o diretório `dist/`
- Origem: conteúdo do `dist/`
- Domínios e HTTPS no painel

Backend (Dockerfile ou Docker Image):
- Porta: `3001`
- Variáveis obrigatórias:
  - `DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD`
  - `JWT_SECRET, BOOTSTRAP_SECRET`
  - `RESEND_API_KEY` (se usar), `CORS_ORIGIN` (URL pública do frontend)
- Health Check: HTTP GET `/health` porta 3001

---

### 4) Deploy full-stack com docker-compose (opcional)
Se preferir orquestrar ambos via compose (raiz tem `docker-compose.yml`):
1. Crie um arquivo `.env` ao lado do `docker-compose.yml` com:
```env
VITE_SUPABASE_URL=https://jjeyaupzjkyuidrxdvso.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_C677OuylmWQm5SdGO0UqBw_dmMmQIBi

DB_HOST=db.jjeyaupzjkyuidrxdvso.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=<sua_senha>
JWT_SECRET=<seu_jwt_secret>
BOOTSTRAP_SECRET=<seu_bootstrap_secret>
RESEND_API_KEY=<opcional>
CORS_ORIGIN=https://SEU-DOMINIO-DO-FRONT
```
2. Suba:
```bash
docker compose up -d --build
```
Frontend: `:8085` | Backend: `:3001`.

---

### 5) Domínios e CORS
1. Aponte o domínio do frontend (ex: `https://app.seudominio.com`) para o app do frontend.
2. No backend, `CORS_ORIGIN` deve ser exatamente a URL pública do frontend.
3. Habilite SSL/HTTPS no EasyPanel.

---

### 6) Pós-instalação
1. Healthcheck do backend: `GET /health` na porta 3001.
2. Bootstrap admin (se aplicável): acesse `/bootstrap-admin` com `BOOTSTRAP_SECRET`.
3. Ajuste domínios por empresa dentro do painel do app, se usar páginas públicas por empresa.

---

### 7) Solução de problemas
- 502 no frontend: o `Dockerfile` usa `CMD ["serve","-s","dist","-l","8085"]` (ok). Verifique logs e porta 8085.
- CSS/assets quebrados: `vite.config.ts` usa `base: '/'` em produção (ok). Limpe cache do navegador e CDN.
- Erros de CORS: confirme `CORS_ORIGIN` do backend exatamente igual ao domínio do frontend.
- Erros de conexão com DB: confirme `DB_*` e liberação do Supabase para conexões (IP não é necessário liberar no Supabase gerenciado, apenas credenciais corretas).

---

### 8) Geradores úteis
```bash
# Gerar JWT_SECRET forte
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Pronto. Siga exatamente este roteiro e o deploy ficará estável no EasyPanel.
