# ❌ Erro: "path /backend not found" no EasyPanel

## 🔍 Problema

O EasyPanel está mostrando este erro:

```
unable to prepare context: path "/etc/easypanel/projects/imoguru-lite/imoguru-fullstack/code/backend" not found
```

Isso significa que quando o EasyPanel clona seu repositório Git, a pasta `backend` não está presente ou não está no caminho esperado.

---

## ✅ Solução Passo a Passo

### **Passo 1: Verificar se a pasta `backend` está no Git**

Execute no Git Bash:

```bash
# Ver se a pasta backend está rastreada pelo Git
git ls-files backend/ | head -5

# Se não aparecer nada, adicione a pasta backend
git add backend/
git commit -m "Adicionar pasta backend ao repositório"
git push origin main
```

### **Passo 2: Verificar o `.gitignore` do backend**

Certifique-se que o `backend/.gitignore` não está ignorando arquivos importantes:

```bash
# Ver o conteúdo do .gitignore do backend
cat backend/.gitignore
```

O `backend/.gitignore` deve ignorar apenas:
- `node_modules/`
- `.env`
- `*.log`
- `uploads/` (se você não quiser commitá-los)

**NÃO deve ignorar:**
- `package.json`
- `server.js`
- `Dockerfile`
- Arquivos `.js` em `routes/`, `config/`, `middleware/`

### **Passo 3: Verificar se o "Build Path" no EasyPanel está correto**

No EasyPanel:
1. Vá em **"Fonte"** (Source)
2. Verifique o campo **"Caminho de Build"** (Build Path)
3. Deve estar como: `/` (raiz do repositório)
4. **NÃO deve estar** como `/backend` ou algo diferente

### **Passo 4: Fazer Commit e Push de TUDO**

Certifique-se de que TODOS os arquivos necessários estão commitados:

```bash
# Adicionar TUDO que não está no .gitignore
git add .

# Ver o que vai ser commitado
git status

# Commit
git commit -m "Garantir que pasta backend esteja no repositório"

# Push
git push origin main
```

### **Passo 5: Fazer Redeploy no EasyPanel**

Após o push:
1. Vá no serviço `imoguru-fullstack`
2. Clique em **"Implantar"** ou **"Redeploy"**
3. O EasyPanel vai clonar o repositório atualizado

---

## 🔍 Checklist: Arquivos que DEVEM estar no Git

Certifique-se que estes arquivos estão commitados:

```
backend/
├── package.json          ✅ DEVE estar
├── package-lock.json     ✅ DEVE estar
├── server.js            ✅ DEVE estar
├── Dockerfile           ✅ DEVE estar
├── config/
│   └── database.js      ✅ DEVE estar
├── routes/               ✅ DEVE estar
│   ├── auth.js
│   ├── companies.js
│   └── ...
├── middleware/           ✅ DEVE estar
└── .gitignore           ✅ DEVE estar (para ignorar node_modules, .env, etc)
```

---

## 🚨 Se AINDA não funcionar

### Opção A: Verificar manualmente no GitHub

1. Acesse: `https://github.com/MarcoCamara/imoguru-lite`
2. Verifique se a pasta `backend/` aparece na lista de arquivos
3. Clique na pasta e veja se os arquivos estão lá

### Opção B: Verificar o Build Path no EasyPanel

No EasyPanel, aba **"Fonte"**:
- **URL do Repositório**: `https://github.com/MarcoCamara/imoguru-lite.git`
- **Ramo**: `main`
- **Caminho de Build**: `/` ← **MUST BE ROOT!**
- **Arquivo Docker Compose**: `docker-compose.yml`

### Opção C: Limpar cache do EasyPanel (se disponível)

Às vezes o EasyPanel faz cache do repositório. Tente:
1. Deletar o serviço
2. Criar um novo serviço
3. Configurar tudo novamente

---

## 📝 Comandos Rápidos para Garantir Tudo Está Commitado

Execute no Git Bash:

```bash
# 1. Verificar o que não está commitado
git status

# 2. Adicionar TUDO (respeitando .gitignore)
git add .

# 3. Ver o que vai ser commitado
git status

# 4. Commit
git commit -m "Garantir estrutura completa do projeto no Git"

# 5. Push
git push origin main
```

---

**Depois de fazer isso, faça o Redeploy no EasyPanel e o erro deve desaparecer!** ✅

