const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET;

/* ================= AUTH MIDDLEWARE ================= */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    const result = await pool.query(
      'SELECT id, email, role, statut, nom, prenom FROM utilisateurs WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Utilisateur introuvable' });
    }

    const user = result.rows[0];

    if (user.statut !== 'actif') {
      return res.status(403).json({ error: 'Compte non actif' });
    }

    req.utilisateur = user;
    next();

  } catch (error) {
    console.error('AUTH ERROR:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

/* ================= ADMIN ONLY ================= */
function requireAdmin(req, res, next) {
  if (!req.utilisateur) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  if (req.utilisateur.role !== 'admin') {
    return res.status(403).json({
      error: 'Accès réservé aux administrateurs',
      role_actuel: req.utilisateur.role
    });
  }

  next();
}

/* ================= ADMIN OU CHEF ================= */
function requireAdminOrChef(req, res, next) {
  const roles = ['admin', 'chef_chantier'];

  if (!req.utilisateur) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  if (!roles.includes(req.utilisateur.role)) {
    return res.status(403).json({
      error: 'Accès réservé admin ou chef de chantier',
      role_actuel: req.utilisateur.role
    });
  }

  next();
}

/* ================= UTILISATEUR ================= */
function requireUtilisateur(req, res, next) {
  if (!req.utilisateur) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  if (req.utilisateur.role !== 'utilisateur') {
    return res.status(403).json({
      error: 'Accès réservé aux utilisateurs standard',
      role_actuel: req.utilisateur.role
    });
  }

  next();
}

/* ================= RESOURCE ACCESS ================= */
async function checkResourceAccess(req, res, next) {
  try {
    const { chantierId } = req.params;

    if (!chantierId) return next();

    // Admin accès total
    if (req.utilisateur.role === 'admin') {
      return next();
    }

    // Vérifier existence chantier (utile)
    const chantier = await pool.query(
      'SELECT id FROM chantiers WHERE id = $1',
      [chantierId]
    );

    if (chantier.rows.length === 0) {
      return res.status(404).json({ error: 'Chantier introuvable' });
    }

    // Chef chantier ou utilisateur → accès autorisé (selon ton app)
    if (
      req.utilisateur.role === 'chef_chantier' ||
      req.utilisateur.role === 'utilisateur'
    ) {
      return next();
    }

    return res.status(403).json({ error: 'Accès refusé' });

  } catch (error) {
    console.error('RESOURCE ACCESS ERROR:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAdminOrChef,
  requireUtilisateur,
  checkResourceAccess
};