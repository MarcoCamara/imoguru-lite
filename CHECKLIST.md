# CHECKLIST COMPLETO - IMOGURU

## ✅ FASE 1: CORREÇÕES CRÍTICAS E FUNDAMENTOS
### 1. Sistema de Compartilhamento Multiplataforma
- [x] 1.1. Estrutura básica de templates criada
- [x] 1.1.1. Correção WhatsApp (web/desktop) - usa web.whatsapp.com
- [x] 1.1.2. Variáveis de sistema nos templates ({{app_name}}, {{logo_url}})
- [x] 1.2. Email com formatação HTML completa usando templates do banco
- [x] 1.2.1. HTML formatado copiado automaticamente para área de transferência
- [x] 1.2.2. Email formatado com imagens do imóvel embutidas no HTML
- [x] 1.2.3. Cliente de email nativo é aberto com assunto preenchido
- [x] 1.2.4. Usuário cola (Ctrl+V) o HTML formatado no corpo do email
- [ ] 1.3. Implementar Web Share API (nativo do navegador)
- [ ] 1.4. Adicionar fallback para copiar texto formatado
- [x] 1.5. Melhorar feedback visual ao compartilhar (toast com instruções)
- [x] 1.6. Documentar limitações de cada plataforma
- [x] 1.7. Exportar templates como JPG/PDF para compartilhamento offline
- [x] 1.7.1. Biblioteca html2canvas para converter HTML em imagem
- [x] 1.7.2. Biblioteca jsPDF para gerar PDFs
- [x] 1.7.3. Botões de exportação ao lado do link em cada plataforma
- [x] 1.7.4. Download automático de arquivos JPG/PDF formatados

**📧 FLUXO DE COMPARTILHAMENTO POR PLATAFORMA:**

**WhatsApp:**
- ✅ Template **texto simples** copiado automaticamente
- ✅ **Não abre** automaticamente (usuário cola onde preferir)
- ✅ URLs são clicáveis e levam à página pública do imóvel
- ✅ Emojis e formatação preservados

**Email:**
- ✅ Template **HTML formatado** copiado automaticamente
- ✅ **Abre cliente de email** com assunto preenchido
- ✅ Cole (Ctrl+V) no corpo do email
- ✅ Mantém formatação completa e fotos embutidas

**Messenger:**
- ✅ Template **texto simples** copiado automaticamente
- ✅ **Não abre** automaticamente
- ✅ Usuário cola no Messenger já aberto

**Facebook:**
- ✅ Template **texto simples** copiado automaticamente
- ✅ **Não abre** automaticamente
- ✅ Usuário cola ao criar post no Facebook

**Instagram:**
- ✅ Template **texto simples** copiado automaticamente
- ✅ **Não abre** automaticamente
- ✅ Usuário cola na legenda ao criar post

**📋 ESTRATÉGIA FINAL:**
- **Apenas EMAIL abre automaticamente** (cliente nativo)
- **Demais plataformas**: copiam template e deixam usuário colar onde preferir
- **Evita abas indesejadas** e conflitos de múltiplas instâncias
- **HTML → Texto**: conversão automática para redes sociais
- **URLs clicáveis**: links funcionam em todas as plataformas

---

### **2. ACESSO À PÁGINA PÚBLICA**

**✅ Botão "Página Pública" disponível para TODOS os usuários:**

- **Admin**: Dropdown com lista de todas as empresas cadastradas
- **Usuários Normais**: Botão direto para a página pública da empresa do usuário
- **Localização**: Header do Dashboard, ao lado dos botões de filtro e exportação
- **Funcionalidade**: Abre a página pública da empresa em nova aba
- **Ícone**: 🌐 Globe (ícone de globo)

**📋 FLUXO:**
1. Usuário clica no botão "Página Pública"
2. Sistema redireciona para `/public-property/{slug-da-empresa}`
3. Página pública é exibida com imóveis, filtros e informações da empresa
4. Visitantes podem solicitar contato através do formulário público

---

### **3. SISTEMA DE APIs**

**✅ Nova aba "APIs" em Configurações:**

**🔐 Gerenciamento de API Keys:**
- ✅ Criar nova API Key (nome, empresa, tipo)
- ✅ Arquivar/Desarquivar API Key
- ✅ Deletar API Key permanentemente
- ✅ Visualizar/Ocultar chave (máscarado por padrão)
- ✅ Copiar chave para clipboard
- ✅ Monitoramento de uso (contador, último uso)
- ✅ Geração automática de chave única (formato: `sk_<64-hex-chars>`)

**📡 Dois Tipos de API:**

**1. API de Imóveis (`api-properties`):**
- ✅ Endpoint: `/functions/v1/api-properties`
- ✅ Método: `GET`
- ✅ Autenticação: Header `x-api-key`
- ✅ Filtro automático por empresa
- ✅ Retorna apenas imóveis não arquivados
- ✅ **Protege dados sensíveis**: Não retorna nome/CPF/contato do proprietário, endereço completo
- ✅ Retorna: dados do imóvel, fotos, características, localização pública
- ✅ Formato JSON estruturado

