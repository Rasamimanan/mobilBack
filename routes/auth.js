const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/roles');
const { genererCode, envoyerCodeReset } = require('../utils/mailer');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET manquant dans .env');
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function maskEmail(email) {
  const [userPart, domain] = email.split('@');
  if (!domain) return email;
  const visible = userPart.slice(0, Math.min(2, userPart.length));
  return `${visible}${'*'.repeat(Math.max(userPart.length - visible.length, 3))}@${domain}`;
}

// ================= REGISTER =================
router.post('/register', async (req, res) => {
  try {
    const { email, password, nom, prenom, role } = req.body;

    if (!email || !password || !nom) {
      return res.status(400).json({ error: 'Nom, email et mot de passe requis' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const emailClean = email.toLowerCase().trim();

    const exist = await pool.query('SELECT id FROM utilisateurs WHERE email = $1', [emailClean]);
    if (exist.rows.length > 0) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }

    const roleDemande = ['chef_chantier', 'utilisateur'].includes(role) ? role : 'utilisateur';
    const hash = await bcryptjs.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO utilisateurs
       (email, password, nom, prenom, role, statut, email_verifie)
       VALUES ($1,$2,$3,$4,$5,'en_attente', true)
       RETURNING id, email, nom, prenom, role, statut`,
      [emailClean, hash, nom, prenom || '', roleDemande]
    );

    return res.status(201).json({
      message: 'Compte créé. Il est désormais en attente de validation par un administrateur.',
      utilisateur: result.rows[0]
    });

  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================= LOGIN =================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const emailClean = email.toLowerCase().trim();

    const result = await pool.query('SELECT * FROM utilisateurs WHERE email = $1', [emailClean]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = result.rows[0];

    const isValid = await bcryptjs.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // ✅ seul le statut du compte (validation admin) bloque la connexion
    if (user.statut === 'en_attente') {
      return res.status(403).json({
        error: 'Votre compte est en attente de validation par un administrateur',
        code_erreur: 'EN_ATTENTE_ADMIN'
      });
    }

    if (user.statut !== 'actif') {
      return res.status(403).json({
        error: `Compte ${user.statut}`,
        code_erreur: 'COMPTE_INACTIF'
      });
    }

    const token = generateToken(user);
    const { password: _, ...userSafe } = user;

    return res.json({
      message: 'Connexion réussie',
      token,
      utilisateur: userSafe
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================= MOT DE PASSE OUBLIÉ =================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, nom, prenom } = req.body;

    let matches;

    if (email) {
      const emailClean = email.toLowerCase().trim();
      matches = (await pool.query(
        'SELECT id, email, nom, prenom FROM utilisateurs WHERE email = $1',
        [emailClean]
      )).rows;
    } else if (nom && prenom) {
      matches = (await pool.query(
        `SELECT id, email, nom, prenom FROM utilisateurs
         WHERE LOWER(nom) = LOWER($1) AND LOWER(prenom) = LOWER($2)`,
        [nom.trim(), prenom.trim()]
      )).rows;
    } else {
      return res.status(400).json({ error: "Indiquez votre email, ou votre nom et prénom" });
    }

    if (matches.length === 0) {
      return res.status(404).json({ error: 'Aucun compte trouvé avec ces informations' });
    }

    if (matches.length > 1) {
      return res.json({
        matches: matches.map(u => ({ id: u.id, email_masque: maskEmail(u.email) }))
      });
    }

    const user = matches[0];
    const code = genererCode();

    await pool.query('UPDATE utilisateurs SET code_validation = $1 WHERE id = $2', [code, user.id]);

    try {
      await envoyerCodeReset(user.email, `${user.prenom || ''} ${user.nom}`.trim(), code);
    } catch (mailErr) {
      console.error('ENVOI EMAIL ERROR:', mailErr.message);
      return res.status(500).json({ error: "Impossible d'envoyer l'email pour le moment" });
    }

    return res.json({
      message: 'Un code de réinitialisation a été envoyé par email',
      email_masque: maskEmail(user.email)
    });

  } catch (err) {
    console.error('FORGOT PASSWORD ERROR:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/forgot-password/confirm', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Compte requis' });
    }

    const result = await pool.query('SELECT id, email, nom, prenom FROM utilisateurs WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compte introuvable' });
    }

    const user = result.rows[0];
    const code = genererCode();

    await pool.query('UPDATE utilisateurs SET code_validation = $1 WHERE id = $2', [code, user.id]);

    try {
      await envoyerCodeReset(user.email, `${user.prenom || ''} ${user.nom}`.trim(), code);
    } catch (mailErr) {
      console.error('ENVOI EMAIL ERROR:', mailErr.message);
      return res.status(500).json({ error: "Impossible d'envoyer l'email pour le moment" });
    }

    return res.json({
      message: 'Un code de réinitialisation a été envoyé par email',
      email_masque: maskEmail(user.email)
    });

  } catch (err) {
    console.error('FORGOT PASSWORD CONFIRM ERROR:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, nouveau_mot_de_passe } = req.body;

    if (!email || !code || !nouveau_mot_de_passe) {
      return res.status(400).json({ error: 'Email, code et nouveau mot de passe requis' });
    }

    if (nouveau_mot_de_passe.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const emailClean = email.toLowerCase().trim();

    const result = await pool.query(
      'SELECT id, code_validation FROM utilisateurs WHERE email = $1',
      [emailClean]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const user = result.rows[0];

    if (!user.code_validation || String(user.code_validation) !== String(code).trim()) {
      return res.status(400).json({ error: 'Code invalide' });
    }

    const hash = await bcryptjs.hash(nouveau_mot_de_passe, 10);

    await pool.query(
      `UPDATE utilisateurs
       SET password = $1, code_validation = NULL
       WHERE id = $2`,
      [hash, user.id]
    );

    return res.json({ message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' });

  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});
// ================= CHANGER MOT DE PASSE (connecté) =================
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;

    if (!ancien_mot_de_passe || !nouveau_mot_de_passe) {
      return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
    }
    if (nouveau_mot_de_passe.length < 6) {
      return res.status(400).json({ error: 'Minimum 6 caractères' });
    }

    const result = await pool.query(
      'SELECT password FROM utilisateurs WHERE id = $1',
      [req.utilisateur.id]
    );

    const isValid = await bcryptjs.compare(ancien_mot_de_passe, result.rows[0].password);
    if (!isValid) {
      return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
    }

    const hash = await bcryptjs.hash(nouveau_mot_de_passe, 10);
    await pool.query('UPDATE utilisateurs SET password = $1 WHERE id = $2', [hash, req.utilisateur.id]);

    return res.json({ message: 'Mot de passe modifié avec succès' });

  } catch (err) {
    console.error('CHANGE PASSWORD ERROR:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});
// ================= ME =================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, nom, prenom, role, statut, created_at
       FROM utilisateurs WHERE id = $1`,
      [req.utilisateur.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    return res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================= LOGOUT =================
router.post('/logout', authenticateToken, (req, res) => {
  return res.json({ message: 'Déconnexion réussie' });
});

module.exports = router;