const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM chantiers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getById = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM chantiers WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Chantier non trouvé.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getEtapes = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.*,
        COALESCE(json_agg(
          json_build_object('id', i.id, 'nom', i.nom, 'prenom', i.prenom, 'role', i.role)
        ) FILTER (WHERE i.id IS NOT NULL), '[]') AS intervenants
       FROM etapes e
       LEFT JOIN etape_intervenants ei ON e.id = ei.etape_id
       LEFT JOIN intervenants i ON ei.intervenant_id = i.id
       WHERE e.chantier_id = $1
       GROUP BY e.id ORDER BY e.ordre, e.created_at`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const { id } = req.params;
    const [chantier, etapes] = await Promise.all([
      db.query('SELECT * FROM chantiers WHERE id = $1', [id]),
      db.query('SELECT statut, COUNT(*) as count FROM etapes WHERE chantier_id = $1 GROUP BY statut', [id]),
    ]);
    if (!chantier.rows.length) return res.status(404).json({ error: 'Chantier non trouvé.' });
    const stats = { total: 0, non_commence: 0, en_cours: 0, termine: 0 };
    etapes.rows.forEach(r => { stats[r.statut] = parseInt(r.count); stats.total += parseInt(r.count); });
    stats.progression = stats.total > 0 ? Math.round((stats.termine / stats.total) * 100) : 0;
    res.json({ chantier: chantier.rows[0], stats });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { nom, adresse, description, statut, date_debut, date_fin_prevue, budget } = req.body;
    const result = await db.query(
      `INSERT INTO chantiers (nom, adresse, description, statut, date_debut, date_fin_prevue, budget, createur_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [nom, adresse, description, statut || 'non_commence', date_debut, date_fin_prevue, budget, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { nom, adresse, description, statut, date_debut, date_fin_prevue, date_fin_reelle, budget } = req.body;
    const result = await db.query(
      `UPDATE chantiers SET nom=$1, adresse=$2, description=$3, statut=$4,
       date_debut=$5, date_fin_prevue=$6, date_fin_reelle=$7, budget=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [nom, adresse, description, statut, date_debut, date_fin_prevue, date_fin_reelle, budget, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Chantier non trouvé.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM chantiers WHERE id=$1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Chantier non trouvé.' });
    res.json({ message: 'Chantier supprimé.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
