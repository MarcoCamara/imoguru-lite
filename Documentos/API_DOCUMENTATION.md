# 📡 Documentação das APIs - ImoGuru

## 🎯 Visão Geral

O ImoGuru oferece duas APIs RESTful para integração externa com agentes de IA, automações (n8n, Zapier) e outros sistemas:

1. **API de Imóveis**: Acesso aos imóveis cadastrados
2. **API de Solicitações de Contato**: Acesso às solicitações recebidas

Ambas as APIs são **filtradas automaticamente por empresa** e requerem autenticação via **API Key**.

---

## 🔐 Autenticação

Todas as requisições devem incluir o header `x-api-key`:

```http
GET /functions/v1/api-properties
x-api-key: sk_abc123def456...
```

### Como obter uma API Key:

1. Acesse **Configurações > APIs**
2. Clique em **"Nova API Key"**
3. Preencha:
   - **Nome**: Identificação da chave (ex: "N8N Agente IA")
   - **Empresa**: Empresa que terá dados acessíveis
   - **Tipo**: `Imóveis` ou `Solicitações de Contato`
4. **Copie a chave gerada** (não será mostrada novamente!)

---

## 🏠 API de Imóveis

### Endpoint

```
GET {SUPABASE_URL}/functions/v1/api-properties
```

O endpoint é **dinâmico** e muda conforme o ambiente configurado em `VITE_SUPABASE_URL`:

**Exemplo (Local):**
```
http://127.0.0.1:54321/functions/v1/api-properties
```

**Exemplo (Supabase Cloud):**
```
https://jjeyaupzjkyuidrxdvso.supabase.co/functions/v1/api-properties
```

**Exemplo (VPS/Self-Hosted):**
```
https://api.seu-dominio.com.br/functions/v1/api-properties
```

> 💡 **Dica:** O endpoint correto é exibido automaticamente em **Configurações > APIs > Documentação**

### Headers Obrigatórios

```http
x-api-key: SUA_CHAVE_AQUI
```