**2. API de Solicitações de Contato (`api-contact-requests`):**
- ✅ Endpoint: `/functions/v1/api-contact-requests`
- ✅ Método: `GET`
- ✅ Autenticação: Header `x-api-key`
- ✅ Filtro automático por empresa
- ✅ Retorna: dados do contato, mensagem, imóvel relacionado, status (pending/responded)
- ✅ Estatísticas: total, pendentes, respondidas
- ✅ Formato JSON estruturado

**🔒 Segurança:**
- ✅ RLS (Row Level Security) na tabela `api_keys`
- ✅ Validação de API Key antes de retornar dados
- ✅ API Keys arquivadas não funcionam
- ✅ Atualização automática de `last_used_at` e `usage_count`
- ✅ Apenas admins podem gerenciar API Keys
- ✅ CORS configurado nas Edge Functions

**📊 Monitoramento:**
- ✅ Contador de usos por API Key
- ✅ Data/hora do último uso
- ✅ Status (Ativa/Arquivada)
- ✅ Filtro para mostrar/ocultar arquivadas

**📚 Documentação:**
- ✅ Card de documentação in-app (Configurações > APIs)
- ✅ Exemplos de endpoints
- ✅ Instruções de uso com headers
- ✅ Arquivo `API_DOCUMENTATION.md` completo
- ✅ Exemplos em cURL, JavaScript, Python, n8n
- ✅ Guia de segurança e boas práticas

**🎯 Casos de Uso:**
- ✅ Integração com n8n para automações
- ✅ Agente de IA para responder clientes
- ✅ Sincronização com sistemas externos
- ✅ Dashboards analíticos personalizados
- ✅ Chatbots com acesso aos imóveis

**🌍 Endpoints Dinâmicos:**
- ✅ URL base lida de `VITE_SUPABASE_URL` (arquivo `.env`)
- ✅ Funciona em **qualquer ambiente** (local, cloud, VPS)
- ✅ **Nenhum código** precisa ser alterado entre ambientes
- ✅ Documentação in-app mostra endpoint correto automaticamente

**Configuração por Ambiente:**

**Local:**
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
```
Endpoints: `http://127.0.0.1:54321/functions/v1/api-properties`

**Supabase Cloud:**
```env
VITE_SUPABASE_URL=https://jjeyaupzjkyuidrxdvso.supabase.co
```
Endpoints: `https://jjeyaupzjkyuidrxdvso.supabase.co/functions/v1/api-properties`

**VPS/Self-Hosted:**
```env
VITE_SUPABASE_URL=https://api.seu-dominio.com.br
```
Endpoints: `https://api.seu-dominio.com.br/functions/v1/api-properties`

📚 **Ver documentação completa**: `DEPLOY_API_ENDPOINTS.md`

---

## ⚠️ **CHECKLIST OBRIGATÓRIO PARA PRODUÇÃO**

### **🔴 CRÍTICO - ANTES DE COLOCAR EM PRODUÇÃO:**

#### **1. VARIÁVEIS DE AMBIENTE (.env)**

**Arquivo:** `.env.production` (criar na raiz do projeto)

```env
# ====================================
# OBRIGATÓRIO - SUPABASE
# ====================================

# URL do Supabase (Produção)
VITE_SUPABASE_URL=https://jjeyaupzjkyuidrxdvso.supabase.co

# Chave Anon do Supabase (Produção)
# Obter em: Settings > API > Project API keys > anon public
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**✅ AÇÕES:**
- [ ] Criar arquivo `.env.production` com valores corretos
- [ ] Verificar que `.env` está no `.gitignore`
- [ ] **NUNCA** commitar arquivos `.env` com valores reais
- [ ] Anotar as variáveis em local seguro (Vault/1Password)

---

#### **2. MIGRATIONS DO BANCO DE DADOS**

**✅ AÇÕES:**
- [ ] Aplicar todas as migrations na produção:
  ```bash
  supabase db push --include-all
  ```
- [ ] Confirmar que todas as tabelas foram criadas
- [ ] Verificar no Supabase Dashboard > Database > Tables

**📋 Tabelas que DEVEM existir:**
- ✅ `api_keys` (gerenciamento de APIs)
- ✅ `public_contact_requests` (solicitações de contato)
- ✅ `company_public_pages` (páginas públicas)
- ✅ `property_share_history` (histórico de compartilhamentos)
- ✅ Todas as outras tabelas do sistema

---

#### **3. EDGE FUNCTIONS (APIs)**

**✅ AÇÕES:**
- [ ] Deploy da Edge Function `api-properties`:
  ```bash
  supabase functions deploy api-properties
  ```
- [ ] Deploy da Edge Function `api-contact-requests`:
  ```bash
  supabase functions deploy api-contact-requests
  ```
- [ ] Deploy de todas as outras Edge Functions:
  ```bash
  supabase functions deploy delete-user
  supabase functions deploy send-property-email
  supabase functions deploy send-reset-password-email
  ```

**🔍 VERIFICAR:**
- [ ] Testar cada endpoint com `curl` ou Postman
- [ ] Confirmar no Supabase Dashboard > Edge Functions
- [ ] Verificar logs: `supabase functions logs nome-da-funcao`

---

#### **4. CONFIGURAÇÕES DO SUPABASE**

**✅ AÇÕES NO DASHBOARD:**

**4.1. RLS (Row Level Security):**
- [ ] Verificar que RLS está HABILITADO em todas as tabelas
- [ ] Testar policies com usuário não-admin
- [ ] Confirmar acesso correto por empresa

**4.2. Storage (Arquivos):**
- [ ] Configurar bucket `property-images` (se não existir)
- [ ] Configurar policies de upload/download
- [ ] Definir limites de tamanho (ex: 5MB por imagem)

**4.3. Authentication:**
- [ ] Configurar URL de redirecionamento: `https://seu-dominio.com.br/**`
- [ ] Habilitar provedores necessários (Email, Google, etc.)
- [ ] Configurar templates de email personalizados
- [ ] Testar fluxo completo de autenticação

