# 🔍 Análise Completa de Deploy em VPS - Problemas Identificados

## 📋 RESUMO EXECUTIVO

Esta análise identifica **problemas críticos** e **recomendações** para o deploy do projeto `rose-realstate` em VPS. O projeto usa:
- **Frontend**: React + Vite (porta 80 no Docker, 8085 em dev)
- **Backend**: Node.js/Express (porta 3001 interna, 8080 externa no Docker)
- **Banco**: Supabase (PostgreSQL gerenciado)
- **Containerização**: Docker Compose

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **CONFLITO DE PORTAS - CRÍTICO** ⚠️

#### Problema:
- **docker-compose.yml** mapeia frontend para porta **80** (linha 52)
- Porta 80 é **privilegiada** e pode estar em uso no VPS (nginx, apache, outros serviços)
- Backend mapeia para porta **8080** (linha 17), que também pode conflitar

#### Impacto:
- ❌ Container não iniciará se porta 80 estiver ocupada
- ❌ Erro 502 Bad Gateway se proxy reverso estiver configurado incorretamente
- ❌ Conflito com serviços web existentes

#### Solução Recomendada:
```yaml
# Frontend: usar porta não-privilegiada (ex: 3000, 8085)
ports:
  - "3000:80"  # ou "8085:80"

# Backend: verificar se 8080 está livre ou usar outra
ports:
  - "3001:3001"  # ou manter "8080:3001" se disponível
```

---

### 2. **DUPLICAÇÃO DE VARIÁVEL PORT NO SERVER.JS** ⚠️

#### Problema:
No arquivo `backend/server.js`:
- **Linha 18**: `const PORT = process.env.PORT || 3001;`
- **Linha 66**: `const PORT = process.env.PORT || 3001;` (duplicado!)

#### Impacto:
- ⚠️ Código redundante (não quebra, mas é confuso)
- ⚠️ Pode causar problemas se houver lógica entre as duas declarações

#### Solução:
Remover a declaração duplicada na linha 66.

---

### 3. **INCONSISTÊNCIA DE CONFIGURAÇÃO DE PORTAS** ⚠️

#### Problema:
- **package.json** (dev): frontend roda em porta **8085** (linha 10)
- **docker-compose.yml**: frontend expõe porta **80** (linha 52)
- **Dockerfile**: frontend serve na porta **80** (linha 46)
- **INSTRUCOES_DEPLOY.md**: menciona porta **8085** para frontend

#### Impacto:
- ❌ Confusão na configuração
- ❌ Documentação desatualizada
- ⚠️ Dificulta troubleshooting

#### Solução:
Padronizar documentação para refletir que:
- **Desenvolvimento**: porta 8085
- **Produção (Docker)**: porta 80 interna (mapeada externamente conforme necessário)

---

### 4. **VARIÁVEIS DE AMBIENTE NO FRONTEND (BUILD TIME vs RUNTIME)** 🔴 CRÍTICO

#### Problema:
- **Vite** embute variáveis `VITE_*` no **build time** (não em runtime)
- **Dockerfile** não recebe build args para `VITE_API_URL`
- **docker-compose.yml** não passa build args para o frontend

#### Impacto:
- ❌ **ERRO 502** provável: frontend não consegue conectar ao backend
- ❌ URLs hardcoded no build podem estar incorretas
- ❌ Impossível alterar URLs sem rebuild completo

#### Código Problemático:
```dockerfile
# Dockerfile (linha 19)
RUN npm run build
# ❌ Não recebe VITE_API_URL como build arg!
```

#### Solução Necessária:
```dockerfile
# Adicionar build args
ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

RUN npm run build
```

E no `docker-compose.yml`:
```yaml
rose-frontend:
  build:
    context: .
    dockerfile: Dockerfile
    args:
      VITE_API_URL: ${VITE_API_URL}
      VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}
      VITE_SUPABASE_PUBLISHABLE_KEY: ${VITE_SUPABASE_PUBLISHABLE_KEY}
```

---

### 5. **CORS CONFIGURADO INCORRETAMENTE PARA VPS** ⚠️

#### Problema:
- **deploy.env** (linha 36): `CORS_ORIGIN=https://imoguru-lite-imoguru-fullstack.9m3hab.easypanel.host`
- URL hardcoded do EasyPanel (não será válida em VPS customizado)

#### Impacto:
- ❌ Requisições do frontend serão bloqueadas por CORS
- ❌ Erros 403/401 em chamadas de API

