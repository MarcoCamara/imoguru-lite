# PROMPT COMPLETO PARA RECONSTRUÇÃO DO SISTEMA IMOGURU-LITE

## VISÃO GERAL DO SISTEMA

O **ImoGuru-Lite** é uma plataforma completa de gestão imobiliária desenvolvida em React + TypeScript (frontend) e Node.js/Express (backend), com banco de dados Supabase (PostgreSQL). O sistema permite gerenciar imóveis, empresas, usuários, templates de compartilhamento e impressão, páginas públicas personalizadas por empresa, e APIs REST para integração externa.

---

## 1. ARQUITETURA TÉCNICA

### 1.1 Stack Tecnológico

**Frontend:**
- React 18+ com TypeScript
- Vite como bundler
- React Router v6 para roteamento
- Tailwind CSS + shadcn/ui para componentes
- TipTap (Rich Text Editor)
- Supabase Client SDK para autenticação e banco de dados
- React Query (TanStack Query) para gerenciamento de estado
- html2canvas e jsPDF para exportação de imagens/PDFs
- QRCode para geração de QR codes

**Backend:**
- Node.js com Express.js
- PostgreSQL (Supabase)
- Supabase Edge Functions (Deno runtime) para APIs REST
- JWT para autenticação
- Resend para envio de emails

**Banco de Dados:**
- PostgreSQL (Supabase)
- Row Level Security (RLS) habilitado
- Triggers e Functions para lógica de negócio
- Migrations para versionamento do schema

### 1.2 Estrutura de Pastas

```
rose-realstate/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/              # Componentes shadcn/ui
│   │   ├── ShareDialog.tsx  # Dialog de compartilhamento
│   │   ├── PrintTemplate.tsx # Template de impressão
│   │   ├── TemplatePreview.tsx
│   │   ├── PropertyFilters.tsx
│   │   ├── RichTextEditor.tsx
│   │   └── template-editor/  # Componentes do editor de templates
│   │       ├── FormatSelector.tsx
│   │       └── TemplatePreviewLive.tsx
│   ├── pages/               # Páginas principais
│   │   ├── Dashboard.tsx
│   │   ├── PublicCompanyPage.tsx    # Página pública da empresa
│   │   ├── PublicPropertyView.tsx   # Visualização pública do imóvel
│   │   ├── ShareTemplates.tsx      # Gerenciamento de templates de compartilhamento
│   │   ├── PrintTemplates.tsx       # Gerenciamento de templates de impressão
│   │   └── ApiKeysManagement.tsx    # Gerenciamento de chaves de API
│   ├── hooks/
│   │   └── usePrint.ts      # Hook para impressão de imóveis
│   ├── lib/
│   │   └── shareUtils.ts    # Utilitários de compartilhamento
│   ├── contexts/
│   │   └── AuthContext.tsx  # Contexto de autenticação
│   └── integrations/
│       └── supabase/        # Configuração do Supabase
├── backend/                 # API Node.js/Express
│   ├── server.js
│   └── Dockerfile
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── api-properties/
│   │   ├── api-contact-requests/
│   │   └── api-ai-status/
│   └── migrations/          # Migrations do banco
├── Dockerfile               # Frontend Docker
└── docker-compose.yml
```

---

## 2. BANCO DE DADOS - SCHEMA COMPLETO

### 2.1 Tabelas Principais

#### **companies** (Empresas)
```sql
- id: UUID (PK)
- name: TEXT (nome da empresa)
- slug: TEXT UNIQUE (URL amigável, ex: "imobiliaria-rose")
- domain: TEXT (domínio personalizado)
- primary_color: TEXT (cor primária, ex: "#8b5cf6")
- secondary_color: TEXT (cor secundária, ex: "#ec4899")
- logo_url: TEXT (URL do logo)
- phone: TEXT
- whatsapp: TEXT
- email: TEXT
- facebook: TEXT (URL do Facebook)
- instagram: TEXT (URL do Instagram)
- address: TEXT (endereço completo)
- cep, street, number, complement, neighborhood, city, state: TEXT
- about_text: TEXT (texto sobre a empresa)
- show_restricted_area_button: BOOLEAN (mostrar botão de área restrita)
- ai_enabled: BOOLEAN (habilitar IA para a empresa)
- archived: BOOLEAN DEFAULT false
- created_at, updated_at: TIMESTAMPTZ
```

#### **profiles** (Perfis de Usuários)
```sql
- id: UUID (PK, FK para auth.users)
- full_name: TEXT
- email: TEXT
- phone: TEXT
- company_id: UUID (FK para companies)
- archived: BOOLEAN DEFAULT false
- created_at, updated_at: TIMESTAMPTZ
```