### Resposta de Sucesso (200 OK)

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "uuid-aqui",
      "code": "IMO-001",
      "title": "Apartamento 2 Quartos",
      "description": "Lindo apartamento...",
      "property_type": "apartamento",
      "purpose": "venda",
      "status": "disponivel",
      "sale_price": 350000,
      "rental_price": null,
      "condominium_fee": 450,
      "iptu": 200,
      "area_total": 80,
      "area_built": 70,
      "bedrooms": 2,
      "bathrooms": 1,
      "suites": 0,
      "parking_spaces": 1,
      "public_address": "Rua das Flores, Centro",
      "city": "São Paulo",
      "state": "SP",
      "neighborhood": "Centro",
      "cep": "01000-000",
      "accepts_exchange": false,
      "available_for_partnership": false,
      "images": [
        "https://exemplo.com/foto1.jpg",
        "https://exemplo.com/foto2.jpg"
      ],
      "features": [
        "Piscina",
        "Academia",
        "Varanda"
      ],
      "created_at": "2024-10-24T10:00:00Z",
      "updated_at": "2024-10-24T12:00:00Z"
    }
  ]
}
```

### Campos Retornados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único do imóvel |
| `code` | String | Código sequencial (ex: IMO-001) |
| `title` | String | Título do imóvel |
| `description` | String | Descrição completa |
| `property_type` | String | Tipo: apartamento, casa, terreno, etc. |
| `purpose` | String | Finalidade: venda, locacao, venda/locacao |
| `status` | String | Status: disponivel, vendido, alugado, etc. |
| `sale_price` | Number | Preço de venda (null se não for venda) |
| `rental_price` | Number | Preço de locação (null se não for locação) |
| `condominium_fee` | Number | Taxa de condomínio |
| `iptu` | Number | Valor do IPTU |
| `area_total` | Number | Área total em m² |
| `area_built` | Number | Área construída em m² |
| `bedrooms` | Number | Número de quartos |
| `bathrooms` | Number | Número de banheiros |
| `suites` | Number | Número de suítes |
| `parking_spaces` | Number | Vagas de garagem |
| `public_address` | String | Endereço público (sem número) |
| `city` | String | Cidade |
| `state` | String | Estado (UF) |
| `neighborhood` | String | Bairro |
| `cep` | String | CEP |
| `accepts_exchange` | Boolean | Aceita permuta |
| `available_for_partnership` | Boolean | Disponível para parceria |
| `images` | Array | URLs das fotos (ordenadas por display_order) |
| `features` | Array | Características (Piscina, Academia, etc.) |
| `created_at` | DateTime | Data de criação |
| `updated_at` | DateTime | Data de atualização |

### ⚠️ Dados NÃO Retornados (Privacidade)

- ❌ Nome do proprietário
- ❌ CPF/CNPJ do proprietário
- ❌ Telefone do proprietário
- ❌ Email do proprietário
- ❌ Endereço completo (apenas `public_address`)

### Erros Possíveis

**401 Unauthorized** - API Key inválida ou arquivada
```json
{
  "error": "API Key inválida ou arquivada."
}
```

**500 Internal Server Error** - Erro no servidor
```json
{
  "error": "Mensagem de erro detalhada"
}
```

---

## 📞 API de Solicitações de Contato

### Endpoint

```
GET {SUPABASE_URL}/functions/v1/api-contact-requests
```

O endpoint é **dinâmico** e muda conforme o ambiente configurado em `VITE_SUPABASE_URL`:

**Exemplo (Local):**
```
http://127.0.0.1:54321/functions/v1/api-contact-requests
```

**Exemplo (Supabase Cloud):**
```
https://jjeyaupzjkyuidrxdvso.supabase.co/functions/v1/api-contact-requests
```

**Exemplo (VPS/Self-Hosted):**
```
https://api.seu-dominio.com.br/functions/v1/api-contact-requests
```

> 💡 **Dica:** O endpoint correto é exibido automaticamente em **Configurações > APIs > Documentação**

### Headers Obrigatórios

```http
x-api-key: SUA_CHAVE_AQUI
```

### Resposta de Sucesso (200 OK)

```json
{
  "success": true,
  "count": 3,
  "pending_count": 2,
  "responded_count": 1,
  "data": [
    {
      "id": "uuid-aqui",
      "contact": {
        "name": "João Silva",
        "email": "joao@exemplo.com",
        "phone": "(11) 98765-4321"
      },
      "message": "Tenho interesse no imóvel",
      "property": {
        "id": "uuid-do-imovel",
        "code": "IMO-001",
        "title": "Apartamento 2 Quartos",
        "type": "apartamento",
        "purpose": "venda",
        "sale_price": 350000,
        "rental_price": null,
        "location": {
          "public_address": "Rua das Flores, Centro",
          "city": "São Paulo",
          "state": "SP"
        }
      },
      "status": "pending",
      "created_at": "2024-10-24T10:00:00Z",
      "responded_at": null
    }
  ]
}
```

### Campos Retornados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único da solicitação |
| `contact.name` | String | Nome do interessado |
| `contact.email` | String | Email do interessado |
| `contact.phone` | String | Telefone do interessado |
| `message` | String | Mensagem do interessado |
| `property` | Object | Dados resumidos do imóvel |
| `property.id` | UUID | ID do imóvel |
| `property.code` | String | Código do imóvel |
| `property.title` | String | Título do imóvel |
| `property.type` | String | Tipo do imóvel |
| `property.purpose` | String | Finalidade (venda/locacao) |
| `property.sale_price` | Number | Preço de venda |
| `property.rental_price` | Number | Preço de locação |
| `property.location` | Object | Localização pública |
| `status` | String | `pending` ou `responded` |
| `created_at` | DateTime | Data da solicitação |
| `responded_at` | DateTime | Data da resposta (null se pendente) |

### Resumo de Status

- `pending_count`: Total de solicitações não respondidas
- `responded_count`: Total de solicitações já respondidas
- `count`: Total de solicitações

### Erros Possíveis

**401 Unauthorized** - API Key inválida ou arquivada
```json
{
  "error": "API Key inválida ou arquivada."
}
```

**500 Internal Server Error** - Erro no servidor
```json
{
  "error": "Mensagem de erro detalhada"
}
```

---

## 🤖 Exemplos de Uso

### cURL

**API de Imóveis:**
```bash
curl -X GET \
  'https://seu-projeto.supabase.co/functions/v1/api-properties' \
  -H 'x-api-key: sk_abc123def456...'
```

**API de Solicitações:**
```bash
curl -X GET \
  'https://seu-projeto.supabase.co/functions/v1/api-contact-requests' \
  -H 'x-api-key: sk_abc123def456...'
