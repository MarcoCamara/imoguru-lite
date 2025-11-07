# 🚀 Configuração de Endpoints das APIs em Diferentes Ambientes

## 📋 **RESUMO**

Os endpoints das APIs **mudam automaticamente** conforme o ambiente (local, produção Supabase, VPS). Não é necessário alterar código!

---

## 🔧 **COMO FUNCIONA**

O sistema busca a URL base do arquivo `.env` através da variável `VITE_SUPABASE_URL`:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
```

### **Endpoints Gerados Automaticamente:**

```
API de Imóveis: {VITE_SUPABASE_URL}/functions/v1/api-properties
API de Contatos: {VITE_SUPABASE_URL}/functions/v1/api-contact-requests
```

---

## 🌍 **CONFIGURAÇÃO POR AMBIENTE**

### **1. Desenvolvimento Local**

**Arquivo:** `.env.local` (na raiz do projeto)

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=sua-anon-key-local
```

**Endpoints gerados:**
```
http://127.0.0.1:54321/functions/v1/api-properties
http://127.0.0.1:54321/functions/v1/api-contact-requests
```

---

### **2. Produção Supabase Cloud**

**Arquivo:** `.env` ou `.env.production`

```env
VITE_SUPABASE_URL=https://jjeyaupzjkyuidrxdvso.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-production
```

**Endpoints gerados:**
```
https://jjeyaupzjkyuidrxdvso.supabase.co/functions/v1/api-properties
https://jjeyaupzjkyuidrxdvso.supabase.co/functions/v1/api-contact-requests
```

---

### **3. VPS / Self-Hosted Supabase**

**Arquivo:** `.env.production` (na VPS)

```env
VITE_SUPABASE_URL=https://api.seu-dominio.com.br
VITE_SUPABASE_ANON_KEY=sua-anon-key-vps
```

**Endpoints gerados:**
```
https://api.seu-dominio.com.br/functions/v1/api-properties
https://api.seu-dominio.com.br/functions/v1/api-contact-requests
```

---

## 📝 **PASSO A PASSO PARA DEPLOY**

### **Opção 1: Vercel / Netlify / Cloudflare Pages**

1. No painel de configuração, adicione as variáveis:
   - `VITE_SUPABASE_URL` = URL do seu Supabase
   - `VITE_SUPABASE_ANON_KEY` = Chave pública do Supabase

2. Faça o deploy normalmente:
   ```bash
   npm run build
   ```

3. Os endpoints serão gerados automaticamente!

---

### **Opção 2: VPS (Self-Hosted)**

#### **A. Instalar Supabase na VPS**

```bash
# 1. Clone o projeto Supabase
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# 2. Configure o .env
cp .env.example .env
nano .env  # Edite JWT_SECRET, POSTGRES_PASSWORD, etc.

# 3. Inicie os serviços
docker-compose up -d
```

#### **B. Configurar Nginx Reverse Proxy**

```nginx
# /etc/nginx/sites-available/api.seu-dominio.com.br

server {
    listen 80;
    server_name api.seu-dominio.com.br;

    location / {
        proxy_pass http://localhost:8000;  # Porta do Kong (Supabase Gateway)
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Habilitar site
sudo ln -s /etc/nginx/sites-available/api.seu-dominio.com.br /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configurar SSL com Certbot
sudo certbot --nginx -d api.seu-dominio.com.br
```

#### **C. Deploy das Edge Functions na VPS**

```bash
# 1. Copiar funções para o diretório do Supabase
cp -r supabase/functions/* /path/to/supabase/volumes/functions/

# 2. Reiniciar serviço Deno (Edge Runtime)
docker-compose restart functions
```

#### **D. Configurar Frontend**

**Arquivo:** `.env.production` (na VPS)

```env
VITE_SUPABASE_URL=https://api.seu-dominio.com.br
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Build e Deploy:**

```bash
# 1. Build do frontend
npm run build

# 2. Copiar para Nginx
sudo cp -r dist/* /var/www/imoguru/

# 3. Configurar Nginx para servir o frontend
```

```nginx
# /etc/nginx/sites-available/imoguru.com.br

server {
    listen 80;
    server_name imoguru.com.br www.imoguru.com.br;

    root /var/www/imoguru;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🔍 **VERIFICAÇÃO**

### **Ver Endpoints no Sistema:**

1. Acesse **Configurações > APIs**
2. Role até **"Documentação das APIs"**
3. Os endpoints exibidos serão **automaticamente** os corretos para o ambiente!

### **Teste Manual:**

```bash
# Substitua {ENDPOINT} pelo endpoint do seu ambiente
curl -X GET '{ENDPOINT}/functions/v1/api-properties' \
  -H 'x-api-key: sk_sua_chave_aqui'
```

---

## ⚠️ **IMPORTANTE: Arquivos `.env`**

### **Estrutura Recomendada:**

```
rose-realstate/
├── .env.local          # Desenvolvimento local (não commitar)
├── .env.production     # Produção (não commitar)
├── .env.example        # Exemplo (commitar este)
└── .gitignore          # Deve incluir .env*
```

### **`.env.example` (para referência):**

```env
# Exemplo de configuração - COPIE para .env.local ou .env.production
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

### **`.gitignore` (verificar):**

```gitignore
# Variáveis de ambiente
.env
.env.local
.env.production
.env.*.local
```

---

## 🎯 **RESUMO FINAL**

✅ **Endpoints são dinâmicos** (mudam com `VITE_SUPABASE_URL`)
✅ **Nenhum código precisa ser alterado** entre ambientes
✅ **Documentação in-app** mostra endpoint correto automaticamente
✅ **Deploy é simples**: apenas configure `.env` e faça build
✅ **Funciona em qualquer ambiente**: local, cloud, VPS

---

## 💡 **DICAS**

### **1. Testar Localmente com Produção:**

```env
# .env.local
VITE_SUPABASE_URL=https://jjeyaupzjkyuidrxdvso.supabase.co
VITE_SUPABASE_ANON_KEY=chave-producao
```

### **2. Múltiplos Ambientes:**

```bash
# Desenvolvimento
npm run dev

# Build para staging
VITE_SUPABASE_URL=https://staging.supabase.co npm run build

# Build para produção
VITE_SUPABASE_URL=https://prod.supabase.co npm run build
```

### **3. Verificar Variáveis no Build:**

```bash
# Ver variáveis carregadas
npm run build -- --debug
```

---

## 🆘 **TROUBLESHOOTING**

### **Problema: Endpoints não mudam**

**Solução:**
1. Limpe o cache: `rm -rf node_modules/.vite`
2. Reconstrua: `npm run build`
3. Verifique `.env`: `cat .env.production`

### **Problema: 404 nas Edge Functions**

**Solução:**
1. Verifique se as funções foram deployed: `supabase functions list`
2. Teste diretamente: `curl {ENDPOINT}/functions/v1/api-properties`
3. Verifique logs: `supabase functions logs api-properties`

### **Problema: CORS Error**

**Solução:**
As Edge Functions já têm CORS configurado (`Access-Control-Allow-Origin: *`). Se ainda houver erro:
1. Verifique se a URL está correta
2. Confirme que a API Key está sendo enviada
3. Teste com curl primeiro

---

**🎉 Pronto! Seu sistema está preparado para qualquer ambiente!**

