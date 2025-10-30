# 🔧 Como Configurar Variáveis de Ambiente no EasyPanel (Compose)

## ⚠️ Problema Comum

Você pode ver erros como:
```
"The \"VITE_SUPABASE_URL\" variable is not set. Defaulting to a blank string."
```

Isso significa que as variáveis de ambiente não foram configuradas no serviço.

---

## ✅ Solução Passo a Passo

### 1. Acesse o Serviço Compose

1. No EasyPanel, entre no seu projeto `imoguru-lite`
2. Clique na aba **"Serviços"**
3. Clique no serviço **"imoguru-fullstack"** (ou o nome que você deu)

### 2. Encontre a Seção de Variáveis de Ambiente

Procure por uma das opções abaixo (pode variar conforme a versão do EasyPanel):
- **"Environment Variables"** ou **"Variáveis de Ambiente"**
- **"Env"** ou **"Environment"**
- **"Settings" > "Environment"**
- **"Config" > "Environment Variables"**

### 3. Cole TODAS as Variáveis

Cole o bloco completo gerado pelo `setup.sh`:

```env
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
CORS_ORIGIN=https://imoguru-lite-imoguru-frontend.9m3hab.easypanel.host
```

### 4. Formato no EasyPanel

O EasyPanel pode aceitar variáveis em dois formatos:

**Formato 1: Key=Value (linha por linha)**
```
VITE_SUPABASE_URL=https://jjeyaupzjkyuidrxdvso.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_C677OuylmWQm5SdGO0UqBw_dmMmQIBi
DB_HOST=db.jjeyaupzjkyuidrxdvso.supabase.co
...
```

**Formato 2: JSON ou YAML**
```yaml
VITE_SUPABASE_URL: "https://jjeyaupzjkyuidrxdvso.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_C677OuylmWQm5SdGO0UqBw_dmMmQIBi"
DB_HOST: "db.jjeyaupzjkyuidrxdvso.supabase.co"
...
```

### 5. Salvar e Redeployar

1. **Salve** as variáveis (botão "Save", "Salvar", ou "Apply")
2. Vá para a aba **"Deploy"** ou procure por **"Redeploy"**
3. Clique em **"Redeploy"** ou **"Deploy"**
4. Aguarde o build e start dos containers

### 6. Verificar Logs

Após o redeploy, verifique os logs:
- Vá na aba **"Logs"**
- Procure por mensagens de sucesso:
  - `🚀 Server running on port 3001` (backend)
  - Mensagens do `serve` rodando na porta 8085 (frontend)
- **NÃO** deve aparecer mais os warnings de variáveis não setadas

---

## 🔍 Se Ainda Der Erro

### Verifique:

1. **As variáveis foram salvas?**
   - Volte na seção de Environment Variables e confirme que estão lá

2. **Formato correto?**
   - Use `VARIABLE_NAME=valor` (sem espaços ao redor do `=`)
   - Sem aspas a menos que o EasyPanel exija

3. **Redeploy feito?**
   - Variáveis só são aplicadas após redeploy

4. **Docker Compose lendo as variáveis?**
   - Confirme que o `docker-compose.yml` usa `${VARIABLE_NAME}` e não valores hardcoded

---

## 📝 Checklist Rápido

- [ ] Variáveis configuradas no serviço Compose (não só no projeto)
- [ ] Todas as variáveis necessárias foram adicionadas
- [ ] Variáveis salvas com sucesso
- [ ] Redeploy executado após salvar
- [ ] Logs verificados (sem warnings de variáveis)
- [ ] Frontend acessível na porta 8085
- [ ] Backend respondendo em `/health` na porta 3001

---

## 🚨 Importante

**As variáveis devem ser configuradas no SERVIÇO, não apenas no PROJETO.**

Se você configurou no nível do projeto mas não no serviço Compose, elas não serão passadas para os containers.

---

**Pronto!** Depois de configurar as variáveis e fazer o redeploy, o erro deve desaparecer.