**4.4. Email Settings:**
- [ ] Configurar SMTP customizado (Resend recomendado)
- [ ] Adicionar domínio verificado
- [ ] Testar envio de email
- [ ] Configurar rate limits

**4.5. API Settings:**
- [ ] Anotar `anon` key (pública)
- [ ] **GUARDAR** `service_role` key (NUNCA expor no frontend)
- [ ] Configurar CORS se necessário

---

#### **5. BACKEND (Node.js)**

**✅ AÇÕES:**

**5.1. Variáveis de Ambiente (`backend/.env`):**
```env
# JWT Secret (gerar nova chave para produção!)
JWT_SECRET=sua-chave-segura-aqui-min-32-chars

# Bootstrap Secret (para criar admin de emergência)
BOOTSTRAP_SECRET=sua-senha-bootstrap-aqui

# CORS Origin (domínio do frontend)
CORS_ORIGIN=https://seu-dominio.com.br

# Supabase
SUPABASE_URL=https://jjeyaupzjkyuidrxdvso.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

# Resend (Email)
RESEND_API_KEY=re_sua_chave_aqui
```

**🔐 SEGURANÇA:**
- [ ] Gerar novo `JWT_SECRET` (32+ caracteres aleatórios)
- [ ] Gerar novo `BOOTSTRAP_SECRET` (senha forte)
- [ ] **NUNCA** usar as mesmas chaves de desenvolvimento
- [ ] Anotar todas as chaves em local seguro

**5.2. Deploy do Backend:**
- [ ] Escolher plataforma (VPS, Heroku, Railway, etc.)
- [ ] Configurar variáveis de ambiente na plataforma
- [ ] Fazer deploy: `npm run start` ou `pm2 start server.js`
- [ ] Verificar saúde: `GET /health` ou similar
- [ ] Configurar SSL/HTTPS (obrigatório!)

---

#### **6. FRONTEND (React/Vite)**

**✅ AÇÕES:**

**6.1. Build de Produção:**
```bash
# Verificar variáveis
cat .env.production

# Build
npm run build

# Testar localmente (opcional)
npm run preview
```

**6.2. Deploy:**

**Opção A - Vercel/Netlify (Recomendado):**
- [ ] Conectar repositório GitHub
- [ ] Adicionar variáveis de ambiente no painel
- [ ] Configurar domínio customizado
- [ ] Deploy automático em cada push

**Opção B - VPS (Manual):**
- [ ] Upload dos arquivos `dist/` para `/var/www/seu-dominio/`
- [ ] Configurar Nginx (ver `DEPLOY_API_ENDPOINTS.md`)
- [ ] Configurar SSL com Certbot
- [ ] Testar acesso via domínio

---

#### **7. DOMÍNIOS E DNS**

**✅ AÇÕES:**

**7.1. Domínio Principal (Sistema CRM):**
```
seu-dominio.com.br → Frontend (Vercel/VPS)
```
- [ ] Apontar registros DNS
- [ ] Configurar SSL/HTTPS
- [ ] Testar acesso

**7.2. Páginas Públicas das Empresas:**
```
seu-dominio.com.br/public-property/slug-empresa
```
- [ ] Configurar no cadastro da empresa
- [ ] Testar acesso público
- [ ] Verificar SEO (meta tags)

**7.3. API (se VPS):**
```
api.seu-dominio.com.br → Supabase Self-Hosted
```
- [ ] Configurar subdomain
- [ ] Nginx reverse proxy
- [ ] SSL/HTTPS

---

#### **8. SEGURANÇA**

**✅ AÇÕES OBRIGATÓRIAS:**

