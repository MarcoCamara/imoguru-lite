
#!/bin/bash
echo "===================================================="
echo "��� Diagnóstico Completo - ImoGuru Deploy Checker"
echo "===================================================="

# 1️⃣ Verificar docker-compose.yml
if [ ! -f "docker-compose.yml" ]; then
  echo "❌ docker-compose.yml não encontrado!"
  exit 1
else
  echo "✅ docker-compose.yml encontrado"
fi

# 2️⃣ Verificar se .env está presente
if [ ! -f ".env" ]; then
  echo "❌ Arquivo .env não encontrado!"
else
  echo "✅ .env detectado"
  echo "��� Conteúdo resumido:"
  grep -E "SUPABASE|PORT|CORS" .env
fi

# 3️⃣ Testar se Docker está ativo
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker não está em execução!"
  exit 1
else
  echo "✅ Docker ativo"
fi

# 4️⃣ Verificar containers existentes
echo "----------------------------------------------------"
echo "��� Containers em execução:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo "----------------------------------------------------"

# 5️⃣ Testar resposta do frontend local (porta 8085)
echo "��� Testando frontend (porta 8085)..."
curl -I http://localhost:8085 2>/dev/null | head -n 1

# 6️⃣ Testar backend (porta 3001)
echo "��� Testando backend (porta 3001)..."
curl -I http://localhost:3001/health 2>/dev/null | head -n 1

# 7️⃣ Logs do frontend
FRONT_ID=$(docker ps --filter "name=frontend" --format "{{.ID}}" | head -n 1)
if [ -n "$FRONT_ID" ]; then
  echo "��� Últimas linhas do log do frontend:"
  docker logs --tail=15 "$FRONT_ID"
else
  echo "⚠️ Container do frontend não encontrado!"
fi

# 8️⃣ Logs do backend
BACK_ID=$(docker ps --filter "name=backend" --format "{{.ID}}" | head -n 1)
if [ -n "$BACK_ID" ]; then
  echo "��� Últimas linhas do log do backend:"
  docker logs --tail=15 "$BACK_ID"
else
  echo "⚠️ Container do backend não encontrado!"
fi

# 9️⃣ Testar acesso interno (proxy simulation)
echo "----------------------------------------------------"
echo "��� Simulando requisição HTTP interna (via wget):"
wget --spider -T 3 http://localhost:8085 2>&1 | grep "connected" && echo "✅ Frontend acessível internamente" || echo "❌ Frontend inacessível (root cause provável)"
wget --spider -T 3 http://localhost:3001/health 2>&1 | grep "connected" && echo "✅ Backend acessível internamente" || echo "❌ Backend inacessível (root cause provável)"
echo "----------------------------------------------------"

echo "✅ Diagnóstico concluído!"
echo "��� Cole aqui a saída completa do script para análise."

