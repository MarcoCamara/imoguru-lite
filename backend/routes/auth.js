const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../utils/mailer');

const router = express.Router();

// Registro
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('full_name').trim().notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, full_name } = req.body;

      // Verificar se usuário já existe
      const existing = await db.query(
        'SELECT id FROM profiles WHERE email = $1',
        [email]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(password, 10);

      // Inserir usuário (simula auth.users + profiles)
      const result = await db.query(
        `INSERT INTO profiles (email, full_name) 
         VALUES ($1, $2) 
         RETURNING id, email, full_name`,
        [email, full_name]
      );

      const user = result.rows[0];

      // Armazenar hash de senha em tabela separada (você precisará criar esta tabela)
      await db.query(
        'INSERT INTO user_passwords (user_id, password_hash) VALUES ($1, $2)',
        [user.id, passwordHash]
      );

      // Atribuir role 'user' por padrão
      await db.query(
        'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
        [user.id, 'user']
      );

      // Gerar token
      const token = generateToken({ userId: user.id, email: user.email });

      res.status(201).json({
        user,
        token,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Buscar usuário
      const userResult = await db.query(
        'SELECT id, email, full_name FROM profiles WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const user = userResult.rows[0];

      // Buscar hash da senha
      const passwordResult = await db.query(
        'SELECT password_hash FROM user_passwords WHERE user_id = $1',
        [user.id]
      );

      if (passwordResult.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const { password_hash } = passwordResult.rows[0];

      // Verificar senha
      const isValid = await bcrypt.compare(password, password_hash);

      if (!isValid) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Gerar token
      const token = generateToken({ userId: user.id, email: user.email });

      res.json({
        user,
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  }
);

// Reset password request
router.post('/reset-password',
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      const userResult = await db.query(
        'SELECT id, email FROM profiles WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        // Não revelar se o email existe
        return res.json({ message: 'Se o email existir, enviaremos instruções' });
      }

      const user = userResult.rows[0];

      // Gerar token de reset (válido por 1 hora)
      const resetToken = generateToken({ userId: user.id, type: 'reset' });
      const resetUrl = `${process.env.CORS_ORIGIN}/reset-password?token=${resetToken}`;

      // Enviar email
      await sendPasswordResetEmail({
        to: user.email,
        resetToken,
        resetUrl,
      });

      res.json({ message: 'Email de recuperação enviado' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
  }
);

// Update password (after reset)
router.post('/update-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;

      // Verificar token
      const { verifyToken } = require('../utils/jwt');
      const decoded = verifyToken(token);

      if (decoded.type !== 'reset') {
        return res.status(400).json({ error: 'Token inválido' });
      }

      // Hash nova senha
      const passwordHash = await bcrypt.hash(password, 10);

      // Atualizar senha
      await db.query(
        'UPDATE user_passwords SET password_hash = $1 WHERE user_id = $2',
        [passwordHash, decoded.userId]
      );

      res.json({ message: 'Senha atualizada com sucesso' });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({ error: 'Erro ao atualizar senha' });
    }
  }
);

// Bootstrap Admin - Emergency access recovery
// Protected by BOOTSTRAP_SECRET for one-time setup
router.post('/bootstrap-admin', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    const bootstrapSecret = req.headers['x-bootstrap-secret'];

    // Validate bootstrap secret
    if (!process.env.BOOTSTRAP_SECRET || bootstrapSecret !== process.env.BOOTSTRAP_SECRET) {
      return res.status(403).json({ error: 'Invalid bootstrap secret' });
    }

    // Validate input
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full_name are required' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if user exists
    const existingUser = await db.query(
      'SELECT id FROM profiles WHERE email = $1',
      [email]
    );

    let userId;

    if (existingUser.rows.length > 0) {
      // User exists - update password
      userId = existingUser.rows[0].id;
      
      await db.query(
        `INSERT INTO user_passwords (user_id, password_hash)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET password_hash = $2, updated_at = now()`,
        [userId, passwordHash]
      );
    } else {
      // Create new user
      const newUser = await db.query(
        `INSERT INTO profiles (email, full_name)
         VALUES ($1, $2)
         RETURNING id`,
        [email, full_name]
      );
      
      userId = newUser.rows[0].id;

      // Insert password
      await db.query(
        'INSERT INTO user_passwords (user_id, password_hash) VALUES ($1, $2)',
        [userId, passwordHash]
      );
    }

    // Ensure admin role exists
    await db.query(
      `INSERT INTO user_roles (user_id, role)
       VALUES ($1, 'admin')
       ON CONFLICT (user_id, role) DO NOTHING`,
      [userId]
    );

    res.json({ 
      message: 'Bootstrap admin created/updated successfully',
      userId,
      email 
    });
  } catch (error) {
    console.error('Bootstrap admin error:', error);
    res.status(500).json({ error: 'Failed to bootstrap admin' });
  }
});

module.exports = router;
