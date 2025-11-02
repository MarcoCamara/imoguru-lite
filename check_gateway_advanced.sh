
#!/bin/bash
echo "===================================================="
echo "��� Diagnóstico Avançado - Erro 502 no EasyPanel"
echo "===================================================="

# 1️⃣ Confirma se Docker está rodando
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker não está rodando. Abortando."
  exit 1
fi
echo "✅ Docker ativo"

# 2️⃣ Lista containers relacionados
echo "----------------------------------------------------"
echo "��� Containers ativos (nomes, status e portas):"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "imoguru|frontend|fullstack|serve"
echo "----------------------------------------------------"

# 3️⃣ Identifica container mais recente (frontend)
CONTAINER=$(docker ps --format "{{.ID}} {{.Names}}" | grep -E "imoguru|frontend|fullstack|serve" | head -n1 | awk '{print $1}')

if [ -z "$CONTAINER" ]; then
  echo "❌ Nenhum container do frontend encontrado."
  exit 1
fi
echo "✅ Container detectado: $CONTAINER"

# 4️⃣ Testa se a porta 80 está realmente aberta dentro do container
echo "----------------------------------------------------"
echo "��� Testando se o container escuta na porta 80..."
docker exec -it $CONTAINER sh -c "apk add --no-cache netcat-openbsd >/dev/null && nc -zv 127.0.0.1 80" 2>&1

# 5️⃣ Testa resposta HTTP diretamente de dentro do container
echo "----------------------------------------------------"
echo "��� Testando requisição HTTP interna (curl localhost:80)"
docker exec -it $CONTAINER sh -c "apk add --no-cache curl >/dev/null && curl -I http://127.0.0.1:80" 2>&1 | head -n 10

# 6️⃣ Últimos logs de inicialização
echo "----------------------------------------------------"
echo "��� Logs recentes do container:"
docker logs --tail=30 $CONTAINER
echo "----------------------------------------------------"

# 7️⃣ Verifica se há algum crash loop
docker inspect -f '{{.State.Status}}' $CONTAINER | grep running >/dev/null && echo "✅ Container está em execução." || echo "❌ Container não está rodando corretamente."

echo "===================================================="
echo "��� Cole aqui o resultado completo do script."

