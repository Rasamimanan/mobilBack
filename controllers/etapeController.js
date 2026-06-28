const db = require('../config/database');

const withIntervenants = `
  SELECT e.*,
    COALESCE(json_agg(
      json_build_object('id',i.id,'nom',i.nom,'prenom',i.prenom,'role',i.role)
    ) FILTER (WHERE i.id IS NOT NULL), '[]') AS intervenants
  FROM etapes e
  LEFT JOIN etape_intervenants ei ON e.id = ei.etape_id
  LEFT JOIN intervenants i ON ei.intervenant_id = i.id`;

exports.getByChantier = async (req, res) => {
  try {
    const r = await db.query(`${withIntervenants} WHERE e.chantier_id=$1 GROUP BY e.id ORDER BY e.ordre, e.created_at`, [req.params.chantierId]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getById = async (req, res) => {
  try {
    const r = await db.query(`${withIntervenants} WHERE e.id=$1 GROUP BY e.id`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Étape non trouvée.' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { chantier_id, titre, description, statut, ordre, date_debut, date_fin } = req.body;
    const r = await db.query(
      `INSERT INTO etapes (chantier_id, titre, description, statut, ordre, date_debut, date_fin)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [chantier_id, titre, description, statut || 'non_commence', ordre || 1, date_debut, date_fin]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { titre, description, statut, ordre, date_debut, date_fin } = req.body;
    const r = await db.query(
      `UPDATE etapes SET titre=$1,description=$2,statut=$3,ordre=$4,date_debut=$5,date_fin=$6,updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [titre, description, statut, ordre, date_debut, date_fin, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Étape non trouvée.' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const r = await db.query('DELETE FROM etapes WHERE id=$1 RETURNING *', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Étape non trouvée.' });
    res.json({ message: 'Étape supprimée.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.assignIntervenant = async (req, res) => {
  try {
    const { etapeId, intervenantId } = req.params;
    await db.query('INSERT INTO etape_intervenants (etape_id, intervenant_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [etapeId, intervenantId]);
    res.status(201).json({ message: 'Intervenant assigné.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.removeIntervenant = async (req, res) => {
  try {
    const { etapeId, intervenantId } = req.params;
    await db.query('DELETE FROM etape_intervenants WHERE etape_id=$1 AND intervenant_id=$2', [etapeId, intervenantId]);
    res.json({ message: 'Intervenant retiré.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
