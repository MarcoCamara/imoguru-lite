# 🔧 Solução: Erro 502 - Service is not reachable

## ⚠️ Problema

O deploy foi bem-sucedido, mas ao acessar o app você vê:
- "Service is not reachable"
- Erro 502 no console
- Favicon e recursos não carregam

Isso significa que os containers foram criados, mas o serviço não está respondendo corretamente.

---

## 🔍 Diagnóstico Rápido

### 1. Verificar Logs dos Containers

**No EasyPanel:**

1. Vá no serviço `imoguru-fullstack`
2. Clique na aba **"Logs"** ou **"Visão Geral"**
3. Procure por mensagens de erro

**O que procurar:**

- ✅ **Bom sinal:**
  - `🚀 Server running on port 3001` (backend)
  - `serve` rodando na porta 8085 (frontend)

- ❌ **Problemas comuns:**
  - `Error: Cannot find module...`
  - `EADDRINUSE: address already in use`
  - `Exited (1)` ou `Exited (0)`
  - Container morrendo logo após iniciar

---

## 🛠️ Soluções Mais Comuns

### Problema 1: Variáveis de Ambiente Não Configuradas

**Sintoma:** Container inicia mas morre ou não responde

**Solução:**
1. Vá na aba **"Ambiente"** do serviço Compose
2. Confirme que TODAS as variáveis estão lá:
   ```
   VITE_SUPABASE_URL=https://jjeyaupzjkyuidrxdvso.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_C677OuylmWQm5SdGO0UqBw_dmMmQIBi
   DB_HOST=db.jjeyaupzjkyuidrxdvso.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=alvZmG2J7kXYbaZb0kFh
   JWT_SECRET=CLSmdoCyfqRXgLYL8AWIjueAQpZ5H01x
   BOOTSTRAP_SECRET=MgzCd0CXmju3k7bBEx154b1uFM39d3xE
   RESEND_API_KEY=re_NXxH8Y1i_4Wqe4ezRZ1ifceoa7R4LTFtU
   CORS_ORIGIN=https://imoguru-lite-imoguru-fullstack.9m3hab.easypanel.host
   ```
3. **Salve** e faça **Redeploy**

---

### Problema 2: Frontend Não Está Gerando os Arquivos

**Sintoma:** Build do frontend não cria o `dist/`

**Solução:** Verifique se o build está sendo executado. Nos logs deve aparecer:
```
> vite build
vite v7.x.x building for production...
dist/index.html   X.XX kB
```

Se não aparecer, o problema pode ser:
- Variáveis `VITE_*` não estão disponíveis no build
- Precisa configurar como `build args` no docker-compose.yml

---

### Problema 3: Porta Não Está Correta

**Sintoma:** Container roda mas porta não responde

**Solução:** Verifique se:
- Frontend está na porta 8085 (interno)
- Backend está na porta 3001 (interno)
- EasyPanel mapeou as portas externas corretamente

---

### Problema 4: Container Morre Após Iniciar

**Sintoma:** Logs mostram container iniciando e depois `Exited`

**Solução:**
1. Veja os logs completos
2. Procure pela última mensagem antes de morrer
3. Pode ser:
   - Erro de conexão com banco de dados
   - Variável de ambiente faltando
   - Erro no código

---

## 🔧 Ações Imediatas

### Passo 1: Ver Logs

No EasyPanel:
1. Serviço `imoguru-fullstack`
2. Aba **"Logs"**
3. Procure por:
   - Mensagens de erro
   - `Exited`
   - Falhas de build

### Passo 2: Verificar Status dos Containers

No EasyPanel:
1. Aba **"Visão Geral"**
2. Verifique se mostra:
   - Frontend: Running ✅
   - Backend: Running ✅

Se mostrar `Stopped` ou `Error`, veja os logs.

### Passo 3: Verificar Variáveis

1. Aba **"Ambiente"**
2. Confirme que todas as variáveis estão salvas
3. Se não estiverem, adicione e faça redeploy

### Passo 4: Testar Portas Individualmente

Se o EasyPanel fornecer URLs específicas por serviço:
- Teste a URL do backend: `http://url-do-backend:3001/health`
- Deve retornar: `{"status":"ok",...}`

---

## 📋 Checklist de Verificação

- [ ] Logs verificados (sem erros críticos)
- [ ] Containers estão "Running" (não "Stopped" ou "Error")
- [ ] Variáveis de ambiente configuradas
- [ ] Build do frontend foi executado (`dist/` criado)
- [ ] Backend responde em `/health`
- [ ] Portas corretas (8085 frontend, 3001 backend)

---

## 🚨 Se Nada Funcionar

1. **Capture os logs completos** (últimas 50-100 linhas)
2. **Veja o status exato** dos containers
3. **Confirme as variáveis** estão todas configuradas

Envie essas informações para análise detalhada.

