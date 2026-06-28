const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM intervenants ORDER BY nom, prenom');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getById = async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM intervenants WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Intervenant non trouvé.' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { nom, prenom, role, telephone, email, entreprise, specialite } = req.body;
    const r = await db.query(
      `INSERT INTO intervenants (nom, prenom, role, telephone, email, entreprise, specialite)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [nom, prenom, role, telephone, email, entreprise, specialite]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { nom, prenom, role, telephone, email, entreprise, specialite } = req.body;
    const r = await db.query(
      `UPDATE intervenants SET nom=$1,prenom=$2,role=$3,telephone=$4,email=$5,entreprise=$6,specialite=$7
       WHERE id=$8 RETURNING *`,
      [nom, prenom, role, telephone, email, entreprise, specialite, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Intervenant non trouvé.' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const r = await db.query('DELETE FROM intervenants WHERE id=$1 RETURNING *', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Intervenant non trouvé.' });
    res.json({ message: 'Intervenant supprimé.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
