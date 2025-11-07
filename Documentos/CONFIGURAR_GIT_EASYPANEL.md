# 📦 Como Configurar Git no EasyPanel (Passo a Passo)

## ⚠️ IMPORTANTE: Você Precisa Criar o Repositório Git Primeiro!

Antes de preencher os campos no EasyPanel, você precisa:

1. **Criar um repositório no GitHub/GitLab/Bitbucket**
2. **Fazer push do seu código para esse repositório**
3. **Depois configurar no EasyPanel**

---

## 🚀 Passo 1: Criar Repositório e Fazer Push

### Opção A: GitHub (Recomendado - Gratuito)

1. **Acesse:** https://github.com e faça login
2. **Clique em "New repository"** ou **"+" > "New repository"**
3. **Configure:**
   - Nome: `imoguru-lite` (ou o que preferir)
   - Público ou Privado (você escolhe)
   - **NÃO** marque "Initialize with README"
4. **Clique em "Create repository"**

5. **No seu PC, na pasta do projeto, execute:**

```bash
# Se ainda não é um repositório Git
git init

# Adicionar todos os arquivos (exceto os no .gitignore)
git add .

# Fazer commit inicial
git commit -m "Initial commit - ImoGuru LITE"

# Conectar com o repositório remoto (substitua SEU-USUARIO pelo seu usuário do GitHub)
git remote add origin https://github.com/SEU-USUARIO/imoguru-lite.git

# Fazer push
git branch -M main
git push -u origin main
```

**⚠️ Se pedir autenticação:** Use um Personal Access Token do GitHub (não sua senha).

---

### Opção B: GitLab (Alternativa)

1. Acesse: https://gitlab.com
2. Crie novo projeto
3. Siga os mesmos comandos acima, mudando a URL para `https://gitlab.com/SEU-USUARIO/imoguru-lite.git`

---

## ✅ Passo 2: Preencher Campos no EasyPanel

Agora que seu código está no Git, volte ao EasyPanel:

### **Na tela "Fonte" (Source):**

1. **Clique no botão "Git"** (em vez de "docker-compose.yml")

2. **Preencha os campos:**

   **📋 URL do Repositório:**
   ```
   https://github.com/SEU-USUARIO/imoguru-lite.git
   ```
   Ou se for privado e usar SSH:
   ```
   git@github.com:SEU-USUARIO/imoguru-lite.git
   ```

   **🌿 Ramo:**
   ```
   main
   ```
   (ou `master` se seu repositório usar esse nome)

   **📁 Caminho de Build:**
   ```
   /
   ```
   (já está preenchido - deixe assim, significa raiz do projeto)

   **🐳 Arquivo Docker Compose:**
   ```
   docker-compose.yml
   ```
   (já está preenchido - deixe assim)

3. **Se for repositório PRIVADO:**
   - Clique em **"Gerar Chave SSH"**
   - Copie a chave gerada
   - No GitHub/GitLab, vá em Settings > SSH Keys (do repositório ou da sua conta)
   - Adicione a chave SSH pública

4. **Clique em "Salvar"** (botão verde)

---

## 🔄 Passo 3: Fazer Deploy

Após salvar:

1. **Volte para a aba "Visão Geral"** ou **"Implantações"**
2. **Clique em "Implantar"** (botão verde)
3. **Acompanhe os logs:**
   - O EasyPanel vai clonar o repositório
   - Fazer build usando o docker-compose.yml
   - Iniciar os containers

---

## 🆘 Alternativa: Upload Manual (Se Não Quiser Usar Git)

Se preferir não usar Git, você pode:

1. **Acessar o VPS via SSH**
2. **Copiar o ZIP para o servidor:**
   ```bash
   scp imoguru-deploy.zip usuario@82.25.76.203:/caminho/destino/
   ```
3. **No VPS, descompactar:**
   ```bash
   unzip imoguru-deploy.zip -d /caminho/do/easypanel/projects/imoguru-lite/imoguru-fullstack/code/
   ```
4. **Voltar ao EasyPanel e fazer deploy**

**Mas o método Git é mais profissional e facilita atualizações futuras!**

---

## 📝 Resumo dos Campos:

| Campo | Valor Exemplo |
|-------|---------------|
| **URL do Repositório** | `https://github.com/SEU-USUARIO/imoguru-lite.git` |
| **Ramo** | `main` |
| **Caminho de Build** | `/` |
| **Arquivo Docker Compose** | `docker-compose.yml` |

---

## ✅ Checklist:

- [ ] Repositório Git criado (GitHub/GitLab)
- [ ] Código enviado para o Git (push feito)
- [ ] Campos preenchidos no EasyPanel
- [ ] Chave SSH configurada (se repositório privado)
- [ ] Clicado em "Salvar"
- [ ] Deploy iniciado

**Pronto!** Seu código será baixado do Git e o deploy será feito automaticamente.

