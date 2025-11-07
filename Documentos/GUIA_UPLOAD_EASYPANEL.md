# Guia Detalhado: Upload no EasyPanel

## 📦 Passo 1: Preparar o Arquivo ZIP

### ✅ O que INCLUIR no ZIP:

```
✅ INCLUIR:
├── src/                    (todo o código-fonte do frontend)
├── backend/                (todo o código do backend)
├── supabase/               (migrations, functions)
├── public/                 (arquivos estáticos)
├── package.json            (dependências do frontend)
├── backend/package.json     (dependências do backend)
├── vite.config.ts          (configuração do Vite)
├── Dockerfile              (se usar Dockerfile no EasyPanel)
├── docker-compose.yml      (se usar compose)
├── tsconfig.json           (configuração TypeScript)
├── tailwind.config.js      (se usar Tailwind)
├── postcss.config.js       (se usar PostCSS)
├── setup.sh                (script de setup)
├── deploy.env              (template de variáveis - SEM senhas reais se compartilhar)
├── README.md               (documentação)
├── INSTRUCOES_DEPLOY.md    (este guia)
└── .gitignore              (para o EasyPanel saber o que ignorar)
```

### ❌ O que NÃO incluir no ZIP:

```
❌ NÃO INCLUIR:
├── node_modules/           (MUITO pesado, será instalado pelo Docker)
├── dist/                   (será gerado durante o build)
├── .env                    (contém credenciais locais)
├── .env.local              (contém credenciais locais)
├── backend/.env            (contém credenciais locais)
├── .vscode/                (configurações do editor)
├── .idea/                  (configurações do IntelliJ)
├── *.log                   (arquivos de log)
├── .DS_Store               (arquivos do macOS)
└── *.swp, *.swo            (arquivos temporários do Vim)
```

### 🪟 Como criar o ZIP no Windows:

**Método 1: Pelo Explorador de Arquivos**
1. Abra a pasta do projeto (`rose-realstate`)
2. Pressione `Ctrl + A` para selecionar tudo
3. Pressione `Ctrl` e clique em `node_modules` e `dist` para desmarcá-los (se existirem)
4. Clique com botão direito > **Enviar para** > **Pasta compactada (ZIP)**
5. Nomeie como `imoguru-deploy.zip`

**Método 2: Pelo PowerShell (se preferir linha de comando)**
```powershell
# Navegue até a pasta do projeto
cd "C:\Users\marco\Documents\33 - Imoguru\LITE\rose-realstate"

# Crie o ZIP excluindo node_modules e dist
Compress-Archive -Path * -DestinationPath imoguru-deploy.zip -Exclude node_modules,dist,.env,.env.local
```

---

## ☁️ Passo 2: Criar Serviço no EasyPanel

### 🎯 Qual Serviço Criar?

Você tem **3 opções** dependendo de como quer organizar:

---

### **Opção A: Compose (Recomendado para começar rápido)** ⭐

**Melhor para:** Deploy completo de uma vez (frontend + backend juntos)

1. **No EasyPanel, dentro do seu projeto `imoguru-lite`:**
   - Clique na aba **"Serviços"** (se não estiver já)
   - Clique em **"+ Serviço"**

2. **Escolha o modelo:**
   - Selecione **"Compose"** (tem tag BETA verde)
   - Isso permite usar seu `docker-compose.yml`

3. **Configurar o Compose:**
   - **Nome do serviço:** `imoguru-fullstack` (ou o que preferir)
   - **Método de deploy:**
     - **Opção 1:** Se tiver o ZIP pronto, há uma opção de upload
     - **Opção 2:** Conecte com Git (se o código estiver no GitHub/GitLab)
     - **Opção 3:** Faça upload manual via SSH/SCP depois

4. **Se usar ZIP:**
   - Procure pela opção **"Upload"** ou **"File"** dentro do serviço Compose
   - Faça upload do `imoguru-deploy.zip`
   - O EasyPanel detectará automaticamente o `docker-compose.yml`

5. **Vantagens:**
   - ✅ Frontend e backend sobem juntos
   - ✅ Facilita comunicação entre serviços
   - ✅ Uma única configuração de variáveis

---

### **Opção B: Aplicativo (2 serviços separados)** 🔧

**Melhor para:** Controle individual de cada serviço, escalabilidade

**FRONTEND:**
1. Clique em **"+ Serviço"** > Escolha **"Aplicativo"**
2. Configure:
   - **Nome:** `imoguru-frontend`
   - **Build Method:** 
     - Se tiver Git: **"Git Repository"**
     - Ou: **"Dockerfile"** (aponta para o Dockerfile na raiz)
   - **Build Context:** `/` (raiz do projeto)
   - **Dockerfile:** `Dockerfile` (na raiz)
3. **Variáveis de ambiente** (só do frontend):
   ```
   VITE_SUPABASE_URL=https://jjeyaupzjkyuidrxdvso.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_C677OuylmWQm5SdGO0UqBw_dmMmQIBi
   ```
4. **Porta:** `8085`

**BACKEND:**
1. Clique em **"+ Serviço"** novamente > Escolha **"Aplicativo"**
2. Configure:
   - **Nome:** `imoguru-backend`
   - **Build Method:** **"Dockerfile"**
   - **Build Context:** `/backend`
   - **Dockerfile:** `Dockerfile` (dentro de backend/)