```

### JavaScript / Node.js

```javascript
const API_KEY = 'sk_abc123def456...';
const BASE_URL = 'https://seu-projeto.supabase.co/functions/v1';

// Buscar imóveis
async function getProperties() {
  const response = await fetch(`${BASE_URL}/api-properties`, {
    headers: {
      'x-api-key': API_KEY
    }
  });
  const data = await response.json();
  console.log(data);
}

// Buscar solicitações de contato
async function getContactRequests() {
  const response = await fetch(`${BASE_URL}/api-contact-requests`, {
    headers: {
      'x-api-key': API_KEY
    }
  });
  const data = await response.json();
  console.log(data);
}
```

### Python

```python
import requests

API_KEY = 'sk_abc123def456...'
BASE_URL = 'https://seu-projeto.supabase.co/functions/v1'

# Buscar imóveis
def get_properties():
    response = requests.get(
        f'{BASE_URL}/api-properties',
        headers={'x-api-key': API_KEY}
    )
    return response.json()

# Buscar solicitações de contato
def get_contact_requests():
    response = requests.get(
        f'{BASE_URL}/api-contact-requests',
        headers={'x-api-key': API_KEY}
    )
    return response.json()
```

### n8n (HTTP Request Node)

**Configuração do Node:**
- **Method**: GET
- **URL**: `https://seu-projeto.supabase.co/functions/v1/api-properties`
- **Headers**:
  - **Name**: `x-api-key`
  - **Value**: `sk_abc123def456...`

---

## 🔒 Segurança

### Boas Práticas

✅ **Guarde suas API Keys com segurança**
- Use variáveis de ambiente
- Nunca commit chaves no Git
- Use serviços como Vault para produção

✅ **Monitore o uso**
- Acompanhe o contador de usos
- Verifique o último uso
- Arquive chaves não utilizadas

✅ **Rotação de Chaves**
- Crie nova chave
- Atualize suas integrações
- Arquive/delete a chave antiga

✅ **Princípio do Menor Privilégio**
- Crie chaves específicas por integração
- Use uma chave para imóveis, outra para contatos
- Facilita auditoria e revogação

### Limitações

- 🔐 Cada API Key é vinculada a **uma empresa**
- 🔐 Dados são **automaticamente filtrados**
- 🔐 Chaves arquivadas **não funcionam**
- 🔐 Apenas **admins** podem criar/gerenciar APIs

---

## 📊 Monitoramento

### Métricas Disponíveis

Cada API Key rastreia:
- **Contador de Usos**: Total de requisições
- **Último Uso**: Data/hora da última requisição
- **Status**: Ativa ou Arquivada

### Como Monitorar

1. Acesse **Configurações > APIs**
2. Veja a tabela com todas as chaves
3. Colunas: Nome, Tipo, Empresa, Usos, Último Uso, Status

---

## 🛠️ Troubleshooting

### Problema: "API Key não fornecida"
**Solução**: Adicione o header `x-api-key` à requisição

### Problema: "API Key inválida ou arquivada"
**Possíveis causas:**
- Chave copiada incorretamente
- Chave foi arquivada
- Chave foi deletada
- Tipo de API incorreto

**Solução**: Verifique a chave em Configurações > APIs

### Problema: "Nenhum dado retornado"
**Possíveis causas:**
- Nenhum imóvel cadastrado na empresa
- Todos os imóveis estão arquivados
- Nenhuma solicitação de contato recebida

**Solução**: Verifique os dados no Dashboard

### Problema: "CORS Error"
**Solução**: As Edge Functions já têm CORS configurado (`Access-Control-Allow-Origin: *`)

---

## 📝 Changelog

### v1.0.0 (24/10/2024)
- ✅ Criação inicial das APIs
- ✅ Autenticação via API Key
- ✅ Filtro automático por empresa
- ✅ API de Imóveis (sem dados sensíveis)
- ✅ API de Solicitações de Contato
- ✅ Gerenciamento de chaves (criar, arquivar, deletar)
- ✅ Monitoramento de uso

---

## 💬 Suporte

Para dúvidas ou problemas:
1. Consulte esta documentação
2. Verifique os logs no Supabase Dashboard
3. Entre em contato com o administrador do sistema

---

**🚀 Pronto para integrar!** Use essas APIs para criar automações incríveis com n8n, agentes de IA e muito mais!

