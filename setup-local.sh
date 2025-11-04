#!/bin/bash

# ============================================
# Script de Setup para Ambiente Local
# ============================================
# Este script configura o ambiente local para desenvolvimento
# Uso: bash setup-local.sh

echo "🚀 Configurando ambiente local para desenvolvimento..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 20+ primeiro."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js versão 20+ é necessário. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js encontrado: $(node -v)"
echo ""

# 1. Configurar Frontend
echo "📦 Configurando Frontend..."
if [ ! -f .env.local ]; then
    if [ -f env.local.example ]; then
        cp env.local.example .env.local
        echo -e "${GREEN}✅ Arquivo .env.local criado a partir de env.local.example${NC}"
        echo "⚠️  IMPORTANTE: Ajuste as variáveis em .env.local com seus valores"
    elif [ -f .env.example ]; then
        cp .env.example .env.local
        echo -e "${GREEN}✅ Arquivo .env.local criado a partir de .env.example${NC}"
        echo "⚠️  IMPORTANTE: Ajuste as variáveis em .env.local com seus valores"
    else
        echo "⚠️  Arquivo .env.example não encontrado. Criando .env.local básico..."
        cat > .env.local << 'EOF'
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_aqui
VITE_API_URL=http://localhost:3001
EOF
        echo -e "${GREEN}✅ Arquivo .env.local criado${NC}"
    fi
else
    echo "ℹ️  Arquivo .env.local já existe"
fi

# 2. Instalar dependências do Frontend
echo ""
echo "📦 Instalando dependências do Frontend..."
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✅ Dependências do frontend instaladas${NC}"
else
    echo "ℹ️  node_modules já existe. Pulando instalação."
    echo "   Execute 'npm install' manualmente se precisar atualizar."
fi

# 3. Configurar Backend
echo ""
echo "📦 Configurando Backend..."
cd backend

if [ ! -f .env ]; then
    if [ -f env.example ]; then
        cp env.example .env
        echo -e "${GREEN}✅ Arquivo backend/.env criado a partir de env.example${NC}"
        echo "⚠️  IMPORTANTE: Ajuste as variáveis em backend/.env com seus valores"
    elif [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Arquivo backend/.env criado a partir de .env.example${NC}"
        echo "⚠️  IMPORTANTE: Ajuste as variáveis em backend/.env com seus valores"
    else
        echo "⚠️  Arquivo .env.example não encontrado. Criando .env básico..."
        cat > .env << 'EOF'
DB_HOST=127.0.0.1
DB_PORT=54322
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=desenvolvimento_local_secret_key
BOOTSTRAP_SECRET=desenvolvimento_local_bootstrap_secret
CORS_ORIGIN=http://localhost:8085
PORT=3001
NODE_ENV=development
EOF
        echo -e "${GREEN}✅ Arquivo backend/.env criado${NC}"
    fi
else
    echo "ℹ️  Arquivo backend/.env já existe"
fi

# 4. Instalar dependências do Backend
echo ""
echo "📦 Instalando dependências do Backend..."
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✅ Dependências do backend instaladas${NC}"
else
    echo "ℹ️  node_modules já existe. Pulando instalação."
    echo "   Execute 'npm install' manualmente se precisar atualizar."
fi

cd ..

# 5. Verificar Supabase CLI
echo ""
echo "🔍 Verificando Supabase CLI..."
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✅ Supabase CLI encontrado: $(supabase --version)${NC}"
    echo ""
    echo "Para iniciar o Supabase local, execute:"
    echo -e "${YELLOW}  supabase start${NC}"
else
    echo -e "${YELLOW}⚠️  Supabase CLI não encontrado${NC}"
    echo ""
    echo "Para instalar no Windows:"
    echo "  1. Instale Scoop (se não tiver):"
    echo "     Set-ExecutionPolicy RemoteSigned -Scope CurrentUser"
    echo "     Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression"
    echo ""
    echo "  2. Instale Supabase CLI:"
    echo "     scoop bucket add supabase https://github.com/supabase/scoop-bucket.git"
    echo "     scoop install supabase"
fi

# 6. Resumo
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Setup concluído!${NC}"
echo "=========================================="
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Configure as variáveis de ambiente:"
echo "   - .env.local (frontend)"
echo "   - backend/.env (backend)"
echo ""
echo "2. Inicie o Supabase local (se usar):"
echo "   supabase start"
echo ""
echo "3. Em terminais separados, execute:"
echo "   Terminal 1 (Backend):"
echo "     cd backend && npm run dev"
echo ""
echo "   Terminal 2 (Frontend):"
echo "     npm run dev"
echo ""
echo "4. Acesse:"
echo "   Frontend: http://localhost:8085"
echo "   Backend:  http://localhost:3001"
echo "   Supabase Studio: http://127.0.0.1:54323"
echo ""