#### **properties** (Imóveis)
```sql
- id: UUID (PK)
- user_id: UUID (FK para auth.users)
- company_id: UUID (FK para companies)
- code: TEXT UNIQUE (código único, ex: "IMO-000001")
- title: TEXT NOT NULL
- purpose: ENUM ('venda', 'locacao', 'venda_locacao')
- condition: ENUM ('novo', 'usado', 'em_construcao', 'na_planta')
- status: ENUM ('disponivel', 'reservado', 'vendido', 'alugado')
- property_type: ENUM ('apartamento', 'casa', 'sobrado', 'cobertura', 'kitnet', 'loft', 'terreno', 'comercial', 'rural', 'galpao', 'outro')
- cep, street, number, complement, neighborhood, city, state, country: TEXT
- exact_cep, exact_street, exact_number, exact_complement, exact_neighborhood: TEXT (endereço privado)
- latitude, longitude: DECIMAL
- bedrooms, suites, bathrooms, parking_spaces: INTEGER
- covered_parking, uncovered_parking: INTEGER
- useful_area, total_area: DECIMAL(10,2)
- construction_year: INTEGER
- sale_price, rental_price, iptu_price, condo_price: DECIMAL(15,2)
- description: TEXT
- accepts_exchange: BOOLEAN
- condo_name: TEXT
- condo_units, condo_floors: INTEGER
- condo_amenities: TEXT[]
- property_features: TEXT[] (características do imóvel)
- nearby_amenities: TEXT[] (proximidades)
- registration_number: TEXT (matrícula)
- other_costs: JSONB (array de {description, value})
- published: BOOLEAN DEFAULT false (publicado na página pública)
- published_on_portal: BOOLEAN DEFAULT false
- is_featured: BOOLEAN DEFAULT false (destaque na página pública)
- archived: BOOLEAN DEFAULT false
- owner_name, owner_cpf_cnpj, owner_email, owner_phone: TEXT
- youtube_url: TEXT
- created_at, updated_at: TIMESTAMPTZ
```

#### **property_images** (Imagens dos Imóveis)
```sql
- id: UUID (PK)
- property_id: UUID (FK para properties)
- url: TEXT (URL da imagem no Supabase Storage)
- is_cover: BOOLEAN (imagem de capa)
- display_order: INTEGER (ordem de exibição)
- created_at: TIMESTAMPTZ
```

#### **share_templates** (Templates de Compartilhamento)
```sql
- id: UUID (PK)
- name: TEXT (nome do template)
- platform: TEXT (whatsapp, email, messenger, facebook, instagram)
- message_format: TEXT (conteúdo HTML/texto com placeholders {{campo}})
- fields: JSONB (array de campos usados, ex: ['title', 'price', 'bedrooms'])
- include_images: BOOLEAN (incluir imagens no compartilhamento)
- max_images: INTEGER (máximo de imagens)
- photo_columns: INTEGER (colunas do grid de fotos, 1-4)
- photo_placement: TEXT (before_text, after_text)
- is_default: BOOLEAN (template padrão para a plataforma)
- archived: BOOLEAN DEFAULT false
- created_at, updated_at: TIMESTAMPTZ
```

#### **print_templates** (Templates de Impressão)
```sql
- id: UUID (PK)
- name: TEXT
- content: TEXT (HTML com placeholders {{campo}})
- is_default: BOOLEAN
- photo_columns: INTEGER (1-4)
- photo_placement: TEXT (before_text, after_text, intercalated)
- max_photos: INTEGER
- archived: BOOLEAN DEFAULT false
- created_at, updated_at: TIMESTAMPTZ
```

#### **api_keys** (Chaves de API)
```sql
- id: UUID (PK)
- name: TEXT (nome descritivo da chave)
- api_key: TEXT UNIQUE (chave gerada, prefixo "sk_")
- company_id: UUID (FK para companies)
- api_type: TEXT (properties, contact_requests, ai_status)
- created_by: UUID (FK para auth.users)
- last_used_at: TIMESTAMPTZ
- usage_count: INTEGER DEFAULT 0
- archived: BOOLEAN DEFAULT false
- created_at: TIMESTAMPTZ
```

#### **public_contact_requests** (Solicitações de Contato Públicas)
```sql
- id: UUID (PK)
- company_id: UUID (FK para companies)
- property_id: UUID (FK para properties)
- name: TEXT
- email: TEXT
- phone: TEXT
- archived: BOOLEAN DEFAULT false
- created_at: TIMESTAMPTZ
```

#### **property_statistics** (Estatísticas de Compartilhamento)
```sql
- id: UUID (PK)
- property_id: UUID (FK para properties) UNIQUE
- shares_whatsapp, shares_email, shares_facebook, shares_instagram: INTEGER DEFAULT 0
- views_whatsapp, views_email, views_facebook, views_instagram: INTEGER DEFAULT 0
- created_at, updated_at: TIMESTAMPTZ
```

#### **system_settings** (Configurações do Sistema)
```sql
- id: UUID (PK)
- setting_key: TEXT UNIQUE
- setting_value: TEXT
```

### 2.2 Row Level Security (RLS)

**Políticas principais:**
- Usuários só veem dados da sua empresa (`company_id`)
- Admins veem todos os dados
- Páginas públicas acessam apenas dados publicados (`published = true`)
- APIs usam Service Role Key para bypass de RLS

---

## 3. PÁGINA PÚBLICA DA EMPRESA

### 3.1 Rota
`/public-property/:companySlug` ou `/public-company/:companySlug`

### 3.2 Componente: `PublicCompanyPage.tsx`

**Funcionalidades:**

1. **Carregamento de Dados:**
   - Busca empresa por `slug`
   - Carrega imóveis publicados (`archived = false`)
   - Identifica imóvel em destaque (`is_featured = true` ou aleatório)
   - Separa destaque da lista geral

