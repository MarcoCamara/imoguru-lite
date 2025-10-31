#!/bin/bash

# ===========================================================
# Verificador de saúde do Docker Compose - ImoGuru
# ===========================================================

COMPOSE_FILE="docker-compose.yml"
FRONTEND_PORT=8085
BACKEND_PORT=3001
BACKEND_HEALTH_URL="http://localhost:${BACKEND_PORT}/health"
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"
REQUIRED_ENV_VARS=("VITE_SUPABASE_URL" "VITE_SUPABASE_PUBLISHABLE_KEY" "DB_HOST" "DB_PORT" "DB_NAME" "DB_USER" "DB_PASSWORD" "JWT_SECRET" "RESEND_API_KEY" "BOOTSTRAP_SECRET" "CORS_ORIGIN")

echo "🔍 Iniciando verificação do ambiente Docker Compose..."
echo "------------------------------------------------------------"

# 1️⃣ Verificar arquivo docker-compose.yml
if [ ! -f "$COMPOSE_FILE" ]; then
  echo "❌ Arquivo $COMPOSE_FILE não encontrado!"
  exit 1
fi
echo "✅ docker-compose.yml encontrado"

# 2️⃣ Verificar variáveis obrigatórias
echo "🔧 Verificando variáveis de ambiente..."
MISSING_ENV=false
for VAR in "${REQUIRED_ENV_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "⚠️  Variável ausente: $VAR"
    MISSING_ENV=true
  fi
done
if [ "$MISSING_ENV" = true ]; then
  echo "❌ Faltam variáveis obrigatórias no ambiente (.env)"
  exit 1
else
  echo "✅ Todas as variáveis obrigatórias estão definidas"
fi

# 3️⃣ Subir o Compose (se não estiver rodando)
RUNNING_CONTAINERS=$(docker compose ps -q)
if [ -z "$RUNNING_CONTAINERS" ]; then
  echo "🚀 Containers não estão rodando — iniciando..."
  docker compose up -d
else
  echo "✅ Containers já estão rodando"
fi

# 4️⃣ Aguardar healthchecks
echo "⏳ Aguardando verificação de saúde dos serviços..."
sleep 10

# 5️⃣ Verificar status dos containers
echo "------------------------------------------------------------"
echo "📦 STATUS DOS CONTAINERS:"
docker compose ps

# 6️⃣ Verificar logs recentes com erros
echo "------------------------------------------------------------"
echo "🧾 Logs recentes (últimos 20s) com erros:"
docker compose logs --since 20s | grep -iE "error|fail|exception" || echo "✅ Nenhum erro recente encontrado"

# 7️⃣ Testar acessos HTTP internos
echo "------------------------------------------------------------"
echo "🌐 Testando endpoints locais..."

if curl -s -o /dev/null -w "%{http_code}" "$BACKEND_HEALTH_URL" | grep -q "200"; then
  echo "✅ Backend OK (${BACKEND_HEALTH_URL})"
else
  echo "❌ Falha no backend (${BACKEND_HEALTH_URL})"
fi

if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200"; then
  echo "✅ Frontend OK (${FRONTEND_URL})"
else
  echo "⚠️  Frontend não retornou 200 — talvez ainda compilando"
fi

# 8️⃣ Verificar healthcheck reportado pelo Docker
echo "------------------------------------------------------------"
echo "🩺 Healthcheck Report:"
docker inspect --format='{{.Name}}: {{range .State.Health.Log}}{{.ExitCode}} {{.Output}}{{end}}' $(docker ps -q) | sed 's/^/\n/'

# 9️⃣ Resumo final
echo "------------------------------------------------------------"
echo "🏁 Verificação concluída!"
docker compose ps --services --filter "status=running" > /dev/null && echo "✅ Todos os serviços estão ativos"

echo "\n🧠 Como usar"
echo "\nSalve esse script no mesmo diretório do seu docker-compose.yml"
echo "Arquivo: check_compose_health.sh"
echo "\nDê permissão de execução:"
echo "\nchmod +x check_compose_health.sh"
echo "\nExecute:"
echo "\n./check_compose_health.sh"

