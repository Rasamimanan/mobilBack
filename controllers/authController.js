const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET;

/* ================= TOKEN ================= */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, password, role } = req.body;

    // validation simple
    if (!email || !password || !nom) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const emailLower = email.toLowerCase();

    // check email exist
    const exists = await db.query(
      'SELECT id FROM utilisateurs WHERE email = $1',
      [emailLower]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }

    // hash password
    const hash = await bcrypt.hash(password, 10);

    // insert user (statut actif direct pour ton app)
    const result = await db.query(
      `INSERT INTO utilisateurs 
        (nom, prenom, email, password, role, statut)
       VALUES 
        ($1, $2, $3, $4, $5, 'actif')
       RETURNING id, nom, prenom, email, role, statut`,
      [nom, prenom, emailLower, hash, role || 'utilisateur']
    );

    const user = result.rows[0];

    const token = generateToken(user);

    return res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      user,
    });

  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const emailLower = email.toLowerCase();

    // find user
    const result = await db.query(
      'SELECT * FROM utilisateurs WHERE email = $1',
      [emailLower]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = result.rows[0];

    // check statut (IMPORTANT avec ta DB)
    if (user.statut !== 'actif') {
      return res.status(403).json({
        error: 'Compte non actif (en attente ou suspendu)'
      });
    }

    // check password
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = generateToken(user);

    // remove password before sending
    const { password: _, ...userSafe } = user;

    return res.json({
      message: 'Connexion réussie',
      token,
      user: userSafe,
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};