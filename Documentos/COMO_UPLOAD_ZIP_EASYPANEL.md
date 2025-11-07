# 📦 Como e Onde Fazer Upload do ZIP no EasyPanel (Serviço Compose)

## 🎯 Quando Fazer o Upload

**AGORA é o momento!** Você precisa fazer upload do ZIP para que o EasyPanel tenha o código do projeto e possa fazer o build.

---

## 📍 Onde Fazer o Upload

### Dentro do Serviço Compose no EasyPanel:

1. **Acesse o EasyPanel**
   - Entre no projeto `imoguru-lite`
   - Clique na aba **"Serviços"**
   - Clique no serviço **"imoguru-fullstack"** (ou o nome que você deu)

2. **Procure por uma das opções abaixo:**
   - Aba **"Code"** ou **"Código"**
   - Aba **"Source"** ou **"Origem"**
   - Aba **"Build"** ou **"Construção"**
   - Seção **"Upload Code"** ou **"Enviar Código"**
   - Botão **"Upload"** ou **"Choose File"**
   - Opção **"From ZIP"** ou **"Upload ZIP"**

3. **Se não encontrar a opção de upload diretamente:**
   - Procure por **"Deploy Method"** ou **"Método de Deploy"**
   - Pode ter opções como:
     - **"Git Repository"** (para Git)
     - **"Upload File"** ou **"Upload ZIP"**
     - **"Local Files"**
     - **"From Archive"**

4. **Alternativa: Via Git (se preferir):**
   - Se você tem o código no GitHub/GitLab
   - Escolha **"Git Repository"**
   - Conecte seu repositório
   - Configure branch (ex: `main` ou `master`)

---

## 📋 Passo a Passo Detalhado

### Método 1: Upload Direto do ZIP

1. **No serviço Compose (`imoguru-fullstack`), procure:**
   ```
   [Serviço Compose] > [Aba Code/Source] > [Upload ZIP ou Choose File]
   ```

2. **Selecione o arquivo:**
   - Clique em **"Choose File"** ou **"Selecionar Arquivo"**
   - Selecione `imoguru-deploy.zip` (que você criou com o script)

3. **Faça upload:**
   - Clique em **"Upload"** ou **"Enviar"**
   - Aguarde o EasyPanel descompactar

4. **Após o upload:**
   - O EasyPanel deve detectar o `docker-compose.yml`
   - As variáveis de ambiente já configuradas serão aplicadas
   - Você pode fazer o deploy

### Método 2: Via SSH/SCP (Avançado)

Se o EasyPanel não tiver opção de upload direto:

1. **Acesse seu VPS via SSH**
2. **Copie o ZIP para o servidor:**
   ```bash
   # No seu PC (usando SCP ou WinSCP)
   scp imoguru-deploy.zip usuario@seu-vps:/caminho/destino/
   ```

3. **No EasyPanel:**
   - Configure o caminho onde o ZIP está
   - Ou descompacte manualmente e aponte o EasyPanel para a pasta

### Método 3: Via Git (Mais Profissional)

Se você preferir usar Git:

1. **Crie um repositório** (GitHub/GitLab/Bitbucket)
2. **Faça push do código:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/seu-usuario/imoguru.git
   git push -u origin main
   ```

3. **No EasyPanel:**
   - Escolha **"Git Repository"** como método de deploy
   - Conecte com seu Git
   - Configure branch e caminho

---

## 🔍 Como Encontrar a Opção de Upload

### Dentro do Serviço Compose, procure por:

- **Menu lateral/esquerdo:**
  - Code
  - Source
  - Build
  - Files
  - Upload

- **Aba superior:**
  - Code
  - Settings
  - Deploy
  - Logs

- **Botões na página:**
  - "Upload Code"
  - "Choose File"
  - "Select ZIP"
  - "Import Code"

- **Configurações do serviço:**
  - "Deploy Method" > "Upload ZIP"
  - "Source Type" > "File Upload"

---

## ✅ Checklist: O que Você Precisa Ter

Antes de fazer upload:

- [ ] ZIP criado (`imoguru-deploy.zip`)
- [ ] ZIP não contém `node_modules/` ou `dist/`
- [ ] ZIP contém `docker-compose.yml`
- [ ] Variáveis de ambiente já configuradas no serviço Compose
- [ ] Serviço Compose criado no EasyPanel

---

## 🚀 Após o Upload

1. **Verifique que o EasyPanel detectou:**
   - O `docker-compose.yml` aparece na interface
   - Os serviços `frontend` e `backend` são listados

2. **Confirme as variáveis:**
   - Volte em "Environment Variables" e confirme que estão todas lá

3. **Faça o Deploy:**
   - Clique em **"Deploy"** ou **"Redeploy"**
   - Acompanhe os logs na aba "Logs"

4. **Aguarde o build:**
   - O EasyPanel vai instalar dependências (`npm install`)
   - Compilar o frontend (`npm run build`)
   - Iniciar os containers

---

## 💡 Dica

Se você **NÃO encontrar** a opção de upload no serviço Compose:

- O EasyPanel pode estar esperando que você conecte via Git
- Ou pode ter uma opção de "Import" ou "Upload" na criação do serviço
- Nesse caso, você pode precisar **recriar o serviço** escolhendo "Upload" na criação

**Me avise se encontrou a opção ou se precisa de mais ajuda para localizar!**

