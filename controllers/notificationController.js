const db = require('../config/database');

exports.getMine = async (req, res) => {
  try {
    const r = await db.query(
      'SELECT * FROM notifications WHERE utilisateur_id=$1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    const nonLues = r.rows.filter(n => !n.lu).length;
    res.json({ notifications: r.rows, nonLues });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.marquerLu = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET lu=TRUE WHERE id=$1 AND utilisateur_id=$2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marqué comme lu.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.marquerTousLus = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET lu=TRUE WHERE utilisateur_id=$1',
      [req.user.id]
    );
    res.json({ message: 'Toutes les notifications marquées comme lues.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};