#### Solução:
Configurar `CORS_ORIGIN` no VPS com o domínio real do frontend:
```env
CORS_ORIGIN=https://seudominio.com
# ou para múltiplos domínios:
CORS_ORIGIN=https://seudominio.com,https://www.seudominio.com
```

---

### 6. **PROXY DO VITE NÃO FUNCIONA EM PRODUÇÃO** ⚠️

#### Problema:
**vite.config.ts** (linhas 6-13) tem proxy configurado:
```typescript
server: {
  proxy: {
    '/api': {
      target: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000',
      // ...
    }
  }
}
```

#### Impacto:
- ⚠️ Proxy do Vite **só funciona em desenvolvimento** (`npm run dev`)
- ⚠️ Em produção (build estático), o proxy não existe
- ⚠️ Frontend precisa acessar backend diretamente via `VITE_API_URL`

#### Status:
✅ **OK** - O código usa `api.ts` que aponta para `VITE_API_URL`, então está correto. Mas a porta padrão no proxy (`8000`) está errada (deveria ser `8080` ou `3001`).

---

### 7. **DOCKER COMPOSE SEM VERSION TAG** ⚠️

#### Problema:
**docker-compose.yml** (linha 1):
```yaml
#version: "3.9"  # ❌ Comentado!
```

#### Impacto:
- ⚠️ Docker Compose pode usar versão padrão (pode não ser a esperada)
- ⚠️ Algumas features podem não funcionar

#### Solução:
```yaml
version: "3.9"  # Descomentar
```

---

### 8. **HEALTHCHECK PODE FALHAR** ⚠️

#### Problema:
**docker-compose.yml** (linha 31):
```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -q --spider http://localhost:3001/health || exit 1"]
```

#### Impacto:
- ❌ Se `wget` não estiver instalado no container Alpine, healthcheck falhará
- ❌ Container pode ser reiniciado continuamente

#### Solução:
Verificar se `wget` está no Dockerfile do backend, ou usar `curl`:
```yaml
test: ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"]
```

---

### 9. **FALTA DE NETWORKING CONFIGURADO ENTRE CONTAINERS** ⚠️

#### Problema:
- Frontend precisa acessar backend via URL externa (`VITE_API_URL`)
- Não usa nome do serviço Docker (`rose-backend:3001`)

#### Impacto:
- ⚠️ Se backend estiver apenas na rede interna, frontend não acessa
- ⚠️ Dependência de URL externa (mais lento, menos seguro)

#### Solução (Opcional):
Se frontend e backend ficarem na mesma rede Docker, pode usar:
```typescript
// Em desenvolvimento Docker: usar nome do serviço
const BACKEND_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://rose-backend:3001' : 'http://localhost:8080');
```

---

### 10. **DEPLOY.ENV COM CREDENCIAIS EXPOSTAS** 🔴 CRÍTICO

#### Problema:
**deploy.env** contém:
- Senhas de banco de dados
- JWT secrets
- API keys do Resend

#### Impacto:
- ❌ **RISCO DE SEGURANÇA CRÍTICO** se commitado no Git
- ❌ Credenciais expostas publicamente

#### Solução:
1. ✅ Adicionar `deploy.env` ao `.gitignore`
2. ✅ Criar `deploy.env.example` com placeholders
3. ✅ Usar variáveis de ambiente do VPS (não arquivo)

---

## ⚙️ CONFIGURAÇÕES QUE PODEM CAUSAR ERRO 502

### Cenários de Erro 502:

1. **Frontend não encontra backend**:
   - `VITE_API_URL` incorreto ou não definido no build
   - Backend não está rodando
   - Porta do backend bloqueada por firewall

2. **Proxy reverso mal configurado**:
   - Nginx/Apache não roteia corretamente
   - Backend não responde na porta esperada

3. **Healthcheck falhando**:
   - Backend não tem endpoint `/health` funcionando
   - Container sendo reiniciado continuamente

4. **CORS bloqueando requisições**:
   - `CORS_ORIGIN` não corresponde ao domínio do frontend

---

## 📝 CHECKLIST PRÉ-DEPLOY

### ✅ Verificações Obrigatórias:

- [ ] **Portas livres no VPS**: Verificar se 80, 8080, 3001 estão disponíveis
- [ ] **Variáveis de ambiente**: Todas configuradas corretamente
- [ ] **Build args no Dockerfile**: Frontend recebe `VITE_*` no build
- [ ] **CORS_ORIGIN**: Aponta para domínio real do frontend
- [ ] **Firewall**: Portas necessárias liberadas
- [ ] **Healthcheck**: Endpoint `/health` funcionando
- [ ] **Credenciais**: Não commitadas no Git
- [ ] **Supabase**: Conexão permitida do IP do VPS (se necessário)

