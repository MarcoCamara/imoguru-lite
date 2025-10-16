const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Listar propriedades (com filtros)
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      purpose,
      property_type,
      status,
      city,
      state,
      min_price,
      max_price,
      bedrooms,
      archived,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    let query = `
      SELECT p.*, 
        (SELECT json_agg(row_to_json(pi)) FROM 
          (SELECT * FROM property_images WHERE property_id = p.id ORDER BY display_order LIMIT 5) pi
        ) as images
      FROM properties p
      WHERE p.user_id = $1
    `;
    
    const params = [req.user.id];
    let paramIndex = 2;

    if (purpose) {
      query += ` AND p.purpose = $${paramIndex}`;
      params.push(purpose);
      paramIndex++;
    }

    if (property_type) {
      query += ` AND p.property_type = $${paramIndex}`;
      params.push(property_type);
      paramIndex++;
    }

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (city) {
      query += ` AND p.city ILIKE $${paramIndex}`;
      params.push(`%${city}%`);
      paramIndex++;
    }

    if (state) {
      query += ` AND p.state = $${paramIndex}`;
      params.push(state);
      paramIndex++;
    }

    if (min_price) {
      query += ` AND COALESCE(p.sale_price, p.rental_price) >= $${paramIndex}`;
      params.push(min_price);
      paramIndex++;
    }

    if (max_price) {
      query += ` AND COALESCE(p.sale_price, p.rental_price) <= $${paramIndex}`;
      params.push(max_price);
      paramIndex++;
    }

    if (bedrooms) {
      query += ` AND p.bedrooms >= $${paramIndex}`;
      params.push(bedrooms);
      paramIndex++;
    }

    if (archived !== undefined) {
      query += ` AND p.archived = $${paramIndex}`;
      params.push(archived === 'true');
      paramIndex++;
    }

    if (search) {
      query += ` AND (p.title ILIKE $${paramIndex} OR p.code ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (page - 1) * limit);

    const result = await db.query(query, params);

    // Contar total
    let countQuery = 'SELECT COUNT(*) FROM properties p WHERE p.user_id = $1';
    const countResult = await db.query(countQuery, [req.user.id]);

    res.json({
      properties: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('List properties error:', error);
    res.status(500).json({ error: 'Erro ao listar imóveis' });
  }
});

// Buscar propriedade por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT p.*,
        (SELECT json_agg(row_to_json(pi)) FROM property_images pi WHERE pi.property_id = p.id ORDER BY display_order) as images,
        (SELECT json_agg(row_to_json(pv)) FROM property_videos pv WHERE pv.property_id = p.id) as videos,
        (SELECT json_agg(row_to_json(pd)) FROM property_documents pd WHERE pd.property_id = p.id) as documents,
        (SELECT row_to_json(ps) FROM property_spouse ps WHERE ps.property_id = p.id) as spouse,
        (SELECT json_agg(row_to_json(pp)) FROM property_partners pp WHERE pp.property_id = p.id) as partners,
        (SELECT json_agg(row_to_json(np)) FROM nearby_points np WHERE np.property_id = p.id) as nearby_points
       FROM properties p
       WHERE p.id = $1 AND p.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ error: 'Erro ao buscar imóvel' });
  }
});

// Criar propriedade
router.post('/',
  authenticate,
  [
    body('title').trim().notEmpty(),
    body('purpose').isIn(['venda', 'aluguel', 'ambos']),
    body('property_type').notEmpty(),
    body('condition').isIn(['novo', 'usado']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const propertyData = { ...req.body, user_id: req.user.id };

      // Gerar código automático
      const codeResult = await db.query('SELECT generate_property_code() as code');
      propertyData.code = codeResult.rows[0].code;

      const columns = Object.keys(propertyData).join(', ');
      const values = Object.values(propertyData);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      const result = await db.query(
        `INSERT INTO properties (${columns}) VALUES (${placeholders}) RETURNING *`,
        values
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create property error:', error);
      res.status(500).json({ error: 'Erro ao criar imóvel' });
    }
  }
);

// Atualizar propriedade
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    delete updates.id;
    delete updates.user_id;
    delete updates.created_at;

    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');

    const values = [id, ...Object.values(updates), req.user.id];

    const result = await db.query(
      `UPDATE properties SET ${setClause}, updated_at = NOW() 
       WHERE id = $1 AND user_id = $${values.length} 
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Erro ao atualizar imóvel' });
  }
});

// Deletar propriedade
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM properties WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }

    res.json({ message: 'Imóvel deletado com sucesso' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Erro ao deletar imóvel' });
  }
});

module.exports = router;
