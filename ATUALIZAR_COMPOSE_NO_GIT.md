# 🔄 Como Atualizar o docker-compose.yml no Git

## ⚠️ Importante

O EasyPanel **baixa o código do GitHub** toda vez que você faz deploy. Se você alterou o `docker-compose.yml` localmente, precisa fazer **commit e push** para o GitHub primeiro!

---

## 📋 Passo a Passo

### 1. Verificar o que mudou:

```bash
git status
```

Isso mostra quais arquivos foram modificados.

### 2. Adicionar o docker-compose.yml atualizado:

```bash
git add docker-compose.yml
```

Ou se você modificou outros arquivos também:

```bash
git add .
```

### 3. Fazer commit:

```bash
git commit -m "Atualizar docker-compose.yml - corrigir variáveis de ambiente e portas"
```

### 4. Fazer push para o GitHub:

```bash
git push origin main
```

### 5. No EasyPanel, fazer Redeploy:

Após o push:
1. Vá no serviço `imoguru-fullstack`
2. Clique em **"Implantar"** ou **"Redeploy"**
3. O EasyPanel vai baixar o código atualizado do GitHub
4. Vai usar o `docker-compose.yml` novo

---

## 🚀 Comandos Rápidos (Copiar e Colar)

Execute no Git Bash na pasta do projeto:

```bash
# Ver o que mudou
git status

# Adicionar o docker-compose.yml
git add docker-compose.yml

# Commit
git commit -m "Corrigir docker-compose.yml para EasyPanel"

# Push
git push origin main
```

---

## ⏱️ Ordem Correta de Trabalho

1. ✅ **Corrigir arquivos localmente** (você já fez)
2. ✅ **Commit e push no Git** (faça agora)
3. ✅ **Configurar variáveis no EasyPanel** (aba Ambiente, marcar "Criar arquivo .env")
4. ✅ **Fazer Redeploy no EasyPanel**

---

## 🎯 Resumo

**SIM, você precisa fazer git push antes de implantar!**

O EasyPanel clona o repositório do GitHub sempre que você faz deploy, então ele precisa da versão atualizada do `docker-compose.yml` no GitHub.

**Depois do push, no EasyPanel:**
- Configure as variáveis na aba "Ambiente" (marcando "Criar arquivo .env")
- Faça Redeploy
- O EasyPanel vai baixar o código atualizado automaticamente

---

**Execute os comandos acima e depois faça o redeploy no EasyPanel!** ✅

