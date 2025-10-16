const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { sendPropertyEmail, sendPasswordResetEmail } = require('../utils/mailer');

const router = express.Router();

// Enviar email de imóvel
router.post('/send-property',
  authenticate,
  [
    body('to').isEmail().normalizeEmail(),
    body('property_id').isUUID(),
    body('message').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { to, property_id, message } = req.body;

      // Buscar dados do imóvel
      const propertyResult = await db.query(
        `SELECT p.*,
          (SELECT json_agg(row_to_json(pi)) FROM 
            (SELECT url FROM property_images WHERE property_id = p.id ORDER BY display_order LIMIT 5) pi
          ) as images
         FROM properties p
         WHERE p.id = $1 AND p.user_id = $2`,
        [property_id, req.user.id]
      );

      if (propertyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Imóvel não encontrado' });
      }

      const property = propertyResult.rows[0];
      
      // Construir URL pública do imóvel
      const propertyUrl = `${process.env.CORS_ORIGIN}/property/${property.id}`;
      
      // Preparar dados para o email
      const emailData = {
        to,
        property: {
          ...property,
          url: propertyUrl,
        },
        message: message || `Olá! Gostaria de compartilhar este imóvel com você.`,
        images: property.images ? property.images.map(img => img.url) : [],
      };

      // Enviar email
      await sendPropertyEmail(emailData);

      // Atualizar estatísticas
      await db.query(
        `UPDATE property_statistics 
         SET shares_email = shares_email + 1, views_email = views_email + 1
         WHERE property_id = $1`,
        [property_id]
      );

      res.json({ message: 'Email enviado com sucesso' });
    } catch (error) {
      console.error('Send property email error:', error);
      res.status(500).json({ error: 'Erro ao enviar email' });
    }
  }
);

module.exports = router;