- [ ] **HTTPS** obrigatório em todos os ambientes
- [ ] Senhas fortes em todas as contas (Supabase, servidor, etc.)
- [ ] Rate limiting configurado (Supabase já tem)
- [ ] Backup automático do banco de dados (Supabase já faz)
- [ ] Monitoramento de logs ativo
- [ ] Política de senha forte no sistema (já implementada)
- [ ] 2FA ativo nas contas admin (Supabase, GitHub, etc.)

**🔐 SENHAS PADRÃO (ALTERAR IMEDIATAMENTE):**
- [ ] Trocar senha padrão `senha123` (novos usuários)
- [ ] Forçar troca de senha no primeiro login (futuro)

---

#### **9. TESTES PRÉ-PRODUÇÃO**

**✅ CHECKLIST DE TESTES:**

**9.1. Autenticação:**
- [ ] Criar nova conta
- [ ] Login
- [ ] Logout
- [ ] Esqueci senha
- [ ] Redefinir senha

**9.2. CRUD Completo:**
- [ ] Criar imóvel
- [ ] Editar imóvel
- [ ] Listar imóveis
- [ ] Deletar imóvel
- [ ] Arquivar/desarquivar

**9.3. Upload de Arquivos:**
- [ ] Upload de fotos
- [ ] Upload de documentos
- [ ] Validação de tamanho/tipo
- [ ] Exibição de arquivos

**9.4. Compartilhamento:**
- [ ] Compartilhar por email
- [ ] Compartilhar WhatsApp (copiar template)
- [ ] Compartilhar redes sociais (copiar template)
- [ ] Link público funcionando

**9.5. APIs Externas:**
- [ ] Criar API Key
- [ ] Testar endpoint `/api-properties`
- [ ] Testar endpoint `/api-contact-requests`
- [ ] Verificar autenticação (API Key)
- [ ] Verificar filtro por empresa

**9.6. Páginas Públicas:**
- [ ] Acessar página pública da empresa
- [ ] Filtrar imóveis
- [ ] Enviar solicitação de contato
- [ ] Ver detalhes do imóvel
- [ ] Visualizar fotos (carousel)

**9.7. Configurações:**
- [ ] Alterar cores/logo
- [ ] Gerenciar usuários
- [ ] Gerenciar empresas
- [ ] Gerenciar API Keys

---

#### **10. MONITORAMENTO E BACKUP**

**✅ CONFIGURAR:**

**10.1. Supabase Dashboard:**
- [ ] Configurar alertas de erro
- [ ] Monitorar uso de API
- [ ] Verificar logs diariamente (primeira semana)
- [ ] Configurar notificações por email

**10.2. Backup:**
- [ ] Supabase já faz backup automático (verificar)
- [ ] Fazer backup manual antes de mudanças grandes
- [ ] Guardar dumps do banco em local seguro
- [ ] Testar restauração de backup (IMPORTANTE!)

**10.3. Uptime Monitoring:**
- [ ] Configurar UptimeRobot ou similar
- [ ] Monitorar URL principal
- [ ] Monitorar APIs
- [ ] Alertas via email/SMS

---

#### **11. DOCUMENTAÇÃO PARA O CLIENTE**

**✅ CRIAR/FORNECER:**

- [ ] Manual do usuário (PDF/vídeo)
- [ ] Credenciais de acesso admin
- [ ] Guia de criação de API Keys
- [ ] Contato para suporte
- [ ] FAQ básico

---

#### **12. GO LIVE CHECKLIST**

**✅ DIA DO LANÇAMENTO:**

**Antes:**
- [ ] Backup completo do banco de dados
- [ ] Verificar todos os itens anteriores
- [ ] Testar todos os fluxos críticos
- [ ] Avisar usuários (se aplicável)

**Durante:**
- [ ] Monitorar logs em tempo real
- [ ] Estar disponível para suporte
- [ ] Ter plano de rollback pronto

**Depois:**
- [ ] Verificar métricas (primeiras 24h)
- [ ] Coletar feedback dos usuários
- [ ] Resolver bugs críticos imediatamente
- [ ] Documentar problemas encontrados

---

### **📋 RESUMO - CHECKLIST RÁPIDO**

```
[ ] .env.production criado e preenchido
[ ] Migrations aplicadas (supabase db push)
[ ] Edge Functions deployed
[ ] RLS habilitado e testado
[ ] Backend rodando com variáveis corretas
[ ] Frontend em produção (Vercel/VPS)
[ ] Domínios apontados e SSL configurado
[ ] Todos os fluxos testados
[ ] Backup configurado
[ ] Monitoramento ativo
[ ] Documentação entregue
```

---

## 🆘 **EM CASO DE PROBLEMAS**

### **Rollback Rápido:**
```bash
# Frontend (Vercel)
- Revert último deploy no painel

# Backend (VPS)
pm2 restart backend

# Banco de dados
supabase db reset  # CUIDADO! Só em dev
# Em prod: restaurar do backup
```

