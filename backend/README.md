# ImoGuru Backend API

Backend Express.js para o sistema ImoGuru de gestão de imóveis.

## 🚀 Tecnologias

- Express.js
- PostgreSQL
- JWT Authentication
- Multer (uploads)
- Resend (emails)
- Bcrypt (hash de senhas)

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Conta Resend (para envio de emails)

## 🔧 Instalação

1. Clone o repositório e entre na pasta backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações.

4. Crie a tabela de senhas no PostgreSQL:
```sql
CREATE TABLE IF NOT EXISTS user_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_passwords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own password"
  ON user_passwords FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own password"
  ON user_passwords FOR UPDATE
  USING (auth.uid() = user_id);
```

5. Inicie o servidor:
```bash
npm start
```

Para desenvolvimento com auto-reload:
```bash
npm run dev
```

## 📚 Endpoints

### Autenticação
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/reset-password` - Solicitar reset de senha
- `POST /api/auth/update-password` - Atualizar senha

### Imóveis
- `GET /api/properties` - Listar imóveis
- `GET /api/properties/:id` - Buscar imóvel
- `POST /api/properties` - Criar imóvel
- `PUT /api/properties/:id` - Atualizar imóvel
- `DELETE /api/properties/:id` - Deletar imóvel

### Usuários
- `GET /api/users` - Listar usuários (admin)
- `GET /api/users/me` - Perfil do usuário
- `PUT /api/users/me` - Atualizar perfil
- `PUT /api/users/:id/role` - Atualizar role (admin)
- `DELETE /api/users/:id` - Deletar usuário (admin)

### Empresas
- `GET /api/companies` - Listar empresas
- `GET /api/companies/:id` - Buscar empresa
- `POST /api/companies` - Criar empresa (admin)
- `PUT /api/companies/:id` - Atualizar empresa (admin)
- `DELETE /api/companies/:id` - Deletar empresa (admin)

### Templates
- `GET /api/templates/share` - Listar templates de compartilhamento
- `POST /api/templates/share` - Criar template (admin)
- `PUT /api/templates/share/:id` - Atualizar template (admin)
- `GET /api/templates/print` - Listar templates de impressão
- `POST /api/templates/print` - Criar template (admin)
- `PUT /api/templates/print/:id` - Atualizar template (admin)

### Email
- `POST /api/email/send-property` - Enviar email de imóvel

### Upload
- `POST /api/upload/property-images/:property_id` - Upload de imagens
- `POST /api/upload/property-videos/:property_id` - Upload de vídeos
- `POST /api/upload/property-documents/:property_id` - Upload de documentos
- `POST /api/upload/company-logos/:company_id` - Upload de logo

## 🔐 Autenticação

Todas as rotas protegidas requerem um token JWT no header:
```
Authorization: Bearer <token>
```

## 📁 Estrutura de Pastas

```
backend/
├── config/
│   └── database.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── routes/
│   ├── auth.js
│   ├── properties.js
│   ├── users.js
│   ├── companies.js
│   ├── templates.js
│   ├── email.js
│   └── upload.js
├── utils/
│   ├── jwt.js
│   └── mailer.js
├── uploads/
│   ├── property-images/
│   ├── property-videos/
│   ├── property-documents/
│   └── company-logos/
├── server.js
└── package.json
```

## 🛡️ Segurança

- Senhas hasheadas com bcrypt
- JWT para autenticação
- RLS (Row Level Security) no PostgreSQL
- Validação de inputs com express-validator
- Helmet.js para headers de segurança
- CORS configurável

## 📝 Licença

MIT
