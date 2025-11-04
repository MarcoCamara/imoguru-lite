# 📋 Comandos Completos - Git e Execução Local

## 🚀 PARTE 1: COMANDOS PARA GIT NO GITHUB

### 1. Inicializar repositório Git (se ainda não foi feito)

```bash
# Navegar até o diretório do projeto
cd "C:\Users\marco\Documents\33 - Imoguru\Desenvolvimento IMOGURU-LITE (CURSOR)\rose-realstate"

# Inicializar repositório Git
git init

# Verificar status
git status
```

### 2. Criar arquivo .gitignore (se não existir)

```bash
# Criar .gitignore básico para Node.js/React
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
backend/node_modules/

# Build outputs
dist/
build/
*.log

# Environment variables
.env
.env.local
.env.production
.env.development
deploy.env

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Docker
*.zip
docker-compose.yml.backup

# Supabase
.branches/
.temp/
EOF
```

### 3. Adicionar arquivos ao Git

```bash
# Adicionar todos os arquivos (exceto os no .gitignore)
git add .

# Verificar o que será commitado
git status
```

### 4. Fazer primeiro commit

```bash
# Commit inicial
git commit -m "Initial commit: Rose Real Estate project"
```

### 5. Criar repositório no GitHub e conectar

```bash
# IMPORTANTE: Primeiro, crie o repositório no GitHub manualmente:
# 1. Acesse: https://github.com/new
# 2. Nome do repositório: rose-realstate (ou o nome que preferir)
# 3. NÃO marque "Initialize with README"
# 4. Clique em "Create repository"

# Depois, conecte o repositório local ao GitHub
# Substitua SEU_USUARIO pelo seu usuário do GitHub
git remote add origin https://github.com/SEU_USUARIO/rose-realstate.git

# Verificar se foi adicionado
git remote -v
```

### 6. Renomear branch principal (se necessário)

```bash
# Renomear branch para main (padrão do GitHub)
git branch -M main
```

### 7. Fazer push para o GitHub

```bash
# Primeiro push
git push -u origin main

# Se pedir autenticação, você pode precisar:
# - Usar Personal Access Token (recomendado)
# - Ou configurar SSH keys
```

### 8. Comandos Git úteis para futuros commits

```bash
# Ver status das alterações
git status

# Adicionar arquivos específicos
git add caminho/do/arquivo

# Adicionar todos os arquivos modificados
git add .

# Fazer commit
git commit -m "Descrição da alteração"

# Enviar para GitHub
git push

# Ver histórico de commits
git log --oneline

# Criar nova branch
git checkout -b nome-da-branch

# Voltar para branch main
git checkout main
```

---

## 🖥️ PARTE 2: COMANDOS PARA RODAR O PROJETO LOCALMENTE

### Pré-requisitos

