const express = require('express');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Listar todos os usuários (admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.id, p.email, p.full_name, p.created_at, p.company_id,
        (SELECT json_agg(role) FROM user_roles WHERE user_id = p.id) as roles
      FROM profiles p
      ORDER BY p.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Buscar perfil do usuário autenticado
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, 
        (SELECT json_agg(role) FROM user_roles WHERE user_id = p.id) as roles,
        (SELECT row_to_json(c) FROM companies c WHERE c.id = p.company_id) as company
       FROM profiles p 
       WHERE p.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// Atualizar perfil do usuário autenticado
router.put('/me', authenticate, async (req, res) => {
  try {
    const updates = req.body;

    delete updates.id;
    delete updates.email; // Email não pode ser alterado via esta rota
    delete updates.created_at;
    delete updates.roles;

    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');

    const values = [req.user.id, ...Object.values(updates)];

    const result = await db.query(
      `UPDATE profiles SET ${setClause}, updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// Atualizar role de usuário (admin only)
router.put('/:id/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user', 'moderator'].includes(role)) {
      return res.status(400).json({ error: 'Role inválida' });
    }

    // Remover roles antigas
    await db.query('DELETE FROM user_roles WHERE user_id = $1', [id]);

    // Adicionar nova role
    await db.query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
      [id, role]
    );

    res.json({ message: 'Role atualizada com sucesso' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Erro ao atualizar role' });
  }
});

// Deletar usuário (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Não pode deletar a si mesmo
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Você não pode deletar sua própria conta' });
    }

    await db.query('DELETE FROM profiles WHERE id = $1', [id]);

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

module.exports = router;
