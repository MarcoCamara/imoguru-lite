const { verifyToken } = require('../utils/jwt');
const db = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Buscar usuário no banco
    const result = await db.query(
      'SELECT id, email, full_name FROM profiles WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Verificar se usuário tem role de admin
    const result = await db.query(
      'SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2) as is_admin',
      [req.user.id, 'admin']
    );

    if (!result.rows[0].is_admin) {
      return res.status(403).json({ error: 'Acesso negado: apenas administradores' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

module.exports = {
  authenticate,
  requireAdmin,
};
