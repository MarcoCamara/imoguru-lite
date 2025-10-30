# 🌐 CONFIGURAÇÃO DE DOMÍNIOS PERSONALIZADOS

## **SISTEMA: IMOGURU - Páginas Públicas de Empresas**

---

## 📋 **VISÃO GERAL**

O sistema ImoGuru permite que cada empresa cadastrada tenha sua própria página pública acessível por:

1. **Subdomínio do sistema:** `empresa-slug.imoguru.com.br`
2. **Domínio personalizado:** `www.maroni.com.br`

---

## 🏗️ **ARQUITETURA ATUAL**

### **Como Funciona Agora:**

```
URL: localhost:8082/public-property/maroni-imoveis
      └─> Sistema usa o SLUG da empresa para buscar dados
```

**Estrutura de Rotas:**
- `/public-property/:companySlug` - Página da empresa
- `/public-property/:companySlug/property/:propertyId` - Página do imóvel

---

## 🔧 **CONFIGURAÇÃO DE DOMÍNIOS PERSONALIZADOS**

### **OPÇÃO 1: Subdomínios do Sistema (Mais Simples)**

**Exemplo:** `maroni.imoguru.com.br`

#### **Requisitos:**
1. Ter domínio principal: `imoguru.com.br`
2. Configurar DNS Wildcard

#### **Passos:**

**1. Configuração DNS**
```
Tipo: A (ou CNAME)
Host: *.imoguru.com.br
Valor: [IP do servidor] ou [domínio principal]
TTL: 3600
```

**2. Configuração do Servidor (Nginx/Apache)**

```nginx
# Nginx - /etc/nginx/sites-available/imoguru.conf

server {
    listen 80;
    server_name *.imoguru.com.br imoguru.com.br;

    location / {
        proxy_pass http://localhost:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# SSL (Recomendado - Let's Encrypt)
server {
    listen 443 ssl http2;
    server_name *.imoguru.com.br imoguru.com.br;

    ssl_certificate /etc/letsencrypt/live/imoguru.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/imoguru.com.br/privkey.pem;

    location / {
        proxy_pass http://localhost:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**3. Ajuste no Frontend (App.tsx)**

```typescript
// src/App.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const hostname = window.location.hostname;
    
    // Se for subdomínio, redirecionar para página pública
    if (hostname.includes('.imoguru.com.br') && hostname !== 'imoguru.com.br') {
      const subdomain = hostname.split('.')[0];
      navigate(`/public-property/${subdomain}`);
    }
  }, []);

  return (
    // ... rotas normais ...
  );
}
```

---

### **OPÇÃO 2: Domínios Totalmente Personalizados**

**Exemplo:** `www.maroni.com.br`

#### **Requisitos:**
1. Cliente possui o domínio
2. Configuração DNS por parte do cliente
3. Sistema precisa mapear domínio → empresa

#### **Passos:**

**1. Tabela de Mapeamento (Já existe)**

```sql
-- Campo `website_domain` na tabela `companies`
-- Exemplo: "www.maroni.com.br"
```

**2. Configuração DNS (Cliente)**

```
Tipo: A
Host: @  (ou www)
Valor: [IP do servidor ImoGuru]
TTL: 3600
```

**3. Configuração do Servidor**

```nginx
# Nginx - /etc/nginx/sites-available/maroni.conf

server {
    listen 80;
    server_name www.maroni.com.br maroni.com.br;

    location / {
        proxy_pass http://localhost:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Custom-Domain $host;
    }
}

# SSL (Let's Encrypt)
server {
    listen 443 ssl http2;
    server_name www.maroni.com.br maroni.com.br;

    ssl_certificate /etc/letsencrypt/live/maroni.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/maroni.com.br/privkey.pem;

    location / {
        proxy_pass http://localhost:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Custom-Domain $host;
    }
}
```

**4. Backend - Roteamento por Domínio**

```typescript
// src/App.tsx - Adicionar lógica

useEffect(() => {
  const hostname = window.location.hostname;
  
  // Se for localhost, não fazer nada
  if (hostname.includes('localhost')) return;
  
  // Se NÃO for o domínio principal do sistema
  if (!hostname.includes('imoguru.com.br')) {
    // Buscar empresa por domínio personalizado
    fetchCompanyByDomain(hostname).then(company => {
      if (company) {
        navigate(`/public-property/${company.slug}`);
      }
    });
  }
}, []);

