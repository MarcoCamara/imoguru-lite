const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const propertiesRoutes = require('./routes/properties');
const usersRoutes = require('./routes/users');
const companiesRoutes = require('./routes/companies');
const templatesRoutes = require('./routes/templates');
const emailRoutes = require('./routes/email');
const uploadRoutes = require('./routes/upload');
const filesRoutes = require('./routes/files');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files (uploads) - Only serve public assets
app.use('/uploads/property-images', express.static(path.join(__dirname, 'uploads/property-images')));
app.use('/uploads/company-logos', express.static(path.join(__dirname, 'uploads/company-logos')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/files', filesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${process.env.UPLOAD_DIR || './uploads'}`);
  console.log(`🌍 CORS origin: ${process.env.CORS_ORIGIN || '*'}`);
});

module.exports = app;
