const express = require('express');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Listar templates de compartilhamento
router.get('/share', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM share_templates
      ORDER BY platform, created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('List share templates error:', error);
    res.status(500).json({ error: 'Erro ao listar templates' });
  }
});

// Criar template de compartilhamento (admin only)
router.post('/share', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, platform, fields, message_format, include_images, max_images, is_default } = req.body;

    const result = await db.query(
      `INSERT INTO share_templates 
       (name, platform, fields, message_format, include_images, max_images, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, platform, JSON.stringify(fields), message_format, include_images, max_images, is_default]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create share template error:', error);
    res.status(500).json({ error: 'Erro ao criar template' });
  }
});

// Atualizar template de compartilhamento (admin only)
router.put('/share/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    delete updates.id;
    delete updates.created_at;

    if (updates.fields) {
      updates.fields = JSON.stringify(updates.fields);
    }

    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');

    const values = [id, ...Object.values(updates)];

    const result = await db.query(
      `UPDATE share_templates SET ${setClause}, updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update share template error:', error);
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
});

// Listar templates de impressão
router.get('/print', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM print_templates
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('List print templates error:', error);
    res.status(500).json({ error: 'Erro ao listar templates' });
  }
});

// Criar template de impressão (admin only)
router.post('/print', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, content, is_default } = req.body;

    const result = await db.query(
      `INSERT INTO print_templates (name, content, is_default)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, content, is_default]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create print template error:', error);
    res.status(500).json({ error: 'Erro ao criar template' });
  }
});

// Atualizar template de impressão (admin only)
router.put('/print/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content, is_default } = req.body;

    const result = await db.query(
      `UPDATE print_templates 
       SET name = COALESCE($1, name),
           content = COALESCE($2, content),
           is_default = COALESCE($3, is_default),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [name, content, is_default, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update print template error:', error);
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
});

// Listar templates de autorização
router.get('/authorization', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM authorization_templates
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('List authorization templates error:', error);
    res.status(500).json({ error: 'Erro ao listar templates' });
  }
});

module.exports = router;
