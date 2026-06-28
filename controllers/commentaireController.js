const db = require('../config/database');

exports.getByEtape = async (req, res) => {
  try {
    const r = await db.query(
      `SELECT c.*, u.nom, u.prenom FROM commentaires c
       JOIN utilisateurs u ON c.utilisateur_id = u.id
       WHERE c.etape_id = $1 ORDER BY c.created_at DESC`,
      [req.params.etapeId]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { etape_id, contenu } = req.body;
    if (!contenu?.trim()) return res.status(400).json({ error: 'Contenu vide.' });
    const r = await db.query(
      `INSERT INTO commentaires (etape_id, utilisateur_id, contenu)
       VALUES ($1, $2, $3) RETURNING *`,
      [etape_id, req.user.id, contenu]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const r = await db.query(
      'DELETE FROM commentaires WHERE id=$1 AND utilisateur_id=$2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (!r.rows.length) return res.status(403).json({ error: 'Non autorisé.' });
    res.json({ message: 'Commentaire supprimé.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};