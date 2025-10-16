const express = require('express');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Listar empresas
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM profiles WHERE company_id = c.id) as members_count
      FROM companies c
      ORDER BY c.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('List companies error:', error);
    res.status(500).json({ error: 'Erro ao listar empresas' });
  }
});

// Buscar empresa por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT c.*,
        (SELECT json_agg(row_to_json(p)) FROM 
          (SELECT id, email, full_name FROM profiles WHERE company_id = c.id) p
        ) as members
       FROM companies c
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Erro ao buscar empresa' });
  }
});

// Criar empresa (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, logo_url } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const result = await db.query(
      'INSERT INTO companies (name, logo_url) VALUES ($1, $2) RETURNING *',
      [name, logo_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Erro ao criar empresa' });
  }
});

// Atualizar empresa (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logo_url } = req.body;

    const result = await db.query(
      `UPDATE companies 
       SET name = COALESCE($1, name), 
           logo_url = COALESCE($2, logo_url),
           updated_at = NOW()
       WHERE id = $3 
       RETURNING *`,
      [name, logo_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ error: 'Erro ao atualizar empresa' });
  }
});

// Deletar empresa (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se há usuários vinculados
    const membersCheck = await db.query(
      'SELECT COUNT(*) FROM profiles WHERE company_id = $1',
      [id]
    );

    if (parseInt(membersCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar empresa com membros vinculados' 
      });
    }

    const result = await db.query(
      'DELETE FROM companies WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    res.json({ message: 'Empresa deletada com sucesso' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Erro ao deletar empresa' });
  }
});

module.exports = router;
