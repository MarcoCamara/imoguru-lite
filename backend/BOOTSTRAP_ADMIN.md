# Bootstrap Admin - Recuperação de Acesso de Emergência

## ⚠️ IMPORTANTE: Use isto APENAS uma vez para criar/recuperar acesso admin

## Passos para restaurar o acesso:

### 1. Configure o BOOTSTRAP_SECRET no backend/.env

```bash
# Gerar um secret forte:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Adicionar no backend/.env:
BOOTSTRAP_SECRET=sua_chave_secreta_gerada_aqui
```

### 2. Certifique-se de que o backend está rodando

```bash
cd backend
npm start
```

Verifique: http://localhost:3001/health (deve retornar `{"status":"ok"}`)

### 3. Execute o bootstrap-admin com curl

```bash
curl -X POST http://localhost:3001/api/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Secret: SUA_CHAVE_SECRETA_AQUI" \
  -d '{
    "email": "admin@imoguru.com",
    "password": "SenhaForte123!",
    "full_name": "Administrador"
  }'
```

**Resposta esperada:**
```json
{
  "message": "Bootstrap admin created/updated successfully",
  "userId": "...",
  "email": "admin@imoguru.com"
}
```

### 4. Limpe o localStorage do navegador

1. Abra o DevTools (F12)
2. Console → Digite: `localStorage.clear()`
3. Recarregue a página (F5)

### 5. Faça login com as credenciais criadas

- Email: admin@imoguru.com
- Senha: SenhaForte123! (ou a que você definiu)

## ✅ Verificações

- [ ] Backend rodando (http://localhost:3001/health → OK)
- [ ] BOOTSTRAP_SECRET configurado no backend/.env
- [ ] JWT_SECRET forte (≥32 caracteres) no backend/.env
- [ ] CORS_ORIGIN=http://localhost:5173 no backend/.env
- [ ] Banco de dados conectado (DB_* configurados)
- [ ] localStorage limpo no navegador

## 🔒 Segurança

**APÓS restaurar o acesso:**

1. **Remova ou proteja o endpoint** (opcional):
   - Comente a rota `/bootstrap-admin` em `backend/routes/auth.js`
   - Ou mantenha o BOOTSTRAP_SECRET secreto

2. **Mude a senha do admin** pelo painel administrativo

3. **Nunca compartilhe o BOOTSTRAP_SECRET**

## 🐛 Troubleshooting

### Erro: "Invalid bootstrap secret"
- Verifique se o BOOTSTRAP_SECRET no .env está correto
- Certifique-se de usar o header `X-Bootstrap-Secret`

### Erro: "Token inválido ou expirado" ao logar
- Verifique se o JWT_SECRET tem ≥32 caracteres
- Limpe o localStorage: `localStorage.clear()`

### Erro de conexão ao backend
- Verifique se o backend está rodando na porta 3001
- Confirme CORS_ORIGIN no backend/.env

### "Credenciais inválidas" ao logar
- Verifique se o bootstrap-admin retornou sucesso
- Confirme que as tabelas existem: `profiles`, `user_passwords`, `user_roles`