2. **Layout:**
   - **Header fixo** com:
     - Logo da empresa (ou nome)
     - Botão "Buscar Imóveis" (abre/fecha filtros)
     - Botão "Imprimir (N)" (imprime selecionados)
     - Botão "Contatar (N)" (abre formulário de contato)
     - Botão "Área Restrita" (se `show_restricted_area_button = true`)
   
   - **Seção de Destaque:**
     - Card grande (2/3 foto, 1/3 info)
     - Carrossel automático de fotos (delay 4s)
     - Badge "Imóvel em Destaque"
     - Informações: tipo, título, localização, quartos, banheiros, vagas, área, descrição resumida, preço
     - Botão "Ver Detalhes"
   
   - **Filtros:**
     - Componente `PropertyFilters` (colapsável)
     - Filtra por: finalidade, tipo, status, cidade, estado, preço, área, etc.
   
   - **Lista de Imóveis:**
     - Grid responsivo (1-4 colunas)
     - Card por imóvel com:
       - Checkbox para seleção múltipla
       - Imagem de capa (ou primeira)
       - Badge de finalidade (Venda/Locação)
       - Código, título, localização
       - Ícones de características (🛏️ 🚿 🚗)
       - Preço destacado
       - Botões "Imprimir" e "Contato"
   
   - **Footer:**
     - Componente `PublicFooter` com:
       - Logo, nome, endereço, contatos
       - Links de redes sociais
       - Cores personalizadas da empresa
   
   - **Botão Flutuante WhatsApp:**
     - Fixo no canto inferior direito
     - Link direto para WhatsApp da empresa
     - Animação bounce

3. **Funcionalidades Interativas:**

   - **Seleção Múltipla:**
     - Checkboxes em cada card
     - Contador de selecionados
     - Botões habilitados apenas com seleção
   
   - **Impressão:**
     - Usa hook `usePrint`
     - Imprime selecionados com template padrão
     - `showFullAddress: false` (não mostra endereço completo)
   
   - **Formulário de Contato:**
     - Dialog modal
     - Campos: Nome, Email, Telefone
     - Envia para `public_contact_requests`
     - Suporta múltiplos imóveis selecionados
   
   - **Navegação:**
     - Click no imóvel → `/public-property/:companySlug/property/:propertyId`

4. **Cores Personalizadas:**
   - `primary_color` e `secondary_color` da empresa
   - Aplicadas em botões, badges, bordas, textos

### 3.3 Campos do Banco Utilizados

**Empresa:**
- `name`, `slug`, `logo_url`, `primary_color`, `secondary_color`
- `phone`, `whatsapp`, `email`, `facebook`, `instagram`
- `address`, `street`, `number`, `neighborhood`, `city`, `state`
- `about_text`, `show_restricted_area_button`

**Imóvel:**
- Todos os campos básicos (title, code, purpose, property_type, etc.)
- `property_images` (com `is_cover`, `display_order`)
- `is_featured`, `archived`, `published`

---

## 4. PÁGINA PÚBLICA DO IMÓVEL

### 4.1 Rota
`/public-property/:companySlug/property/:propertyId`

### 4.2 Componente: `PublicPropertyView.tsx`

**Funcionalidades:**

1. **Carregamento:**
   - Busca empresa por `slug`
   - Busca imóvel por `id` e `company_id`
   - Valida que imóvel pertence à empresa

2. **Layout:**

   - **Header:**
     - Logo/nome da empresa
     - Botões: "Voltar", "Imprimir", "Entrar em Contato"
   
   - **Galeria de Fotos (Mosaico):**
     - Layout: 3/4 foto principal + 1/4 miniaturas
     - Foto principal: rotação automática a cada 5s
     - Miniaturas: 4 primeiras + botão "+N" para ver mais
     - Click na miniatura → troca foto principal
     - Click na foto principal → galeria fullscreen
     - Galeria fullscreen: navegação com setas, indicador de posição
     - Fotos ordenadas por `display_order` (capa primeiro)
   
   - **Conteúdo Principal (2 colunas):**
     - **Esquerda (2/3):**
       - Título, tipo, localização
       - Preço destacado (venda ou locação conforme `purpose`)
       - Descrição completa (`whitespace-pre-wrap`)
       - Card "Características":
         - Grid 2x2: Quartos, Banheiros, Vagas, Área Total
         - Ícones coloridos (secondary_color)
         - Seção "Características Adicionais" (lista de `property_features`)
     
     - **Direita (1/3):**
       - Card "Interessado?" (sticky)
       - Botão "Solicitar Contato"
       - Botão WhatsApp (se disponível)
   
   - **Footer:**
     - `PublicFooter` completo

3. **Funcionalidades:**

   - **Impressão:**
     - Hook `usePrint` com um único imóvel
     - `showFullAddress: false`
   
   - **Formulário de Contato:**
     - Mesmo sistema da página da empresa
     - Envia para `public_contact_requests`
   
   - **Galeria Fullscreen:**
     - Dialog modal fullscreen
     - Navegação com setas ou teclado
     - Fundo preto
     - Indicador de posição (1/N)

4. **Cores:**
   - `primary_color` e `secondary_color` da empresa aplicadas

---

## 5. SISTEMA DE TEMPLATES DE COMPARTILHAMENTO

### 5.1 Página: `ShareTemplates.tsx`

**Rota:** `/share-templates`

**Funcionalidades:**

1. **Listagem:**
   - Grid de cards (1-3 colunas)
   - Cada card mostra:
     - Nome do template
     - Plataforma (badge)
     - Badge "Padrão" se `is_default = true`
     - Campos incluídos (badges)
     - Informação de imagens
     - Botões: Preview, Editar, Duplicar, Arquivar, Deletar