### **Suporte:**
1. Verificar logs: `supabase functions logs`
2. Consultar `CHECKLIST.md`, `API_DOCUMENTATION.md`, `DEPLOY_API_ENDPOINTS.md`
3. Supabase Discord: https://discord.supabase.com
4. GitHub Issues do projeto

---

**🚨 ATENÇÃO:** Não pule nenhum item desta checklist. Cada passo é crítico para o sucesso da implantação em produção!

**📥 EXPORTAÇÃO DE TEMPLATES (JPG/PDF):**

Cada plataforma possui 3 botões:
1. **🔗 Link**: Copia URL da página pública do imóvel
2. **🖼️ JPG**: Exporta template formatado como imagem JPG (alta qualidade, 95%)
3. **📄 PDF**: Exporta template formatado como PDF (formato A4, orientação automática)

**Funcionalidades:**
- Template renderizado invisível com todas as fotos
- Aguarda carregamento de todas as imagens
- Conversão HTML → Canvas → JPG/PDF
- Download automático com nome do imóvel
- Qualidade profissional (scale: 2x para alta resolução)
- Grid de fotos respeitando configurações do template
- Ideal para compartilhamento em WhatsApp, email e redes sociais

### 2. Sistema de Roles e Permissões
- [x] 2.1. Tabela user_roles criada
- [x] 2.2. Função has_role() implementada
- [x] 2.3. RLS policies básicas configuradas
- [ ] 2.4. Interface para admin gerenciar roles
- [ ] 2.5. Tela de listagem de usuários para admin

### 3. Perfil de Usuário Completo
- [x] 3.1. Tabela profiles básica existe
- [x] 3.2. Adicionar campos: CRECI, tipo_usuario, pessoa_tipo
- [x] 3.3. Adicionar campos de endereço completo
- [x] 3.4. Formulário de cadastro expandido
- [x] 3.5. Página de edição de perfil
- [ ] 3.6. Validação de CPF/CNPJ
- [ ] 3.7. Validação de CRECI
- [ ] 3.8. Upload de foto de perfil

## ✅ FASE 2: GESTÃO DE IMÓVEIS
### 4. Ações sobre Imóveis (Usuário)
- [x] 4.1. Funcionalidade de arquivar imóvel
- [x] 4.1.1. Adicionar coluna archived
- [x] 4.1.2. Botão de arquivar no card
- [x] 4.1.3. Filtro para mostrar/ocultar arquivados
- [x] 4.2. Funcionalidade de deletar imóvel
- [x] 4.2.1. Botão de deletar com confirmação
- [x] 4.2.2. Deletar imagens associadas
- [x] 4.2.3. Deletar documentos associados
- [x] 4.2.4. Deletar vídeos associados
- [x] 4.3. Funcionalidade de duplicar imóvel (CORRIGIDO)
- [x] 4.3.1. Botão de duplicar
- [x] 4.3.2. Copiar todos os dados
- [x] 4.3.3. Gerar novo código sequencial
- [x] 4.3.4. Marcar como não publicado

### 5. Permissões Admin sobre Imóveis
- [x] 5.1. Admin visualizar todos os imóveis
- [x] 5.2. Admin arquivar qualquer imóvel
- [x] 5.3. Admin deletar qualquer imóvel
- [x] 5.4. Admin duplicar qualquer imóvel
- [x] 5.5. Admin editar qualquer imóvel
- [ ] 5.6. Filtro por usuário/corretor

## ✅ FASE 3: CONFIGURAÇÕES DE MÍDIA
### 6. Configurações de Imagens
- [x] 6.1. Criar tabela system_settings
- [x] 6.2. Configuração: max_images_per_property
- [x] 6.3. Configuração: max_image_size_mb
- [ ] 6.4. Validação no frontend
- [ ] 6.5. Validação no backend via RLS
- [x] 6.6. Interface de configuração para admin
- [ ] 6.7. Feedback visual ao exceder limites

### 7. Configurações de Vídeos
- [x] 7.1. Configuração: video_upload_enabled (true/false)
- [x] 7.2. Configuração: video_links_enabled
- [ ] 7.3. Configuração: max_video_size_mb
- [ ] 7.4. Configuração: max_videos_per_property
- [ ] 7.5. Validação de URLs (YouTube, Vimeo)
- [x] 7.6. Interface de configuração para admin
- [ ] 7.7. Player de vídeo embedded

