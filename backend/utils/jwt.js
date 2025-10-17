const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Validate JWT_SECRET strength
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required in environment variables');
}

if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long for security');
}

const WEAK_SECRETS = [
  'your_super_secret_jwt_key_change_this_in_production',
  'secret',
  'password',
  'changeme',
  'jwt_secret'
];

if (WEAK_SECRETS.some(weak => JWT_SECRET.toLowerCase().includes(weak))) {
  throw new Error('JWT_SECRET appears to be using a weak or default value. Please generate a strong random secret.');
}

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