3. **Variáveis de ambiente** (só do backend):
   ```
   DB_HOST=db.jjeyaupzjkyuidrxdvso.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=sua_senha_aqui
   JWT_SECRET=CLSmdoCyfqRXgLYL8AWIjueAQpZ5H01x
   BOOTSTRAP_SECRET=MgzCd0CXmju3k7bBEx154b1uFM39d3xE
   RESEND_API_KEY=re_NXxH8Y1i_4Wqe4ezRZ1ifceoa7R4LTFtU
   CORS_ORIGIN=https://imoguru-lite-imoguru-frontend.9m3hab.easypanel.host
   ```
4. **Porta:** `3001`

**Vantagens:**
- ✅ Controle individual de cada serviço
- ✅ Escala independentemente
- ✅ Logs separados
- ✅ Reinicia um sem afetar o outro

---

### **Opção C: Upload via Git (Mais profissional)** 🚀

**Melhor para:** CI/CD automático, atualizações frequentes

1. **Configure seu repositório Git** (GitHub/GitLab)
2. No EasyPanel, crie serviço **"Aplicativo"** ou **"Compose"**
3. Escolha **"Git Repository"** como método de build
4. Conecte com seu Git
5. Configure branch e caminho do Dockerfile
6. O EasyPanel fará build e deploy automático a cada push

---

## 🎯 **Recomendação para você:**

**Comece com Opção A (Compose)** se:
- Quer deploy rápido e simples
- Frontend e backend ficam no mesmo servidor
- Não precisa escalar separadamente

**Use Opção B (2 Aplicativos)** se:
- Quer mais controle
- Planeja escalar frontend e backend independentemente
- Quer logs e monitoramento separados

---

## 🔧 Passo 3: Configurar Variáveis de Ambiente

### No EasyPanel, encontre a seção "Environment Variables"

1. **Se usar docker-compose:**
   - Cole TODAS as variáveis geradas pelo `setup.sh` em um único lugar

2. **Se usar apps separados:**

   **📱 App FRONTEND - Cole apenas:**
   ```
   VITE_SUPABASE_URL=https://jjeyaupzjkyuidrxdvso.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_C677OuylmWQm5SdGO0UqBw_dmMmQIBi
   ```

   **⚙️ App BACKEND - Cole:**
   ```
   DB_HOST=db.jjeyaupzjkyuidrxdvso.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=sua_senha_aqui
   JWT_SECRET=CLSmdoCyfqRXgLYL8AWIjueAQpZ5H01x
   BOOTSTRAP_SECRET=MgzCd0CXmju3k7bBEx154b1uFM39d3xE
   RESEND_API_KEY=re_NXxH8Y1i_4Wqe4ezRZ1ifceoa7R4LTFtU
   CORS_ORIGIN=https://imoguru-lite-imoguru-frontend.9m3hab.easypanel.host
   ```

3. **Salvar as variáveis**
   - Clique em **"Save"** ou **"Salvar"**
   - As variáveis serão aplicadas quando você fizer o deploy

---

## 🚀 Passo 4: Fazer o Deploy

1. **Iniciar o Deploy**
   - Clique no botão **"Deploy"** ou **"Redeploy"**
   - Ou, se for a primeira vez, clique em **"Start"**

2. **Acompanhar os Logs**
   - Abra a aba **"Logs"** no EasyPanel
   - Você verá:
     - Build das imagens Docker
     - Instalação de dependências (`npm install`)
     - Compilação do frontend (`npm run build`)
     - Inicialização dos serviços

3. **Verificar Status**
   - Procure por status **"Running"** (verde) nos serviços
   - Frontend deve estar na porta **8085**
   - Backend deve estar na porta **3001**

4. **Testar Acesso**
   - O EasyPanel fornecerá uma URL temporária (ex: `https://seu-projeto-xxx.easypanel.host`)
   - Ou use seu domínio configurado
   - Frontend: `http://sua-url:8085`
   - Backend health: `http://sua-url:3001/health`

---

## ⚠️ Solução de Problemas Comuns

### ❌ Erro: "Build failed"
- **Causa:** Dependências não instaladas ou erro de compilação
- **Solução:** Verifique os logs, confira se todas as dependências estão no `package.json`

### ❌ Erro: "502 Bad Gateway"
- **Causa:** Container não iniciou corretamente ou porta incorreta
- **Solução:** Verifique os logs, confirme que a porta no Dockerfile está correta (8085 para frontend)

### ❌ Erro: "Environment variable not found"
- **Causa:** Variáveis de ambiente não foram configuradas
- **Solução:** Volte na seção de Environment Variables e verifique se todas foram salvas

### ❌ Frontend não carrega CSS/imagens
- **Causa:** Base path incorreto no `vite.config.ts`
- **Solução:** Já está corrigido no projeto (`base: '/'` em produção)

---

## ✅ Checklist Final

Antes de considerar o deploy completo, verifique:

- [ ] ZIP criado sem `node_modules` e `dist`
- [ ] Upload feito com sucesso no EasyPanel
- [ ] Variáveis de ambiente configuradas corretamente
- [ ] Deploy executado sem erros
- [ ] Ambos os serviços (frontend e backend) estão "Running"
- [ ] Frontend acessível na porta 8085
- [ ] Backend respondendo em `/health` na porta 3001
- [ ] Sem erros CORS no console do navegador
- [ ] Login funcionando corretamente

---

**Pronto! Seu sistema estará rodando em produção.** 🎉