## ✅ FASE 4: PAINEL ADMINISTRATIVO
### 8. Configurações Gerais do Sistema
- [x] 8.1. Criar página /settings
- [x] 8.2. Seção: Informações do Sistema
- [x] 8.2.1. Nome do sistema (ImoGuru)
- [ ] 8.2.2. Slogan/descrição
- [x] 8.3. Seção: Identidade Visual
- [x] 8.3.1. Cor primária (color picker)
- [x] 8.3.2. Cor secundária (color picker)
- [x] 8.3.3. Upload de logo (header)
- [ ] 8.3.4. Upload de logo (email)
- [x] 8.3.5. Upload de favicon
- [x] 8.3.6. Preview das cores em tempo real
- [x] 8.4. Seção: Configurações de Mídia
- [x] 8.4.1. Configurações de imagens e vídeos
- [x] 8.5. Seção: Templates de Compartilhamento
- [x] 8.5.1. Listagem de templates
- [x] 8.5.2. Editar templates existentes
- [x] 8.5.3. Preview de templates (com imagens de exemplo)
- [x] 8.5.4. Editor rico (Tiptap) com formatação avançada
- [x] 8.5.5. Suporte a tabelas e colunas no editor
- [x] 8.6. Seção: Templates de Autorização
- [x] 8.6.1. Listagem de templates
- [x] 8.6.2. Criar novo template
- [x] 8.6.3. Editar template existente
- [x] 8.6.4. Deletar template
- [x] 8.6.5. Editor rico (Tiptap) para templates
- [x] 8.6.6. Preview de templates de autorização
- [ ] 8.7. Seção: Templates de Impressão

### 9. Dashboard Admin
- [x] 9.1. Dashboard com métricas básicas
- [x] 9.2. Card: Total de imóveis
- [x] 9.3. Card: Imóveis por status
- [x] 9.4. Card: Imóveis publicados vs não publicados
- [x] 9.5. Gráfico: Imóveis por finalidade (venda/locação)
- [x] 9.6. Gráfico: Imóveis por tipo
- [x] 9.7. Gráfico: Imóveis por cidade
- [x] 9.8. Gráfico: Valor médio por tipo
- [ ] 9.9. Card: Total de usuários/corretores
- [ ] 9.10. Tabela: Top corretores (mais imóveis)
- [ ] 9.11. Tabela: Imóveis recentes
- [ ] 9.12. Filtro por período

### 10. Gestão de Usuários (Admin)
- [ ] 10.1. Criar página /admin/users
- [ ] 10.2. Listagem de todos usuários
- [ ] 10.3. Filtros: role, tipo, status
- [ ] 10.4. Editar usuário
- [ ] 10.5. Atribuir/remover roles
- [ ] 10.6. Desativar/ativar usuário
- [ ] 10.7. Ver imóveis do usuário
- [ ] 10.8. Estatísticas por usuário

## ✅ FASE 5: DASHBOARD E MÉTRICAS (USUÁRIO)
### 11. Dashboard do Usuário/Corretor
- [x] 11.1. Reformular página inicial (/dashboard)
- [x] 11.2. Card: Meus imóveis (total)
- [x] 11.3. Card: Imóveis disponíveis
- [x] 11.4. Card: Imóveis alugados/vendidos
- [x] 11.5. Card: Imóveis em negociação
- [x] 11.6. Gráfico: Distribuição por finalidade
- [x] 11.7. Gráfico: Distribuição por tipo
- [x] 11.8. Gráfico: Valor médio do portfólio
- [x] 11.9. Lista: Imóveis mais recentes (grid de imóveis)
- [ ] 11.10. Lista: Imóveis mais compartilhados
- [x] 11.11. Estatísticas de compartilhamento
- [x] 11.11.1. Total de compartilhamentos
- [x] 11.11.2. Por plataforma
- [x] 11.11.3. Por imóvel
- [x] 11.12. Atualização automática em tempo real (Realtime)

## ✅ FASE 6: FILTROS E BUSCAS AVANÇADAS
### 12. Filtros Avançados
- [x] 12.1. Filtros básicos implementados
- [x] 12.2. Filtro por faixa de preço (slider)
- [x] 12.3. Filtro por área (min/max)
- [x] 12.4. Filtro por número de quartos (multi-select)
- [x] 12.5. Filtro por bairro (autocomplete)
- [ ] 12.6. Filtro por características (piscina, churrasqueira, etc)
- [ ] 12.7. Filtro por proximidade (amenidades próximas)
- [x] 12.8. Ordenação avançada
- [ ] 12.9. Salvar filtros favoritos
- [ ] 12.10. Compartilhar filtros via URL

## ✅ FASE 7: EXPORTAÇÃO E IMPRESSÃO
### 13. Exportação de Dados
- [x] 13.1. Exportar CSV
- [x] 13.2. Exportar XLSX
- [x] 13.3. Exportar JSON
- [x] 13.4. Exportar com filtros aplicados
- [ ] 13.5. Selecionar campos para exportar
- [ ] 13.6. Exportar com imagens (ZIP)
- [ ] 13.7. Agendar exportações automáticas

### 14. Impressão de Imóveis
- [x] 14.1. Criar template HTML de impressão
- [x] 14.2. Botão de imprimir no card
- [x] 14.3. Botão de imprimir múltiplos
- [x] 14.4. Incluir imagens na impressão
- [x] 14.5. Incluir QR Code com link
- [x] 14.6. Layout responsivo para impressão
- [ ] 14.7. Admin configurar template de impressão
- [ ] 14.8. Gerar PDF ao invés de imprimir

