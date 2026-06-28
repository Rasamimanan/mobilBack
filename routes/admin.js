const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/roles');

// ================= MIDDLEWARE =================
// ✅ FIX: authenticateToken doit être appliqué AVANT requireAdmin,
// sinon req.utilisateur est toujours undefined et requireAdmin
// renvoie systématiquement 401 (toutes les routes admin étaient cassées).
router.use(authenticateToken);
router.use(requireAdmin);

// ================= LISTE USERS =================
router.get('/utilisateurs', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, nom, prenom, role, statut, created_at
       FROM utilisateurs
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================= UTILISATEURS EN ATTENTE =================
router.get('/utilisateurs-en-attente', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, nom, prenom, role, statut, created_at
       FROM utilisateurs
       WHERE statut = $1
       ORDER BY created_at ASC`,
      ['en_attente']
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================= APPROUVER =================
router.post('/approuver/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const check = await pool.query(
      'SELECT id, statut FROM utilisateurs WHERE id = $1',
      [id]
    );

    if (!check.rows.length) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    if (check.rows[0].statut !== 'en_attente') {
      return res.status(400).json({ error: 'Utilisateur déjà traité' });
    }

    const result = await pool.query(
      `UPDATE utilisateurs
       SET statut = 'actif'
       WHERE id = $1
       RETURNING id, email, statut`,
      [id]
    );

    res.json({
      message: 'Utilisateur approuvé',
      user: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================= REJETER =================
router.post('/rejeter/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === req.utilisateur.id) {
      return res.status(400).json({ error: 'Action impossible sur votre propre compte' });
    }

    const check = await pool.query(
      'SELECT id FROM utilisateurs WHERE id = $1',
      [id]
    );

    if (!check.rows.length) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    await pool.query(
      'DELETE FROM utilisateurs WHERE id = $1',
      [id]
    );

    res.json({ message: 'Utilisateur supprimé' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================= CHANGER ROLE =================
router.put('/role/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const rolesValides = ['admin', 'chef_chantier', 'utilisateur'];

    if (!rolesValides.includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    if (Number(id) === req.utilisateur.id && role !== 'admin') {
      return res.status(400).json({ error: 'Vous ne pouvez pas retirer votre propre rôle administrateur' });
    }

    const result = await pool.query(
      `UPDATE utilisateurs
       SET role = $1
       WHERE id = $2
       RETURNING id, email, role`,
      [role, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    res.json({
      message: 'Rôle mis à jour',
      user: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================= SUSPENDRE =================
router.put('/suspendre/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === req.utilisateur.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas suspendre votre propre compte' });
    }

    const result = await pool.query(
      `UPDATE utilisateurs
       SET statut = 'suspendu'
       WHERE id = $1
       RETURNING id, email, statut`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    res.json({
      message: 'Utilisateur suspendu',
      user: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================= REACTIVER =================
router.put('/reactiver/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE utilisateurs
       SET statut = 'actif'
       WHERE id = $1
       RETURNING id, email, statut`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    res.json({
      message: 'Utilisateur réactivé',
      user: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================= SUPPRIMER =================
router.delete('/utilisateurs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === req.utilisateur.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    const result = await pool.query(
      'DELETE FROM utilisateurs WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    res.json({ message: 'Utilisateur supprimé définitivement' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================= STATS =================
router.get('/stats', async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM utilisateurs');
    const actif = await pool.query("SELECT COUNT(*) FROM utilisateurs WHERE statut='actif'");
    const suspendu = await pool.query("SELECT COUNT(*) FROM utilisateurs WHERE statut='suspendu'");
    const attente = await pool.query("SELECT COUNT(*) FROM utilisateurs WHERE statut='en_attente'");

    res.json({
      total: +total.rows[0].count,
      actif: +actif.rows[0].count,
      suspendu: +suspendu.rows[0].count,
      en_attente: +attente.rows[0].count
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;