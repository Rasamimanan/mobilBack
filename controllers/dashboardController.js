const db = require('../config/database');

exports.getStats = async (req, res) => {
  try {
    const [chantiers, etapes, intervenants] = await Promise.all([
      db.query('SELECT statut, COUNT(*) as count FROM chantiers GROUP BY statut'),
      db.query('SELECT statut, COUNT(*) as count FROM etapes GROUP BY statut'),
      db.query('SELECT COUNT(*) as count FROM intervenants'),
    ]);

    const chantiersStats = { total: 0, non_commence: 0, en_cours: 0, termine: 0, suspendu: 0 };
    chantiers.rows.forEach(r => { chantiersStats[r.statut] = parseInt(r.count); chantiersStats.total += parseInt(r.count); });

    const etapesStats = { total: 0, non_commence: 0, en_cours: 0, termine: 0 };
    etapes.rows.forEach(r => { etapesStats[r.statut] = parseInt(r.count); etapesStats.total += parseInt(r.count); });

    res.json({
      chantiers: chantiersStats,
      etapes: etapesStats,
      intervenants: parseInt(intervenants.rows[0].count),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