## ✅ FASE 8: BRANDING E PERSONALIZAÇÃO
### 15. Sistema de Branding (ImoGuru)
- [x] 15.1. Renomear aplicação para "ImoGuru"
- [x] 15.2. Atualizar title e meta tags
- [x] 15.3. Implementar sistema de cores dinâmicas
- [x] 15.3.1. Salvar cores no system_settings
- [ ] 15.3.2. Aplicar CSS variables dinamicamente
- [ ] 15.3.3. Atualizar tailwind.config.ts
- [x] 15.4. Upload e gestão de logos
- [x] 15.4.1. Bucket storage para logos (system-branding)
- [x] 15.4.2. RLS policies para logos
- [x] 15.4.3. Exibir logo no header/dashboard
- [x] 15.4.4. Logo disponível em templates de compartilhamento
- [x] 15.4.5. Tamanho responsivo do logo (mobile/tablet/desktop)
- [ ] 15.4.6. Exibir logo em emails
- [x] 15.5. Upload e gestão de favicon
- [x] 15.5.1. Upload de favicon
- [ ] 15.5.2. Gerar múltiplos tamanhos
- [ ] 15.5.3. Atualizar index.html dinamicamente
- [x] 15.6. Preview de mudanças antes de aplicar

## ✅ FASE 9: AUTORIZAÇÕES E DOCUMENTOS
### 16. Sistema de Autorizações
- [x] 16.1. Tabela authorization_templates criada
- [x] 16.2. Tabela property_authorizations criada
- [x] 16.3. Interface para criar autorizações
- [x] 16.4. Preencher template com dados do proprietário
- [x] 16.5. Preencher template com dados do imóvel
- [x] 16.6. Assinar digitalmente (canvas)
- [x] 16.7. Upload de assinatura (imagem)
- [ ] 16.8. Gerar PDF da autorização
- [ ] 16.9. Enviar por email para proprietário
- [x] 16.10. Histórico de autorizações por imóvel
- [x] 16.11. Gerenciar templates de autorização (/authorization-templates)

## ✅ FASE 10: ESTATÍSTICAS E ANALYTICS
### 17. Sistema de Estatísticas
- [x] 17.1. Tabela property_statistics criada
- [x] 17.2. Tracking de compartilhamentos
- [ ] 17.3. Tracking de visualizações
- [ ] 17.4. Tracking de favoritos
- [ ] 17.5. Tracking de contatos/leads
- [x] 17.6. Dashboard de estatísticas por imóvel
- [x] 17.6.1. Componente PropertyStatistics criado
- [x] 17.6.2. Cards de métricas (compartilhamentos, views, engajamento)
- [x] 17.6.3. Gráficos de compartilhamentos por plataforma
- [x] 17.6.4. Gráficos de visualizações por plataforma
- [x] 17.6.5. Gráfico comparativo de engajamento
- [x] 17.6.6. Insights e análises
- [x] 17.7. Dashboard geral de performance (DashboardMetrics)
- [ ] 17.8. Relatórios personalizados
- [ ] 17.9. Exportar relatórios

## ⏳ FASE 11: INSTALAÇÃO E DEPLOY
### 18. Configurações de Email (CRÍTICO)
- [x] 18.1. ⚠️ **RESOLVIDO TEMPORARIAMENTE**: Desabilitar confirmação de email no Supabase Auth
- [ ] 18.2. 🔴 **OBRIGATÓRIO PARA PRODUÇÃO**: Configurar SMTP customizado com Resend
  - **Motivo:** Evitar bloqueio por emails devolvidos (bounced emails)
  - **Passos:**
    1. Acessar: Supabase Dashboard > Auth > Email Templates > SMTP Settings
    2. Configurar:
       - Sender email: seu-email@seudominio.com
       - Sender name: ImoGuru
       - Host: smtp.resend.com
       - Port: 465
       - Username: resend
       - Password: [API Key do Resend]
  - **Benefício:** Todos os emails (auth + aplicação) passam pelo Resend com melhor deliverability
- [ ] 18.3. Testar emails de autenticação (signup, reset password)
- [ ] 18.4. Configurar templates de email personalizados

### 18.5. Segurança de Senhas (CRÍTICO)
- [x] 18.5.1. ⚠️ **IMPLEMENTADO (INSEGURO)**: Senha padrão `senha123` para novos usuários
  - **Situação atual:**
    - Criação de usuário: senha pré-preenchida com `senha123`
    - Duplicação de usuário: senha automática `senha123`
  - **RISCO:** Senha padrão é altamente insegura e facilmente adivinhável
  - **Status:** Adequado APENAS para ambiente interno/desenvolvimento