2. **Criação/Edição:**

   - **Dialog Modal:**
     - Campos:
       - Nome do template
       - Plataforma (select: WhatsApp, Email, Messenger, Facebook, Instagram)
       - Formato da Mensagem (tabs: Editor Visual / Texto Simples)
         - Editor Visual: `RichTextEditor` (TipTap)
         - Texto Simples: textarea com placeholders
       - Switch "Incluir Imagens"
       - Se incluir imagens:
         - Máximo de Imagens (1-20)
         - Colunas de Fotos (1-4)
         - Posicionamento (Antes/Depois do Texto)
       - Switch "Template Padrão"
       - Seletor de Formato (largura x altura)
       - Preview em Tempo Real (`TemplatePreviewLive`)
   
   - **Editor Visual (RichTextEditor):**
     - Toolbar completa: fontes, tamanhos, negrito, itálico, cores, alinhamento, listas, tabelas, imagens, QR code
     - Badges clicáveis para inserir placeholders:
       - Imóvel: `{{title}}`, `{{code}}`, `{{price}}`, `{{bedrooms}}`, etc.
       - Proprietário: `{{owner_name}}`, `{{owner_phone}}`, etc.
       - Sistema: `{{app_name}}`, `{{logo}}`, `{{qrcode}}`, `{{property_url}}`
     - Suporte a HTML completo
   
   - **Preview em Tempo Real:**
     - Componente `TemplatePreviewLive`
     - Exibe template renderizado com dados mockados
     - Controles de zoom (25% - 400%)
     - Botão "Tela Cheia"
     - Formato configurável (largura x altura)
     - Mostra fotos mockadas se `include_images = true`
   
   - **Validação:**
     - Se `is_default = true`, desmarca outros padrões da mesma plataforma
   
   - **Salvamento:**
     - `upsert` na tabela `share_templates`
     - Campos salvos: `name`, `platform`, `message_format`, `fields` (JSON), `include_images`, `max_images`, `photo_columns`, `is_default`

3. **Ações:**
   - **Preview:** Abre dialog fullscreen com preview renderizado
   - **Editar:** Abre dialog de edição
   - **Duplicar:** Cria cópia com sufixo "(Cópia)"
   - **Arquivar/Desarquivar:** Toggle `archived`
   - **Deletar:** Remove permanentemente (com confirmação)

### 5.2 Placeholders Disponíveis

**Imóvel:**
- `{{title}}`, `{{code}}`, `{{property_type}}`, `{{purpose}}`, `{{status}}`
- `{{sale_price}}`, `{{rental_price}}`, `{{price}}` (auto: venda ou locação)
- `{{bedrooms}}`, `{{suites}}`, `{{bathrooms}}`, `{{parking_spaces}}`
- `{{total_area}}`, `{{useful_area}}`
- `{{city}}`, `{{neighborhood}}`, `{{street}}`, `{{state}}`
- `{{description}}`
- `{{property_url}}` (link da página pública)
- `{{line_break}}` (quebra de linha dupla)

**Proprietário:**
- `{{owner_name}}`, `{{owner_cpf_cnpj}}`, `{{owner_email}}`, `{{owner_phone}}`
- `{{full_address}}`

**Sistema/Empresa:**
- `{{app_name}}` (nome do sistema)
- `{{agency_name}}` (nome da empresa)
- `{{company_logo}}` (HTML da imagem do logo)
- `{{logo}}` (logo do sistema)
- `{{qrcode}}` (QR code da página pública)
- `{{current_date}}` (data atual)

**Formatação:**
- Preços: `R$ 850.000,00`
- Áreas: `180m²`
- Datas: `dd/mm/yyyy`

### 5.3 Utilitários: `shareUtils.ts`

**Funções principais:**

1. **`formatMessageWithTemplate(template, property, forceHtml)`**
   - Substitui placeholders no template
   - Formata valores (preços, áreas, etc.)
   - Se `forceHtml = false`: converte HTML para texto simples (WhatsApp)
   - Se `forceHtml = true`: mantém HTML (Email)
   - Retorna mensagem formatada

2. **`getShareTemplates()`**
   - Busca templates não arquivados
   - Ordena por plataforma, padrão primeiro, depois nome

3. **`getPropertyImages(property, maxImages)`**
   - Ordena imagens: capa primeiro, depois por `display_order`
   - Limita a `maxImages`

4. **`shareToWhatsApp(message, images)`**
   - Copia mensagem para clipboard
   - Abre WhatsApp Web com mensagem pré-formatada
   - Retorna `true` se sucesso

5. **`shareToEmail(property, htmlMessage, images, systemSettings)`**
   - Cria HTML completo do email
   - Grid de fotos (2 colunas)
   - Copia HTML para clipboard (ClipboardItem)
   - Abre cliente de email (mailto:)
   - Retorna `true` se sucesso

6. **`shareToMessenger(message)`**
   - Copia mensagem
   - Abre Messenger
   - Retorna `true`

7. **`shareToFacebook(message, images, companyFacebookUrl)`**
   - Copia mensagem
   - Abre Facebook
   - Retorna `true`

8. **`shareToInstagram(message, companyInstagramUrl)`**
   - Copia mensagem
   - Abre Instagram (perfil da empresa se disponível)
   - Retorna `true`

9. **`exportTemplate(template, property, format)`**
   - `format`: 'jpg' ou 'pdf'
   - Renderiza template em elemento HTML temporário
   - Adiciona fotos se `include_images = true`
   - Converte para canvas (html2canvas)
   - Exporta como JPG ou PDF (jsPDF)
   - Retorna `true` se sucesso

10. **`trackShare(propertyId, platform, contactInfo)`**
    - Atualiza `property_statistics`
    - Incrementa contador `shares_{platform}`

### 5.4 Componente: `ShareDialog.tsx`

**Uso:** Dialog para compartilhar imóvel(éis)

**Props:**
- `open: boolean`
- `onOpenChange: (open: boolean) => void`
- `properties: any[]` (array de imóveis)

**Funcionalidades:**

1. **Carregamento:**
   - Carrega templates de compartilhamento
   - Carrega configurações do sistema
   - Carrega redes sociais da empresa
   - Seleciona templates padrão automaticamente

