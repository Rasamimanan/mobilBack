const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET;

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // 1. Vérifier header
    if (!authHeader) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    // 2. Extraire token
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    // 3. Vérifier token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    // 4. Vérifier user en base
    const result = await db.query(
      'SELECT id, email, role, statut, nom, prenom FROM utilisateurs WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Utilisateur introuvable' });
    }

    const user = result.rows[0];

    // 5. Vérifier statut compte
    if (user.statut !== 'actif') {
      return res.status(403).json({
        error: 'Compte non actif'
      });
    }

    // 6. Injecter user dans req
    req.user = user;

    next();

  } catch (error) {
    console.error('AUTH MIDDLEWARE ERROR:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { authMiddleware };