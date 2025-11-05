# 🚀 Deploy da API api-ai-status

## ✅ Status
A função `api-ai-status` foi **corrigida** e está pronta para deploy.

## 📋 Opções de Deploy

### **Opção 1: Via Supabase Dashboard (RECOMENDADO - Mais Fácil)**

1. **Acesse o Dashboard:**
   - URL: https://supabase.com/dashboard/project/jjeyaupzjkyuidrxdvso
   - Faça login na sua conta Supabase

2. **Navegue até Edge Functions:**
   - No menu lateral, clique em **"Edge Functions"**
   - Ou acesse diretamente: https://supabase.com/dashboard/project/jjeyaupzjkyuidrxdvso/functions

3. **Faça o Deploy:**
   - Se a função já existe, clique em **"Edit"** ou **"Update"**
   - Se não existe, clique em **"Create a new function"**
   - Nome: `api-ai-status`
   - Cole o conteúdo do arquivo: `supabase/functions/api-ai-status/index.ts`
   - Clique em **"Deploy"**

### **Opção 2: Via CLI (Se Docker estiver rodando)**

1. **Inicie o Docker Desktop:**
   - Certifique-se de que o Docker Desktop está rodando

2. **Execute o deploy:**
   ```bash
   supabase functions deploy api-ai-status --project-ref jjeyaupzjkyuidrxdvso
   ```

3. **Se houver erro de .env.local:**
   ```bash
   # Renomeie temporariamente
   ren .env.local .env.local.backup
   
   # Faça o deploy
   supabase functions deploy api-ai-status --project-ref jjeyaupzjkyuidrxdvso
   
   # Restaure o arquivo
   ren .env.local.backup .env.local
   ```

### **Opção 3: Via Supabase CLI (Sem Docker - usando build remoto)**

Se o Supabase CLI suportar:
```bash
supabase functions deploy api-ai-status --project-ref jjeyaupzjkyuidrxdvso --no-verify-jwt
```

---

## 📝 Arquivo a Deployar

**Localização:** `supabase/functions/api-ai-status/index.ts`

**Conteúdo do arquivo está pronto e corrigido!**

---

## ✅ Verificação Pós-Deploy

Após o deploy, teste a API:

```bash
curl -X POST https://jjeyaupzjkyuidrxdvso.supabase.co/functions/v1/api-ai-status \
  -H "x-api-key: SUA_API_KEY_AQUI" \
  -H "Content-Type: application/json"
```

**Resposta esperada:**
```json
{
  "success": true,
  "ai_enabled": true
}
```

---

## 🔧 Correções Aplicadas

A função foi corrigida para seguir o mesmo padrão das outras APIs que funcionam:

1. ✅ Imports padronizados (`serve` do deno.land/std)
2. ✅ CORS headers completos (inclui `x-api-key`)
3. ✅ Validação de API key na query (filtra `api_type` e `archived`)
4. ✅ Estrutura alinhada com `api-properties` e `api-contact-requests`
5. ✅ Código duplicado removido
6. ✅ Nomes de variáveis consistentes

---

**Recomendação:** Use a **Opção 1 (Dashboard)** que é mais simples e não requer Docker.

