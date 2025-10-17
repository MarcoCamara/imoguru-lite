# ImoGuru Backend - Guia de Instalação

## Requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

## Instalação Rápida

### 1. Instalar Dependências
```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente
```bash
cp .env.example .env
```

### 3. Configurar JWT Secret (CRÍTICO!)
**NUNCA use o secret padrão em produção!** Gere um secret forte:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copie o resultado e cole no arquivo `.env` na variável `JWT_SECRET`.

### 4. Configurar Banco de Dados
Edite o arquivo `.env` com as credenciais do PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=imoguru
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
```

### 5. Criar Database
```bash
createdb imoguru
```

Ou via PostgreSQL:
```sql
CREATE DATABASE imoguru;
```

### 6. Aplicar Migrations do Supabase
As migrations já foram aplicadas via Supabase. Certifique-se de que as seguintes tabelas existem:
- profiles
- user_roles
- user_passwords
- properties
- companies
- templates
- etc.

### 7. Configurar Resend (Email)
Obtenha uma API key em [resend.com](https://resend.com) e adicione ao `.env`:

```env
RESEND_API_KEY=re_sua_key_aqui
```

### 8. Iniciar Servidor
```bash
npm start
```

O servidor estará rodando em `http://localhost:3001`

## Configuração Frontend

No diretório raiz do projeto, crie um arquivo `.env.local`:

```env
VITE_API_URL=http://localhost:3001/api
```

## Verificação de Segurança

### JWT Secret
O servidor verifica automaticamente se o JWT_SECRET é:
- Pelo menos 32 caracteres
- Não é um valor fraco conhecido

Se você tentar iniciar com um secret fraco, o servidor **não iniciará**.

### Arquivo de Uploads
Os arquivos são organizados em:
- `/uploads/property-images` - Imagens públicas
- `/uploads/property-videos` - Vídeos (autenticação necessária)
- `/uploads/property-documents` - Documentos (autenticação necessária)
- `/uploads/company-logos` - Logos públicos

## Estrutura de Roles

O sistema usa 3 roles:
- `admin` - Acesso total
- `moderator` - Acesso moderado (futuro)
- `user` - Acesso básico

Para criar o primeiro admin, execute no PostgreSQL:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('uuid-do-usuario', 'admin');
```

## Endpoints Principais

### Autenticação
- POST `/api/auth/register` - Registro
- POST `/api/auth/login` - Login
- POST `/api/auth/reset-password` - Recuperar senha

### Imóveis
- GET `/api/properties` - Listar
- GET `/api/properties/:id` - Detalhes
- POST `/api/properties` - Criar (auth)
- PUT `/api/properties/:id` - Atualizar (auth)
- DELETE `/api/properties/:id` - Deletar (auth)

### Upload
- POST `/api/upload/property-images/:property_id` - Upload imagens (auth)
- POST `/api/upload/property-documents/:property_id` - Upload documentos (auth)
- POST `/api/upload/company-logos/:company_id` - Upload logo (auth + company member)

### Download Autenticado
- GET `/api/files/property-documents/:filename` - Download documento (auth)
- GET `/api/files/property-videos/:filename` - Download vídeo (auth)

## Troubleshooting

### Erro: "JWT_SECRET must be at least 32 characters"
Você precisa gerar um secret forte. Veja passo 3.

### Erro: "Database connection failed"
Verifique:
1. PostgreSQL está rodando
2. Credenciais em `.env` estão corretas
3. Database foi criado

### Erro: "Port 3001 already in use"
Mude a porta no `.env`:
```env
PORT=3002
```

### Erro: "Cannot find module"
Execute:
```bash
npm install
```

## Produção

### Variáveis de Ambiente Importantes
```env
NODE_ENV=production
CORS_ORIGIN=https://seu-dominio.com
JWT_EXPIRES_IN=1d  # Token expira em 1 dia
```

### Recomendações de Segurança
1. Use HTTPS
2. Configure rate limiting (adicione express-rate-limit)
3. Use um reverse proxy (nginx)
4. Configure backups automáticos do database
5. Monitore logs de acesso
6. Mantenha dependências atualizadas

## Scripts Disponíveis

```bash
npm start        # Inicia servidor
npm run dev      # Modo desenvolvimento (com nodemon)
npm test         # Testes (a implementar)
```

## Suporte
Para problemas, abra uma issue no GitHub.
