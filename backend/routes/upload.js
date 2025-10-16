const express = require('express');
const path = require('path');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// Upload de imagens de imóveis
router.post('/property-images/:property_id',
  authenticate,
  (req, res, next) => {
    req.params.type = 'property-images';
    next();
  },
  upload.array('images', 20),
  handleMulterError,
  async (req, res) => {
    try {
      const { property_id } = req.params;

      // Verificar se propriedade pertence ao usuário
      const propertyCheck = await db.query(
        'SELECT id FROM properties WHERE id = $1 AND user_id = $2',
        [property_id, req.user.id]
      );

      if (propertyCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Imóvel não encontrado' });
      }

      const uploadedFiles = [];

      for (const file of req.files) {
        const url = `/uploads/property-images/${file.filename}`;
        
        const result = await db.query(
          `INSERT INTO property_images (property_id, url, caption, display_order)
           VALUES ($1, $2, $3, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM property_images WHERE property_id = $1))
           RETURNING *`,
          [property_id, url, file.originalname]
        );

        uploadedFiles.push(result.rows[0]);
      }

      res.status(201).json(uploadedFiles);
    } catch (error) {
      console.error('Upload property images error:', error);
      res.status(500).json({ error: 'Erro ao fazer upload das imagens' });
    }
  }
);

// Upload de vídeos de imóveis
router.post('/property-videos/:property_id',
  authenticate,
  (req, res, next) => {
    req.params.type = 'property-videos';
    next();
  },
  upload.single('video'),
  handleMulterError,
  async (req, res) => {
    try {
      const { property_id } = req.params;
      const { title } = req.body;

      const propertyCheck = await db.query(
        'SELECT id FROM properties WHERE id = $1 AND user_id = $2',
        [property_id, req.user.id]
      );

      if (propertyCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Imóvel não encontrado' });
      }

      const url = `/uploads/property-videos/${req.file.filename}`;

      const result = await db.query(
        'INSERT INTO property_videos (property_id, url, title) VALUES ($1, $2, $3) RETURNING *',
        [property_id, url, title || req.file.originalname]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Upload property video error:', error);
      res.status(500).json({ error: 'Erro ao fazer upload do vídeo' });
    }
  }
);

// Upload de documentos de imóveis
router.post('/property-documents/:property_id',
  authenticate,
  (req, res, next) => {
    req.params.type = 'property-documents';
    next();
  },
  upload.array('documents', 10),
  handleMulterError,
  async (req, res) => {
    try {
      const { property_id } = req.params;
      const { document_type } = req.body;

      const propertyCheck = await db.query(
        'SELECT id FROM properties WHERE id = $1 AND user_id = $2',
        [property_id, req.user.id]
      );

      if (propertyCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Imóvel não encontrado' });
      }

      const uploadedFiles = [];

      for (const file of req.files) {
        const url = `/uploads/property-documents/${file.filename}`;

        const result = await db.query(
          `INSERT INTO property_documents (property_id, file_url, file_name, document_type)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [property_id, url, file.originalname, document_type || 'outro']
        );

        uploadedFiles.push(result.rows[0]);
      }

      res.status(201).json(uploadedFiles);
    } catch (error) {
      console.error('Upload property documents error:', error);
      res.status(500).json({ error: 'Erro ao fazer upload dos documentos' });
    }
  }
);

// Upload de logos de empresas
router.post('/company-logos/:company_id',
  authenticate,
  (req, res, next) => {
    req.params.type = 'company-logos';
    next();
  },
  upload.single('logo'),
  handleMulterError,
  async (req, res) => {
    try {
      const { company_id } = req.params;

      const url = `/uploads/company-logos/${req.file.filename}`;

      const result = await db.query(
        'UPDATE companies SET logo_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [url, company_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Upload company logo error:', error);
      res.status(500).json({ error: 'Erro ao fazer upload do logo' });
    }
  }
);

module.exports = router;
