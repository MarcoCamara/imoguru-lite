const express = require('express');
const path = require('path');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper function to check if user is admin
const isAdmin = async (userId) => {
  const result = await db.query(
    'SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2) as is_admin',
    [userId, 'admin']
  );
  return result.rows[0].is_admin;
};

// Authenticated download for property documents
router.get('/property-documents/:filename', authenticate, async (req, res) => {
  try {
    const { filename } = req.params;

    // Find the document and verify ownership
    const result = await db.query(
      `SELECT pd.*, p.user_id, p.company_id 
       FROM property_documents pd
       JOIN properties p ON p.id = pd.property_id
       WHERE pd.file_url LIKE $1`,
      ['%' + filename]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    const doc = result.rows[0];
    const userIsAdmin = await isAdmin(req.user.id);

    // Check authorization: owner, company member, or admin
    const userProfile = await db.query(
      'SELECT company_id FROM profiles WHERE id = $1',
      [req.user.id]
    );

    const userCompanyId = userProfile.rows[0]?.company_id;
    const canAccess = 
      doc.user_id === req.user.id || 
      (doc.company_id && doc.company_id === userCompanyId) ||
      userIsAdmin;

    if (!canAccess) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Send file
    const filePath = path.join(__dirname, '..', 'uploads', 'property-documents', filename);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Erro ao baixar documento' });
  }
});

// Authenticated download for property videos
router.get('/property-videos/:filename', authenticate, async (req, res) => {
  try {
    const { filename } = req.params;

    // Find the video and verify ownership
    const result = await db.query(
      `SELECT pv.*, p.user_id, p.company_id 
       FROM property_videos pv
       JOIN properties p ON p.id = pv.property_id
       WHERE pv.url LIKE $1`,
      ['%' + filename]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }

    const video = result.rows[0];
    const userIsAdmin = await isAdmin(req.user.id);

    // Check authorization: owner, company member, or admin
    const userProfile = await db.query(
      'SELECT company_id FROM profiles WHERE id = $1',
      [req.user.id]
    );

    const userCompanyId = userProfile.rows[0]?.company_id;
    const canAccess = 
      video.user_id === req.user.id || 
      (video.company_id && video.company_id === userCompanyId) ||
      userIsAdmin;

    if (!canAccess) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Send file
    const filePath = path.join(__dirname, '..', 'uploads', 'property-videos', filename);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download video error:', error);
    res.status(500).json({ error: 'Erro ao baixar vídeo' });
  }
});

module.exports = router;
