# 🚀 Guia Rápido - Rose Real Estate

## ⚡ Início Rápido

### Opção 1: Setup Automático (Recomendado)

**Windows (PowerShell):**
```powershell
.\setup-local.ps1
```

**Linux/Mac:**
```bash
bash setup-local.sh
```

### Opção 2: Setup Manual

1. **Configurar variáveis de ambiente:**
   ```bash
   # Frontend
   cp env.local.example .env.local
   # Edite .env.local com suas configurações
   
   # Backend
   cd backend
   cp env.example .env
   # Edite .env com suas configurações
   cd ..
   ```

2. **Instalar dependências:**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   npm install
   cd ..
   ```

---

## 🏃 Rodar Localmente

### 1. Iniciar Supabase Local (se usar)

```bash
supabase start
```

**Copie a Publishable Key** que aparecer no terminal e cole no `.env.local`

### 2. Iniciar Backend

```bash
cd backend
npm run dev
```

Backend rodará em: **http://localhost:3001**

### 3. Iniciar Frontend

```bash
npm run dev
```

Frontend rodará em: **http://localhost:8085**

---

## 🐳 Rodar com Docker (Produção Local)

### 1. Configurar variáveis

```bash
# Copiar exemplo
cp deploy.env.example deploy.env

# Editar deploy.env com suas configurações reais
```

### 2. Rodar containers

```bash
docker-compose up -d --build
```

### 3. Acessar

- **Frontend**: http://localhost:3000 (ou porta configurada em `FRONTEND_PORT`)
- **Backend**: http://localhost:3001 (ou porta configurada em `BACKEND_PORT`)

### 4. Ver logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas frontend
docker-compose logs -f rose-frontend

# Apenas backend
docker-compose logs -f rose-backend
```

### 5. Parar containers

```bash
docker-compose down
```

---

## 📦 Deploy no VPS

### 1. Preparar arquivo deploy.env

```bash
cp deploy.env.example deploy.env
# Editar deploy.env com configurações do VPS
```

**Importante:**
- Configure `VITE_API_URL` com a URL pública do backend
- Configure `CORS_ORIGIN` com o domínio do frontend
- Gere chaves fortes para `JWT_SECRET` e `BOOTSTRAP_SECRET`

### 2. Upload para VPS

```bash
# Via Git (recomendado)
git push origin main
# No VPS: git pull origin main

# Ou via SCP/SFTP
scp -r . usuario@vps:/caminho/projeto
```

### 3. No VPS

```bash
# Navegar até o projeto
cd /caminho/projeto

# Configurar deploy.env (já deve estar no servidor)
nano deploy.env

# Rodar containers
docker-compose up -d --build

# Verificar status
docker-compose ps
docker-compose logs -f
```

### 4. Configurar Portas (se necessário)

No `deploy.env`, você pode configurar:
```env
FRONTEND_PORT=3000  # Porta externa do frontend
BACKEND_PORT=3001   # Porta externa do backend
```

### 5. Configurar Proxy Reverso (Nginx - Opcional)

Se quiser usar domínios customizados:

```nginx
# Frontend
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Backend
server {
    listen 80;
    server_name api.seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔧 Comandos Úteis

### Desenvolvimento

```bash
# Frontend
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run preview      # Preview do build
npm run lint         # Linter

# Backend
cd backend
npm run dev          # Desenvolvimento (com nodemon)
npm start            # Produção
```

### Docker

```bash
# Rebuild completo
docker-compose up -d --build

# Parar tudo
docker-compose down

# Ver logs
docker-compose logs -f

# Entrar no container
docker exec -it rose-frontend sh
docker exec -it rose-backend sh

# Limpar tudo (CUIDADO!)
docker-compose down -v
```

### Supabase Local

```bash
# Iniciar
supabase start

# Parar
supabase stop

# Status
supabase status

# Resetar banco (CUIDADO: apaga dados)
supabase db reset
```

---

## 🐛 Solução de Problemas

### Porta já em uso

**Windows:**
```powershell
# Ver qual processo usa a porta
netstat -ano | findstr :8085

# Matar processo (substitua PID)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Ver qual processo usa a porta
lsof -i :8085

# Matar processo
kill -9 <PID>
```

### Erro: "Cannot find module"

```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install

# Backend também
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Docker não inicia

```bash
# Ver logs de erro
docker-compose logs

# Verificar se portas estão livres
docker ps

# Rebuild completo
docker-compose down
docker-compose up -d --build
```

### Backend não conecta ao banco

1. Verifique se Supabase está rodando: `supabase status`
2. Verifique credenciais no `backend/.env`
3. Verifique se porta do banco está correta (54322 para local)

---

## 📝 Variáveis de Ambiente

### Frontend (.env.local)

| Variável | Descrição | Exemplo Local | Exemplo Produção |
|----------|-----------|----------------|-------------------|
| `VITE_SUPABASE_URL` | URL do Supabase | `http://127.0.0.1:54321` | `https://xxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública | Do `supabase start` | Do painel Supabase |
| `VITE_API_URL` | URL do backend | `http://localhost:3001` | `https://api.seudominio.com` |

### Backend (backend/.env)

| Variável | Descrição | Exemplo Local | Exemplo Produção |
|----------|-----------|---------------|-------------------|
| `DB_HOST` | Host do banco | `127.0.0.1` | `db.xxx.supabase.co` |
| `DB_PORT` | Porta do banco | `54322` | `5432` |
| `DB_NAME` | Nome do banco | `postgres` | `postgres` |
| `DB_USER` | Usuário | `postgres` | `postgres` |
| `DB_PASSWORD` | Senha | `postgres` | Senha do Supabase |
| `JWT_SECRET` | Chave JWT | Qualquer | Chave forte (32 bytes) |
| `CORS_ORIGIN` | Origem permitida | `http://localhost:8085` | `https://seudominio.com` |

### Docker Compose (deploy.env)

Inclui todas as variáveis acima, mais:
- `FRONTEND_PORT`: Porta externa do frontend (padrão: 3000)
- `BACKEND_PORT`: Porta externa do backend (padrão: 3001)

---

## ✅ Checklist de Deploy

Antes de fazer deploy no VPS:

- [ ] Todas as variáveis de ambiente configuradas
- [ ] `deploy.env` criado e configurado
- [ ] Chaves fortes geradas (`JWT_SECRET`, `BOOTSTRAP_SECRET`)
- [ ] `CORS_ORIGIN` aponta para domínio real do frontend
- [ ] `VITE_API_URL` aponta para URL pública do backend
- [ ] Portas verificadas (não conflitam com outros serviços)
- [ ] Firewall configurado (portas abertas)
- [ ] `.gitignore` inclui `deploy.env`
- [ ] Testado localmente com Docker Compose

---

## 📚 Documentação Adicional

- **Análise de Deploy**: `ANALISE_DEPLOY_VPS.md`
- **Comandos Git**: `COMANDOS_GIT_E_RUN.md`
- **Instruções Detalhadas**: `instrucoes.md`
- **Deploy EasyPanel**: `INSTRUCOES_DEPLOY.md`

---

**Pronto para começar!** 🚀

