# ✅ Como Configurar Variáveis de Ambiente no EasyPanel (Compose)

## ⚠️ Problema

Você está vendo warnings:
```
The "VITE_SUPABASE_URL" variable is not set. Defaulting to a blank string.
```

Isso significa que o docker-compose não está encontrando as variáveis.

---

## ✅ Solução: Use a Opção "Criar arquivo .env"

No EasyPanel, quando você usa **Compose**, a melhor forma é marcar **"Criar arquivo .env"**.

### Passo a Passo:

1. **No EasyPanel, serviço `imoguru-fullstack`:**
   - Vá na aba **"Ambiente"** (Environment)

2. **Marque a opção:**
   - ☑️ **"Criar arquivo .env"** ou **"Create .env file"**

3. **Adicione TODAS as variáveis no formato correto:**

   **Formato: Uma variável por linha, sem aspas no valor**
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

   **⚠️ IMPORTANTE:**
   - Sem espaços ao redor do `=`
   - Sem aspas nos valores (a menos que o valor tenha espaços)
   - Uma variável por linha

4. **Clique em "Salvar"** ou **"Save"**

5. **Faça Redeploy:**
   - Vá na aba **"Visão Geral"** ou **"Deployments"**
   - Clique em **"Implantar"** ou **"Redeploy"**

---

## 🔍 Como Verificar se Funcionou

Após o redeploy, verifique os logs:

1. Aba **"Logs"**
2. **NÃO deve aparecer mais** os warnings de variáveis não setadas
3. Deve aparecer:
   - Frontend: mensagens do `serve` rodando
   - Backend: `🚀 Server running on port 3001`

---

## 📝 Checklist Rápido

- [ ] Aba "Ambiente" aberta no serviço Compose
- [ ] Opção "Criar arquivo .env" está **MARCADA** ☑️
- [ ] Todas as 10 variáveis foram adicionadas
- [ ] Formato correto (sem aspas, sem espaços no `=`)
- [ ] Salvo com sucesso
- [ ] Redeploy executado
- [ ] Logs verificados (sem warnings)

---

## 🚨 Se Ainda Der Erro

**Formato Alternativo (se o EasyPanel aceitar JSON/YAML):**

```yaml
VITE_SUPABASE_URL: "https://jjeyaupzjkyuidrxdvso.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_C677OuylmWQm5SdGO0UqBw_dmMmQIBi"
```

Ou tente com aspas duplas no valor:
```
VITE_SUPABASE_URL="https://jjeyaupzjkyuidrxdvso.supabase.co"
```

**Mas o formato mais comum e que funciona é sem aspas!**

---

**Depois de configurar e fazer redeploy, os warnings devem desaparecer!** ✅

