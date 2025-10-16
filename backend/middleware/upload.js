const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB

// Criar diretórios se não existirem
const ensureDirectories = () => {
  const dirs = [
    path.join(UPLOAD_DIR, 'property-images'),
    path.join(UPLOAD_DIR, 'property-videos'),
    path.join(UPLOAD_DIR, 'property-documents'),
    path.join(UPLOAD_DIR, 'company-logos'),
    path.join(UPLOAD_DIR, 'system-branding'),
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureDirectories();

// Configuração de storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.params.type || 'property-images';
    const destPath = path.join(UPLOAD_DIR, type);
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Filtro de tipos de arquivo
const fileFilter = (req, file, cb) => {
  const type = req.params.type || 'property-images';
  
  const allowedTypes = {
    'property-images': /jpeg|jpg|png|webp/,
    'property-videos': /mp4|avi|mov|wmv/,
    'property-documents': /pdf|doc|docx|xls|xlsx/,
    'company-logos': /jpeg|jpg|png|svg|webp/,
    'system-branding': /jpeg|jpg|png|svg|webp/,
  };

  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  const regex = allowedTypes[type] || /jpeg|jpg|png|pdf/;

  if (regex.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido para ${type}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  
  next();
};

module.exports = {
  upload,
  handleMulterError,
};
