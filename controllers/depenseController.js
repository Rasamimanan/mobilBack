// ✅ colonnes corrigées : description, date (PAS titre, date_depense, createur_id)
const db = require('../config/database');

exports.getByChantier = async (req, res) => {
  try {
    const r = await db.query(
      `SELECT * FROM depenses WHERE chantier_id = $1 ORDER BY date DESC`,
      [req.params.chantierId]
    );
    const total = r.rows.reduce((sum, d) => sum + parseFloat(d.montant || 0), 0);
    res.json({ depenses: r.rows, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const r = await db.query(
      `SELECT categorie, SUM(montant) as total, COUNT(*) as count
       FROM depenses WHERE chantier_id = $1 GROUP BY categorie`,
      [req.params.chantierId]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { chantier_id, etape_id, description, montant, categorie, date } = req.body;
    if (!chantier_id || !montant) {
      return res.status(400).json({ error: 'chantier_id et montant sont requis' });
    }
    const r = await db.query(
      `INSERT INTO depenses (chantier_id, etape_id, description, montant, categorie, date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [chantier_id, etape_id || null, description || '', montant,
       categorie || 'autre', date || new Date().toISOString().split('T')[0]]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const r = await db.query('DELETE FROM depenses WHERE id=$1 RETURNING *', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Dépense introuvable' });
    res.json({ message: 'Dépense supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};