const db = require('../config/database');
const path = require('path');
const fs = require('fs');

exports.getByEtape = async (req, res) => {
  try {
    const r = await db.query(
      'SELECT * FROM photos WHERE etape_id = $1 ORDER BY created_at DESC',
      [req.params.etapeId]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.upload = async (req, res) => {
  try {
    const { etape_id, description } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoyé' });
    if (!etape_id) return res.status(400).json({ error: 'etape_id requis' });

    const url = `/uploads/${req.file.filename}`;
    const r = await db.query(
      'INSERT INTO photos (etape_id, url, description) VALUES ($1,$2,$3) RETURNING *',
      [etape_id, url, description || '']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const r = await db.query('DELETE FROM photos WHERE id=$1 RETURNING *', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Photo non trouvée' });

    const filePath = path.join(__dirname, '..', r.rows[0].url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'Photo supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};