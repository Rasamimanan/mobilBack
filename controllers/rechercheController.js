const db = require('../config/database');

exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ chantiers: [], etapes: [], intervenants: [] });
    const like = `%${q}%`;

    const [chantiers, etapes, intervenants] = await Promise.all([
      db.query(
        `SELECT id, nom, adresse, statut FROM chantiers
         WHERE nom ILIKE $1 OR adresse ILIKE $1 OR description ILIKE $1 LIMIT 10`,
        [like]
      ),
      db.query(
        `SELECT e.id, e.titre, e.statut, c.nom as chantier_nom, e.chantier_id
         FROM etapes e JOIN chantiers c ON e.chantier_id = c.id
         WHERE e.titre ILIKE $1 OR e.description ILIKE $1 LIMIT 10`,
        [like]
      ),
      db.query(
        `SELECT id, nom, prenom, role, entreprise FROM intervenants
         WHERE nom ILIKE $1 OR prenom ILIKE $1 OR role ILIKE $1 OR entreprise ILIKE $1 LIMIT 10`,
        [like]
      ),
    ]);

    res.json({
      chantiers: chantiers.rows,
      etapes: etapes.rows,
      intervenants: intervenants.rows,
      total: chantiers.rows.length + etapes.rows.length + intervenants.rows.length,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};