---

## 🛠️ RECOMENDAÇÕES DE CORREÇÃO (ORDEM DE PRIORIDADE)

### **PRIORIDADE ALTA** (Corrigir antes do deploy):

1. ✅ **Corrigir Dockerfile do frontend** para receber build args
2. ✅ **Corrigir docker-compose.yml** para passar build args
3. ✅ **Remover duplicação de PORT** no server.js
4. ✅ **Alterar porta 80** para não-privilegiada (3000 ou 8085)
5. ✅ **Adicionar deploy.env ao .gitignore**

### **PRIORIDADE MÉDIA** (Corrigir após deploy inicial):

6. ✅ **Padronizar documentação** sobre portas
7. ✅ **Corrigir healthcheck** (usar curl ou instalar wget)
8. ✅ **Adicionar version** no docker-compose.yml
9. ✅ **Configurar CORS_ORIGIN** para domínio real

### **PRIORIDADE BAIXA** (Melhorias):

10. ✅ **Otimizar networking** entre containers (usar nome de serviço)
11. ✅ **Adicionar logs estruturados**
12. ✅ **Configurar rate limiting** no backend

---

## 🔧 CONFIGURAÇÃO RECOMENDADA PARA VPS

### **docker-compose.yml** (Corrigido):

```yaml
version: "3.9"

services:
  rose-backend:
    container_name: rose-backend
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: rose-backend:latest
    restart: unless-stopped
    ports:
      - "3001:3001"  # Alterado de 8080:3001
    env_file:
      - ./deploy.env
    environment:
      NODE_ENV: production
      PORT: 3001
      TZ: America/Sao_Paulo
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://localhost:3001/health || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - imoguru_net

  rose-frontend:
    container_name: rose-frontend
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL}
        VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}
        VITE_SUPABASE_PUBLISHABLE_KEY: ${VITE_SUPABASE_PUBLISHABLE_KEY}
    image: rose-frontend:latest
    restart: unless-stopped
    ports:
      - "3000:80"  # Alterado de 80:80
    depends_on:
      - rose-backend
    environment:
      NODE_ENV: production
      TZ: America/Sao_Paulo
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://localhost:80 || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - imoguru_net

networks:
  imoguru_net:
    driver: bridge
```

### **Dockerfile** (Frontend - Corrigido):

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

# Build args para variáveis de ambiente
ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -q --spider http://localhost:80 || exit 1

CMD ["serve", "-s", "dist", "-l", "80"]
```

### **deploy.env** (Exemplo - NÃO COMMITAR):

```env
# Frontend
VITE_API_URL=http://seu-vps-ip:3001
VITE_SUPABASE_URL=https://jjeyaupzjkyuidrxdvso.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_aqui

# Backend
DB_HOST=db.jjeyaupzjkyuidrxdvso.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

JWT_SECRET=gerar_chave_forte_aqui
BOOTSTRAP_SECRET=gerar_chave_forte_aqui
RESEND_API_KEY=sua_chave_aqui

NODE_ENV=production
TZ=America/Sao_Paulo
PORT=3001

# IMPORTANTE: Usar domínio real do frontend
CORS_ORIGIN=http://seu-vps-ip:3000
```

---

## 📊 MATRIZ DE IMPACTO

| Problema | Severidade | Probabilidade | Impacto |
|----------|------------|---------------|---------|
| Variáveis VITE_* não no build | 🔴 CRÍTICA | Alta | Erro 502 |
| Porta 80 ocupada | 🔴 CRÍTICA | Média | Container não inicia |
| CORS incorreto | 🟡 ALTA | Alta | Erro 403 |
| PORT duplicado | 🟡 MÉDIA | Baixa | Confusão |
| Healthcheck sem wget | 🟡 MÉDIA | Média | Reinícios |
| Credenciais expostas | 🔴 CRÍTICA | Baixa | Segurança |

---

## 🎯 CONCLUSÃO

**Status Geral**: ⚠️ **REQUER CORREÇÕES ANTES DO DEPLOY**

**Principais Bloqueadores**:
1. Variáveis de ambiente do frontend não são passadas no build
2. Porta 80 pode estar ocupada
3. CORS precisa ser configurado corretamente

**Tempo estimado para correções**: 1-2 horas

**Risco de erro 502**: 🔴 **ALTO** (sem correções)

---

**Gerado em**: $(date)
**Versão do projeto analisado**: baseado em arquivos atuais do repositório