async function fetchCompanyByDomain(domain: string) {
  const { data } = await supabase
    .from('companies')
    .select('slug')
    .eq('website_domain', domain)
    .single();
  return data;
}
```

---

## 🚀 **IMPLEMENTAÇÃO NO SISTEMA**

### **Alterações Necessárias:**

#### **1. Frontend (`src/App.tsx`)**

Adicionar lógica de detecção de domínio:

```typescript
function App() {
  const navigate = useNavigate();

  useEffect(() => {
    handleCustomDomain();
  }, []);

  const handleCustomDomain = async () => {
    const hostname = window.location.hostname;
    
    // Ignorar localhost
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return;
    }

    try {
      // Verificar se é subdomínio do sistema
      if (hostname.includes('.imoguru.com.br') && hostname !== 'imoguru.com.br') {
        const subdomain = hostname.split('.')[0];
        navigate(`/public-property/${subdomain}`);
        return;
      }

      // Verificar se é domínio personalizado
      const { data: company } = await supabase
        .from('companies')
        .select('slug')
        .eq('website_domain', hostname)
        .single();

      if (company) {
        navigate(`/public-property/${company.slug}`);
      }
    } catch (error) {
      console.error('Erro ao verificar domínio:', error);
    }
  };

  // ... resto do código ...
}
```

#### **2. Certificado SSL Automático**

**Instalar Certbot:**
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# Gerar certificado wildcard (Subdomínios)
sudo certbot certonly --manual --preferred-challenges=dns \
  -d imoguru.com.br -d *.imoguru.com.br

# Gerar certificado para domínio específico
sudo certbot --nginx -d www.maroni.com.br -d maroni.com.br
```

---

## 📝 **CHECKLIST DE IMPLANTAÇÃO**

### **Para o Sistema Principal:**

- [ ] Registrar domínio `imoguru.com.br`
- [ ] Configurar DNS com Wildcard (`*.imoguru.com.br`)
- [ ] Instalar Nginx no servidor
- [ ] Configurar proxy reverso
- [ ] Instalar certificado SSL (Let's Encrypt)
- [ ] Implementar lógica de roteamento no frontend
- [ ] Testar subdomínios dinâmicos

### **Para Cada Cliente com Domínio Personalizado:**

- [ ] Cliente fornece domínio (ex: `www.maroni.com.br`)
- [ ] Admin cadastra domínio no campo `website_domain`
- [ ] Instruir cliente a apontar DNS para IP do servidor
- [ ] Criar configuração Nginx específica
- [ ] Gerar certificado SSL para o domínio
- [ ] Testar acesso público

---

## 🔒 **SEGURANÇA**

1. **HTTPS Obrigatório:** Sempre usar SSL
2. **Rate Limiting:** Proteger contra abusos
3. **CORS:** Configurar origens permitidas
4. **Firewall:** Apenas portas 80 e 443 abertas

---

## 🧪 **TESTES**

### **Ambiente Local:**

```bash
# Editar /etc/hosts (Linux/Mac) ou C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1  maroni.localhost
127.0.0.1  imoguru.localhost

# Acessar:
http://maroni.localhost:8082
```

### **Produção:**

1. Verificar DNS: `nslookup www.maroni.com.br`
2. Testar HTTP: `curl -I http://www.maroni.com.br`
3. Testar HTTPS: `curl -I https://www.maroni.com.br`
4. Verificar SSL: `openssl s_client -connect www.maroni.com.br:443`

---

## 📞 **SUPORTE**

Para configuração de domínios personalizados:
1. Cliente fornece domínio
2. Admin cadastra no sistema
3. Cliente aponta DNS
4. Aguardar propagação (24-48h)
5. Testar acesso

---

## ⚠️ **IMPORTANTE**

- **Propagação DNS:** Pode levar até 48 horas
- **Backup:** Sempre fazer backup antes de alterar configurações
- **Testes:** Testar em ambiente de homologação primeiro
- **Documentação:** Manter este arquivo atualizado

---

**Última Atualização:** Outubro 2025  
**Versão do Sistema:** 1.0