2. **Interface:**
   - Card por plataforma (WhatsApp, Email, Messenger, Facebook, Instagram)
   - Cada card tem:
     - Checkbox para selecionar plataforma
     - Ícone da plataforma
     - Select de template (se houver templates)
     - Botões:
       - 🔗 Link (copia link da página pública)
       - 📷 JPG (exporta como imagem)
       - 📄 PDF (exporta como PDF)
       - Link (compartilha apenas link)
       - Template (compartilha com template formatado)

3. **Compartilhamento:**
   - **Compartilhar Link:**
     - Gera URL: `${origin}/public-property/${companySlug}/property/${propertyId}`
     - Copia para clipboard
     - Abre rede social respectiva
   
   - **Compartilhar Template:**
     - Formata mensagem com template selecionado
     - Copia para clipboard (ou HTML para email)
     - Abre plataforma
     - Rastreia compartilhamento
     - Suporta múltiplos imóveis (compartilha cada um individualmente)
   
   - **Exportar:**
     - JPG ou PDF
     - Usa `exportTemplate()`
     - Download automático

4. **Estado:**
   - `selectedPlatforms`: array de plataformas selecionadas
   - `selectedTemplateForPlatform`: objeto mapeando plataforma → template ID
   - `loadingPlatform`: plataforma sendo processada
   - `loadingTemplates`: carregando templates

---

## 6. SISTEMA DE TEMPLATES DE IMPRESSÃO

### 6.1 Página: `PrintTemplates.tsx`

**Rota:** `/print-templates`

**Funcionalidades:**

1. **Listagem:**
   - Grid de cards (1-3 colunas)
   - Cada card mostra:
     - Nome do template
     - Badge "Padrão" se `is_default = true`
     - Botões: Preview, Editar, Duplicar, Arquivar, Deletar

2. **Criação/Edição:**

   - **Formulário:**
     - Nome do template
     - Switch "Template Padrão"
     - Switch "Mostrar Fotos no Preview"
     - Controles de Fotos:
       - Colunas de Fotos (1-4)
       - Máximo de Fotos (1-50)
       - Posicionamento (Antes do Texto / Depois do Texto / Intercalado)
     - Seletor de Formato (largura x altura)
       - Formatos pré-definidos: A4 (300dpi), A3, A5, Instagram, Facebook, WhatsApp, Email
       - Personalizado
     - Editor de Conteúdo (tabs):
       - Editor Visual: `RichTextEditor`
       - Código HTML: textarea
     - Preview em Tempo Real: `TemplatePreviewLive`
       - Zoom configurável
       - Tela cheia
       - Mostra fotos mockadas se habilitado
   
   - **Salvamento:**
     - `upsert` na tabela `print_templates`
     - Campos: `name`, `content`, `is_default`, `photo_columns`, `photo_placement`, `max_photos`

3. **Preview:**
   - Dialog fullscreen
   - Renderiza template com dados mockados
   - Formato configurável
   - Placeholders substituídos

### 6.2 Componente: `PrintTemplate.tsx`

**Uso:** Botão de impressão que usa template padrão

**Funcionalidades:**

1. **Carregamento:**
   - Busca template padrão (`is_default = true`)
   - Carrega configurações do sistema

2. **Geração de QR Code:**
   - Para cada imóvel, gera QR code com URL da página pública
   - Usa biblioteca `qrcode`

3. **Formatação:**
   - Substitui placeholders no template:
     - Imóvel: `{{title}}`, `{{code}}`, `{{property_type}}`, `{{purpose}}`, etc.
     - Preços formatados: `R$ 850.000,00`
     - Endereços
     - Descrição
     - QR code (imagem HTML)
     - Imagens (grid HTML)
     - Logo do sistema/empresa
   
4. **Impressão:**
   - Cria janela de impressão (`window.open`)
   - Insere HTML formatado
   - Aplica estilos de impressão:
     - `@page { margin: 2cm; size: A4; }`
     - `page-break-after: always` entre imóveis
   - Abre diálogo de impressão do navegador
   - Limpa elementos temporários após impressão

### 6.3 Hook: `usePrint.ts`

**Uso:** Hook para impressão simples (sem template personalizado)

**Função:**
- `printProperties(data: PrintData)`
  - `data.properties`: array de imóveis
  - `data.company`: dados da empresa
  - `data.showFullAddress`: mostrar endereço completo ou não

**Funcionalidade:**
- Cria template HTML simples inline
- Layout: cabeçalho, grid de fotos, informações básicas, características, localização, valores, descrição
- Aplica estilos de impressão
- Abre `window.print()`

### 6.4 Placeholders para Impressão

**Imóvel:**
- Todos os campos básicos
- `{{images}}`: grid HTML de imagens
- `{{qrcode}}`: QR code da página pública
- `{{price}}`: preço formatado (venda ou locação)

**Sistema:**
- `{{app_name}}`: nome do sistema
- `{{logo}}`: logo do sistema (HTML img)
- `{{company_logo}}`: logo da empresa

**Formatação:**
- Preços: `R$ 850.000,00`
- Datas: `dd/mm/yyyy`
- Áreas: `180m²`

---

## 7. SISTEMA DE API REST

### 7.1 Estrutura

**Base URL:** `${SUPABASE_URL}/functions/v1/{endpoint}`

**Autenticação:**
- Header: `x-api-key: {api_key}`
- Service Role Key do Supabase para validação

### 7.2 Endpoints

#### **1. api-properties** (Listar Imóveis)

**Rota:** `/functions/v1/api-properties`

**Método:** GET

**Headers:**
- `x-api-key`: Chave de API do tipo `properties`

