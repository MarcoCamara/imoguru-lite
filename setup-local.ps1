# ============================================
# Script de Setup para Ambiente Local (PowerShell)
# ============================================
# Este script configura o ambiente local para desenvolvimento
# Uso: .\setup-local.ps1

Write-Host "🚀 Configurando ambiente local para desenvolvimento..." -ForegroundColor Cyan
Write-Host ""

# Verificar se Node.js está instalado
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
    
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 20) {
        Write-Host "❌ Node.js versão 20+ é necessário. Versão atual: $nodeVersion" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Node.js não encontrado. Por favor, instale Node.js 20+ primeiro." -ForegroundColor Red
    exit 1
}

# 1. Configurar Frontend
Write-Host "📦 Configurando Frontend..." -ForegroundColor Cyan
if (-not (Test-Path ".env.local")) {
    if (Test-Path "env.local.example") {
        Copy-Item "env.local.example" ".env.local"
        Write-Host "✅ Arquivo .env.local criado a partir de env.local.example" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANTE: Ajuste as variáveis em .env.local com seus valores" -ForegroundColor Yellow
    } elseif (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Write-Host "✅ Arquivo .env.local criado a partir de .env.example" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANTE: Ajuste as variáveis em .env.local com seus valores" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Arquivo .env.example não encontrado. Criando .env.local básico..." -ForegroundColor Yellow
        $content = @"
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_aqui
VITE_API_URL=http://localhost:3001
"@
        $content | Out-File -FilePath ".env.local" -Encoding UTF8
        Write-Host "✅ Arquivo .env.local criado" -ForegroundColor Green
    }
} else {
    Write-Host "ℹ️  Arquivo .env.local já existe" -ForegroundColor Gray
}

# 2. Instalar dependências do Frontend
Write-Host ""
Write-Host "📦 Instalando dependências do Frontend..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    npm install
    Write-Host "✅ Dependências do frontend instaladas" -ForegroundColor Green
} else {
    Write-Host "ℹ️  node_modules já existe. Pulando instalação." -ForegroundColor Gray
    Write-Host "   Execute 'npm install' manualmente se precisar atualizar."
}

# 3. Configurar Backend
Write-Host ""
Write-Host "📦 Configurando Backend..." -ForegroundColor Cyan
Set-Location backend

if (-not (Test-Path ".env")) {
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Host "✅ Arquivo backend/.env criado a partir de env.example" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANTE: Ajuste as variáveis em backend/.env com seus valores" -ForegroundColor Yellow
    } elseif (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Arquivo backend/.env criado a partir de .env.example" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANTE: Ajuste as variáveis em backend/.env com seus valores" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Arquivo .env.example não encontrado. Criando .env básico..." -ForegroundColor Yellow
        $content = @"
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
"@
        $content | Out-File -FilePath ".env" -Encoding UTF8
        Write-Host "✅ Arquivo backend/.env criado" -ForegroundColor Green
    }
} else {
    Write-Host "ℹ️  Arquivo backend/.env já existe" -ForegroundColor Gray
}

# 4. Instalar dependências do Backend
Write-Host ""
Write-Host "📦 Instalando dependências do Backend..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    npm install
    Write-Host "✅ Dependências do backend instaladas" -ForegroundColor Green
} else {
    Write-Host "ℹ️  node_modules já existe. Pulando instalação." -ForegroundColor Gray
    Write-Host "   Execute 'npm install' manualmente se precisar atualizar."
}

Set-Location ..

# 5. Verificar Supabase CLI
Write-Host ""
Write-Host "🔍 Verificando Supabase CLI..." -ForegroundColor Cyan
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI encontrado: $supabaseVersion" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para iniciar o Supabase local, execute:" -ForegroundColor Yellow
    Write-Host "  supabase start" -ForegroundColor Yellow
} catch {
    Write-Host "⚠️  Supabase CLI não encontrado" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para instalar no Windows:" -ForegroundColor Cyan
    Write-Host "  1. Instale Scoop (se não tiver):" -ForegroundColor White
    Write-Host "     Set-ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Gray
    Write-Host "     Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Instale Supabase CLI:" -ForegroundColor White
    Write-Host "     scoop bucket add supabase https://github.com/supabase/scoop-bucket.git" -ForegroundColor Gray
    Write-Host "     scoop install supabase" -ForegroundColor Gray
}

# 6. Resumo
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Setup concluído!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configure as variáveis de ambiente:" -ForegroundColor White
Write-Host "   - .env.local (frontend)" -ForegroundColor Gray
Write-Host "   - backend/.env (backend)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Inicie o Supabase local (se usar):" -ForegroundColor White
Write-Host "   supabase start" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Em terminais separados, execute:" -ForegroundColor White
Write-Host "   Terminal 1 (Backend):" -ForegroundColor Yellow
Write-Host "     cd backend" -ForegroundColor Gray
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   Terminal 2 (Frontend):" -ForegroundColor Yellow
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Acesse:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:8085" -ForegroundColor Gray
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor Gray
Write-Host "   Supabase Studio: http://127.0.0.1:54323" -ForegroundColor Gray
Write-Host ""