- [ ] 18.5.2. 🔴 **OBRIGATÓRIO PARA PRODUÇÃO**: Implementar uma das seguintes soluções:
  - **Opção 1 (RECOMENDADA):** Forçar troca de senha no primeiro login
    - Adicionar campo `must_change_password` na tabela `profiles`
    - Redirecionar para tela de troca de senha no primeiro acesso
    - Validar que nova senha seja diferente da padrão
  - **Opção 2:** Enviar email com link de reset ao criar usuário
    - Criar usuário sem senha definida
    - Enviar email automático com link para definir primeira senha
    - Usuário cria sua própria senha segura
  - **Opção 3:** Gerar senha aleatória forte
    - Gerar senha com 16+ caracteres aleatórios
    - Incluir maiúsculas, minúsculas, números e símbolos
    - Enviar por email ou SMS seguro
    - Ainda assim, forçar troca no primeiro login
- [ ] 18.5.3. Implementar política de senhas fortes
  - Mínimo 8 caracteres
  - Exigir letra maiúscula, minúscula, número e caractere especial
  - Validar no frontend e backend
- [ ] 18.5.4. Adicionar histórico de senhas (evitar reutilização)
- [ ] 18.5.5. Implementar expiração de senha (ex: 90 dias)

### 19. Instalador VPS
- [ ] 19.1. Script de instalação automatizada
- [ ] 19.2. Configuração de servidor (nginx/apache)
- [ ] 19.3. Configuração de SSL
- [ ] 19.4. Configuração de domínio
- [ ] 19.5. Backup automático
- [ ] 19.6. Monitoramento de servidor

### 20. Manual de Instalação
- [ ] 20.1. Requisitos de sistema
- [ ] 20.2. Passo a passo de instalação
- [ ] 20.3. Configuração de ambiente
- [ ] 20.4. Troubleshooting comum
- [ ] 20.5. Guia de atualização
- [ ] 20.6. Guia de backup e restore
- [ ] 20.7. FAQ

## ⏳ FASE 12: MELHORIAS DE UX/UI
### 21. Experiência do Usuário
- [ ] 21.1. Loading states em todas operações
- [ ] 21.2. Skeleton loaders
- [ ] 21.3. Animações suaves
- [x] 21.4. Toast notifications padronizadas
- [x] 21.5. Confirmações de ações destrutivas
- [ ] 21.6. Tooltips informativos
- [ ] 21.7. Modo escuro completo
- [x] 21.8. Responsividade mobile completa
- [ ] 21.9. PWA (Progressive Web App)
- [ ] 21.10. Offline mode básico

## ⏳ FASE 13: OTIMIZAÇÕES E PERFORMANCE
### 22. Performance
- [ ] 22.1. Lazy loading de imagens
- [ ] 22.2. Pagination de listagens
- [ ] 22.3. Cache de queries
- [ ] 22.4. Compressão de imagens automática
- [ ] 22.5. CDN para assets estáticos
- [ ] 22.6. Otimizar queries Supabase
- [ ] 22.7. Implementar service worker
- [x] 22.8. Realtime updates (Supabase Realtime)

---

## 📊 Progresso Geral

### Fases Completas: 8/13
- ✅ **Fase 1**: Correções Críticas e Fundamentos (70% completo)
- ✅ **Fase 2**: Gestão de Imóveis (100% completo)
- ✅ **Fase 3**: Configurações de Mídia (70% completo)
- ✅ **Fase 4**: Painel Administrativo (75% completo)
- ✅ **Fase 5**: Dashboard e Métricas (95% completo)
- ✅ **Fase 6**: Filtros e Buscas Avançadas (80% completo)
- ✅ **Fase 7**: Exportação e Impressão (85% completo)
- ✅ **Fase 8**: Branding e Personalização (75% completo)
- ✅ **Fase 9**: Autorizações e Documentos (70% completo)
- ✅ **Fase 10**: Estatísticas e Analytics (65% completo)
- ⏳ **Fase 11**: Instalação e Deploy (0% completo)
- ⏳ **Fase 12**: Melhorias de UX/UI (30% completo)
- ⏳ **Fase 13**: Otimizações e Performance (15% completo)

### Funcionalidades Recentes Implementadas:
✅ Correção WhatsApp para desktop/web
✅ Código sequencial automático para imóveis
✅ Sistema de upload de logo e favicon
✅ Tamanho responsivo do logo (mobile/tablet/desktop)
✅ Variáveis de sistema nos templates ({{app_name}}, {{logo_url}})
✅ Preview de branding com logo e favicon
✅ Atualização automática do dashboard em tempo real
✅ Dashboard completo de estatísticas por imóvel
✅ Interface de autorizações com assinatura digital
✅ Configurações de sistema com cores e mídia

### Próximas Prioridades:
1. Aplicar cores dinâmicas em todo o sistema
2. Gerar PDF das autorizações
3. Validação de CPF/CNPJ e CRECI
4. Gestão de usuários para admin
5. Melhorias de UX (loading states, animações)
6. Otimizações de performance