Antes de rodar, certifique-se de ter instalado:
- ✅ Node.js 20+ ([Download](https://nodejs.org/))
- ✅ npm (vem com Node.js)
- ✅ Docker Desktop (para Supabase local - opcional)
- ✅ Supabase CLI (para desenvolvimento local)

### Opção A: Desenvolvimento Completo (Frontend + Backend + Supabase Local)

#### 1. Instalar Supabase CLI (se ainda não tiver)

**Windows (PowerShell):**
```powershell
# Instalar Scoop (se não tiver)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Adicionar bucket do Supabase
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

# Instalar Supabase CLI
scoop install supabase

# Verificar instalação
supabase --version
```

#### 2. Iniciar Supabase Local

```bash
# No terminal 1: Iniciar Supabase
supabase start

# Aguardar até aparecer as URLs e chaves
# Copie a Publishable key que aparecer no terminal
```

#### 3. Configurar variáveis de ambiente locais

```bash
# Criar arquivo .env.local na raiz do projeto
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_local_do_supabase_start
VITE_API_URL=http://localhost:3001
EOF
```

**OU** criar manualmente o arquivo `.env.local` com:
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_local_aqui
VITE_API_URL=http://localhost:3001
```

#### 4. Instalar dependências do Frontend

```bash
# Na raiz do projeto
npm install
```

#### 5. Configurar Backend

```bash
# Navegar para pasta backend
cd backend

# Instalar dependências do backend
npm install

# Criar arquivo .env no backend
cat > .env << 'EOF'
DB_HOST=127.0.0.1
DB_PORT=54322
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=desenvolvimento_local_secret_key_aqui
BOOTSTRAP_SECRET=desenvolvimento_local_bootstrap_secret_aqui
CORS_ORIGIN=http://localhost:8085
PORT=3001
NODE_ENV=development
EOF
```

**OU** criar manualmente `backend/.env` com as variáveis acima.

#### 6. Iniciar Backend (Terminal 2)

```bash
# Navegar para pasta backend
cd backend

# Iniciar backend em modo desenvolvimento
npm run dev

# Se não tiver nodemon instalado:
npm install -g nodemon
# OU
npm install --save-dev nodemon

# O backend deve iniciar em http://localhost:3001
```

#### 7. Iniciar Frontend (Terminal 3)

```bash
# Na raiz do projeto
npm run dev

# O frontend deve iniciar em http://localhost:8085
```

#### 8. Acessar a aplicação

- **Frontend**: http://localhost:8085
- **Backend API**: http://localhost:3001
- **Supabase Studio**: http://127.0.0.1:54323

---

### Opção B: Apenas Frontend (usando Supabase Cloud)

Se preferir usar o Supabase de produção ao invés do local:

#### 1. Instalar dependências

```bash
# Na raiz do projeto
npm install
```

#### 2. Configurar variáveis de ambiente

```bash
# Criar .env.local
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://jjeyaupzjkyuidrxdvso.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publishable_aqui
VITE_API_URL=http://localhost:3001
EOF
```

#### 3. Iniciar frontend

```bash
npm run dev
```

**Nota**: O backend precisa estar rodando separadamente ou usar APIs do Supabase.

---

### Opção C: Rodar com Docker Compose (Produção Local)

#### 1. Preparar arquivo deploy.env

```bash
# Criar deploy.env com suas configurações
# Veja o arquivo deploy.env existente como exemplo
```

#### 2. Rodar Docker Compose

```bash
# Na raiz do projeto
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Parar containers
docker-compose down
```

#### 3. Acessar

- **Frontend**: http://localhost:80 (ou porta configurada)
- **Backend**: http://localhost:8080 (ou porta configurada)

---

## 🔧 COMANDOS ÚTEIS PARA DESENVOLVIMENTO

### Frontend

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Linter
npm run lint
```

### Backend

```bash
# Na pasta backend/
cd backend

# Instalar dependências
npm install

# Rodar em desenvolvimento (com nodemon)
npm run dev

# Rodar em produção
npm start
```

### Supabase Local

```bash
# Iniciar Supabase
supabase start

# Parar Supabase
supabase stop

# Resetar banco (CUIDADO: apaga dados)
supabase db reset

# Ver status
supabase status
```

### Docker

```bash
# Ver containers rodando
docker ps

# Ver logs de um container
docker logs rose-backend
docker logs rose-frontend

# Entrar no container
docker exec -it rose-backend sh

# Parar todos os containers
docker-compose down

# Rebuild e restart
docker-compose up -d --build
```

---

## 🐛 SOLUÇÃO DE PROBLEMAS COMUNS

### Erro: "Port already in use"

```bash
# Windows: Ver qual processo está usando a porta
netstat -ano | findstr :8085
netstat -ano | findstr :3001

# Matar processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F
```

### Erro: "Cannot find module"

```bash
# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Backend também
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Supabase não inicia"

```bash
# Verificar se Docker está rodando
docker ps

# Reiniciar Supabase
supabase stop
supabase start
```

### Erro: "Backend não conecta ao banco"

Verifique:
1. Supabase está rodando (`supabase status`)
2. Porta do banco está correta (54322 para local)
3. Credenciais no `backend/.env` estão corretas

---

## 📝 RESUMO RÁPIDO

### Para fazer Git:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/SEU_USUARIO/rose-realstate.git
git branch -M main
git push -u origin main
```

### Para rodar localmente:

```bash
# Terminal 1: Supabase
supabase start

# Terminal 2: Backend
cd backend
npm install
npm run dev

# Terminal 3: Frontend
npm install
npm run dev
```

---

**Pronto!** Agora você tem todos os comandos necessários para fazer Git e rodar o projeto localmente. 🚀