**Validação:**
- Busca `api_keys` por `api_key` e `api_type = 'properties'`
- Verifica `archived = false`
- Obtém `company_id` da chave

**Resposta:**
```json
[
  {
    "id": "uuid",
    "title": "Apartamento Moderno",
    "code": "IMO-000001",
    "property_type": "apartamento",
    "purpose": "venda",
    "sale_price": 850000.00,
    "rental_price": null,
    "bedrooms": 3,
    "bathrooms": 2,
    "parking_spaces": 2,
    "total_area": 120.50,
    "city": "São Paulo",
    "state": "SP",
    "neighborhood": "Centro",
    "description": "...",
    "property_images": [
      {
        "url": "https://...",
        "is_cover": true,
        "display_order": 0
      }
    ],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

**Atualização de Uso:**
- Atualiza `last_used_at`
- Chama RPC `increment_usage_count(key_id)` ou incrementa manualmente

#### **2. api-contact-requests** (Listar Solicitações de Contato)

**Rota:** `/functions/v1/api-contact-requests`

**Método:** GET

**Headers:**
- `x-api-key`: Chave de API do tipo `contact_requests`

**Validação:**
- Busca `api_keys` por `api_key` e `api_type = 'contact_requests'`
- Verifica `archived = false`
- Obtém `company_id`

**Resposta:**
```json
[
  {
    "id": "uuid",
    "property_id": "uuid",
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "(11) 98765-4321",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

**Filtros (Query Params):**
- `archived`: boolean (default: false)
- `property_id`: UUID (opcional)

**Atualização de Uso:**
- Mesmo processo dos outros endpoints

#### **3. api-ai-status** (Status da IA)

**Rota:** `/functions/v1/api-ai-status`

**Método:** GET

**Headers:**
- `x-api-key`: Chave de API do tipo `ai_status`

**Validação:**
- Busca `api_keys` por `api_key` e `api_type = 'ai_status'`
- Verifica `archived = false`
- Obtém `company_id`

**Resposta:**
```json
{
  "status": "active",
  "ai_enabled": true
}
```

**Atualização de Uso:**
- Incrementa o `usage_count` e atualiza `last_used_at` da chave utilizada

### 7.3 Edge Functions (Supabase)

**Estrutura:**
```
supabase/functions/{endpoint}/index.ts
```

**Imports:**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
```

**CORS Headers:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
```

**Fluxo:**
1. Handle OPTIONS (preflight)
2. Extrai `x-api-key` do header
3. Cria cliente Supabase com Service Role Key
4. Valida API key na tabela `api_keys`
5. Obtém `company_id`
6. Executa query com filtro `company_id`
7. Atualiza uso da chave
8. Retorna resposta JSON

### 7.4 Gerenciamento de Chaves: `ApiKeysManagement.tsx`

**Rota:** `/settings` (seção de API Keys)

**Funcionalidades:**

1. **Listagem:**
   - Tabela com:
     - Nome
     - Empresa
     - Tipo (properties, contact_requests, ai_status)
     - Último Uso
     - Contador de Usos
     - Data de Criação
     - Ações: Ver Detalhes, Copiar, Arquivar, Deletar
   - Toggle "Ver Arquivadas"

2. **Criação:**
   - Dialog com:
     - Nome da chave
     - Select de empresa
     - Select de tipo (properties, contact_requests, ai_status)
     - Botão "Gerar Chave"
   - Geração:
     - Prefixo: `sk_`
     - 32 bytes aleatórios (hex)
     - Verifica unicidade
     - Insere na tabela `api_keys`

3. **Visualização:**
   - Dialog com:
     - Nome e descrição do tipo
     - Chave (read-only, botão copiar)
     - Header: `x-api-key`
     - Endpoint completo
     - Exemplo de resposta JSON

4. **Ações:**
   - **Copiar:** Copia chave para clipboard
   - **Arquivar/Desarquivar:** Toggle `archived`
   - **Deletar:** Remove permanentemente

---

## 8. COMPONENTES AUXILIARES

### 8.1 RichTextEditor

**Biblioteca:** TipTap (React)

**Extensões:**
- StarterKit (negrito, itálico, listas, etc.)
- TextAlign
- Color, TextStyle, FontFamily
- Image
- Table (com células editáveis)

**Toolbar:**
- Fontes: Arial, Times New Roman, Courier New, Georgia, Verdana, Comic Sans MS, Impact
- Tamanhos: 8px - 72px
- Formatação: Bold, Italic, Strike, Code
- Cabeçalhos: H1, H2, H3
- Alinhamento: Left, Center, Right, Justify
- Listas: Bullet, Ordered, Quote
- Elementos: Table, 2 Colunas, QR Code, Imagem, Linha Horizontal
- Controles: Undo, Redo

**Badges de Placeholders:**
- Clique insere `{{campo}}` no editor
- Organizados por categoria: Imóvel, Proprietário, Empresa/Sistema

### 8.2 TemplatePreviewLive

**Props:**
- `content`: string (HTML do template)
- `width`, `height`: número (dimensões)
- `type`: 'share' | 'print' | 'authorization'
- `zoomLevel`: número (0.25 - 4.0)
- `onZoomChange`: callback
- `photoColumns`: número (1-4)
- `photoPlacement`: 'before_text' | 'after_text' | 'intercalated'
- `maxPhotos`: número
- `showPhotos`: boolean

**Funcionalidades:**
- Substitui placeholders com dados mockados
- Renderiza HTML com `dangerouslySetInnerHTML`
- Controles de zoom (25% - 400%)
- Botão "Tela Cheia" (Dialog fullscreen)
- Aspect ratio preservado
- Grid de fotos mockadas (se `showPhotos = true`)

### 8.3 FormatSelector

**Props:**
- `width`, `height`: número
- `onChange`: callback(width, height)

**Funcionalidades:**
- Select com formatos pré-definidos:
  - Instagram: 1080x1080, 1080x1350, 1080x1920
  - Facebook: 1200x630, 1080x1080, 820x312
  - WhatsApp: 1080x1920, 800x600
  - Impressão: A4 (2480x3508), A3, A5 (300dpi)
  - Email: 600x800, 600x400
- Inputs numéricos para personalizado
- Exibe proporção (width/height)

### 8.4 PropertyFilters

**Props:**
- `properties`: array de imóveis
- `onFilterChange`: callback(array filtrado)
- `showCompanyFilter`: boolean (default: true)

**Filtros:**
- Finalidade (venda, locação, todas)
- Categoria (Residencial, Comercial, etc.)
- Tipo (apartamento, casa, etc.)
- Status (disponível, reservado, vendido, alugado)
- Condição (novo, usado, em construção, na planta)
- Cidade, Estado (texto livre)
- Condomínio/Edifício (texto livre)
- Empresa (select, apenas admin)
- Dormitórios, Suítes, Banheiros (mínimo)
- Vagas Cobertas, Descobertas (mínimo)
- Área Total, Área Útil (slider min-max)
- Preço (slider min-max)
- Ano de Construção (slider min-max)
- Checkboxes: Mostrar arquivados, Apenas publicados, Aceita Permuta

**Funcionalidade:**
- Aplica filtros em tempo real
- Botão "Limpar Filtros"
- Grid responsivo de inputs

---

## 9. AUTENTICAÇÃO E SEGURANÇA

### 9.1 Supabase Auth

**Autenticação:**
- Email/Senha
- Redefinição de senha
- Sessão persistente

**Roles:**
- `admin`: Acesso total
- `user`: Acesso restrito à empresa

### 9.2 Row Level Security (RLS)

**Políticas principais:**

1. **properties:**
   - Usuários veem apenas imóveis da sua empresa
   - Admins veem todos
   - Público vê apenas `published = true` e `archived = false`

2. **companies:**
   - Usuários veem apenas sua empresa
   - Admins veem todas
   - Público vê apenas dados básicos (slug, cores, logo)

3. **api_keys:**
   - Usuários veem apenas chaves da sua empresa
   - Admins veem todas
   - Criação apenas por admins

4. **share_templates, print_templates:**
   - Todos os usuários autenticados podem ver/editar
   - Público pode ver apenas templates padrão (`is_default = true`)

### 9.3 Edge Functions Security

**Validação de API Key:**
- Query na tabela `api_keys`
- Verifica `archived = false`
- Verifica `api_type` correspondente
- Obtém `company_id` para filtrar dados
- Atualiza `last_used_at` e `usage_count`

**Service Role Key:**
- Usado apenas nas Edge Functions
- Nunca exposto no frontend
- Permite bypass de RLS

---

## 10. FLUXOS DE USO

### 10.1 Compartilhamento de Imóvel

1. Usuário seleciona imóvel(éis) no Dashboard
2. Clica em "Compartilhar"
3. Abre `ShareDialog`
4. Seleciona plataforma(s) (checkbox)
5. Seleciona template para cada plataforma
6. Clica "Template" ou "Link"
7. Sistema:
   - Formata mensagem com template
   - Copia para clipboard (ou HTML para email)
   - Abre plataforma
   - Rastreia compartilhamento
8. Usuário cola conteúdo na plataforma

### 10.2 Impressão de Imóvel

**Opção 1: Template Personalizado**
1. Usuário configura template em `/print-templates`
2. Define template padrão
3. Na página pública ou Dashboard, clica "Imprimir"
4. Sistema:
   - Busca template padrão
   - Gera QR codes
   - Formata conteúdo
   - Abre diálogo de impressão

**Opção 2: Template Simples**
1. Usuário clica "Imprimir" (sem template configurado)
2. Sistema usa `usePrint` com template inline simples
3. Abre diálogo de impressão

### 10.3 Criação de Template de Compartilhamento

1. Usuário acessa `/share-templates`
2. Clica "Novo Template"
3. Preenche:
   - Nome
   - Plataforma
   - Formato (Editor Visual ou Texto)
   - Configurações de imagens
   - Template padrão
4. Edita conteúdo:
   - Usa toolbar do editor
   - Clica badges para inserir placeholders
   - Visualiza preview em tempo real
5. Salva
6. Template disponível para uso

### 10.4 Solicitação de Contato Pública

1. Visitante acessa página pública da empresa
2. Visualiza imóveis
3. Clica "Contatar" ou "Entrar em Contato"
4. Preenche formulário: Nome, Email, Telefone
5. Envia
6. Sistema:
   - Insere em `public_contact_requests`
   - Vincula a empresa e imóvel(éis)
   - Exibe toast de sucesso
7. Empresa pode ver solicitações em Dashboard ou via API

---

## 11. CONFIGURAÇÕES E PERSONALIZAÇÃO

### 11.1 Cores da Empresa

**Campos:**
- `primary_color`: Cor principal (botões, títulos, badges)
- `secondary_color`: Cor secundária (badges, ícones, destaques)

**Aplicação:**
- Páginas públicas
- Botões de ação
- Bordas e destaques
- Badges

### 11.2 Logo da Empresa

**Campo:**
- `logo_url`: URL da imagem (Supabase Storage)

**Exibição:**
- Header das páginas públicas
- Footer
- Templates (placeholders `{{company_logo}}`)

### 11.3 Redes Sociais

**Campos:**
- `whatsapp`: Número (formato: apenas dígitos)
- `facebook`: URL completa
- `instagram`: URL completa

**Uso:**
- Botão flutuante WhatsApp (link direto)
- Links no footer
- Compartilhamento (abre perfil da empresa)

### 11.4 Endereço da Empresa

**Campos:**
- `address`: Texto completo (fallback)
- `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `cep`

**Exibição:**
- Footer das páginas públicas
- Formatação: `{street}{number ? ', ' + number : ''}{neighborhood ? ' - ' + neighborhood : ''}`

---

## 12. DETALHES DE IMPLEMENTAÇÃO

### 12.1 Formatação de Valores

**Preços:**
```typescript
value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
// Ex: 850000.00 → "850.000,00"
```

**Áreas:**
```typescript
`${value}m²`
```

**Datas:**
```typescript
new Date().toLocaleDateString('pt-BR')
// Ex: "01/01/2024"
```

**Telefones:**
```typescript
phone.replace(/\D/g, '') // Remove não-dígitos
```

### 12.2 Ordenação de Imagens

```typescript
images.sort((a, b) => {
  if (a.is_cover) return -1;
  if (b.is_cover) return 1;
  return (a.display_order || 0) - (b.display_order || 0);
});
```

### 12.3 Geração de QR Code

```typescript
import QRCode from 'qrcode';

const url = `${window.location.origin}/public-property/${companySlug}/property/${propertyId}`;
const qrCodeDataUrl = await QRCode.toDataURL(url);
```

### 12.4 Exportação de Imagens/PDF

```typescript
// 1. Criar elemento HTML temporário
const container = document.createElement('div');
container.innerHTML = htmlContent;

// 2. Converter para canvas
const canvas = await html2canvas(container, {
  scale: 2,
  useCORS: true,
  backgroundColor: '#ffffff',
});

// 3. Exportar
// JPG:
const imgData = canvas.toDataURL('image/jpeg', 0.95);
// PDF:
const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
pdf.save('filename.pdf');
```

### 12.5 Clipboard API

```typescript
// Texto simples
await navigator.clipboard.writeText(text);

// HTML (email)
const htmlBlob = new Blob([html], { type: 'text/html' });
const textBlob = new Blob([text], { type: 'text/plain' });
const clipboardItem = new ClipboardItem({
  'text/html': htmlBlob,
  'text/plain': textBlob,
});
await navigator.clipboard.write([clipboardItem]);
```

---

## 13. OBSERVAÇÕES IMPORTANTES

### 13.1 Placeholders

- Formato: `{{campo}}` ou `{campo}` (ambos suportados)
- Case-sensitive: `{{title}}` ≠ `{{Title}}`
- Placeholders não substituídos aparecem como vazios ou `[não disponível]`

### 13.2 Templates Padrão

- Apenas um template padrão por plataforma (compartilhamento)
- Apenas um template padrão geral (impressão)
- Ao marcar como padrão, desmarca outros automaticamente

### 13.3 Arquivos

- Templates podem ser arquivados (`archived = true`)
- Arquivados não aparecem em listagens normais
- Podem ser desarquivados
- Deletar remove permanentemente

### 13.4 Imagens

- Armazenadas no Supabase Storage
- URLs públicas ou assinadas
- Ordenação: capa primeiro, depois `display_order`
- Limite de imagens nos templates: `max_images`

### 13.5 URLs Públicas

- Formato: `/public-property/{companySlug}/property/{propertyId}`
- `companySlug` deve ser único
- Validação: imóvel deve pertencer à empresa

### 13.6 APIs

- Requerem header `x-api-key`
- Retornam apenas dados da empresa da chave
- Rastreiam uso (`last_used_at`, `usage_count`)
- Chaves arquivadas são inválidas

---

## 14. CHECKLIST DE RECONSTRUÇÃO

### Frontend
- [ ] Configurar React + TypeScript + Vite
- [ ] Instalar dependências (shadcn/ui, TipTap, etc.)
- [ ] Configurar Supabase Client
- [ ] Implementar autenticação
- [ ] Criar componentes de UI base
- [ ] Implementar páginas públicas
- [ ] Implementar sistema de templates
- [ ] Implementar compartilhamento
- [ ] Implementar impressão
- [ ] Implementar gerenciamento de API keys

### Backend
- [ ] Configurar Supabase Edge Functions
- [ ] Implementar api-properties
- [ ] Implementar api-contact-requests
- [ ] Implementar api-ai-status
- [ ] Configurar CORS

### Banco de Dados
- [ ] Criar tabelas principais
- [ ] Criar tabelas de templates
- [ ] Criar tabela de API keys
- [ ] Criar tabela de estatísticas
- [ ] Configurar RLS policies
- [ ] Criar triggers e functions
- [ ] Criar migrations

### Funcionalidades
- [ ] Sistema de templates de compartilhamento
- [ ] Sistema de templates de impressão
- [ ] Páginas públicas personalizadas
- [ ] Compartilhamento multi-plataforma
- [ ] Exportação JPG/PDF
- [ ] Impressão com QR codes
- [ ] Sistema de API REST
- [ ] Gerenciamento de chaves de API

---

## 15. CONCLUSÃO

Este documento descreve completamente o sistema ImoGuru-Lite, incluindo:
- Arquitetura técnica completa
- Schema do banco de dados
- Funcionalidades de cada módulo
- Fluxos de uso
- Detalhes de implementação
- Componentes e utilitários

Uma IA pode usar este prompt para reconstruir o sistema exatamente como está implementado, incluindo todos os campos, funcionalidades, validações e comportamentos.

**Última atualização:** 2024-01-XX

