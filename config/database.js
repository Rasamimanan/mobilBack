const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.query('SELECT 1', (err) => {
  if (err) {
    console.error('❌ Connexion PostgreSQL échouée:', err.message);
    console.error('👉 Vérifier: PostgreSQL démarré? Mot de passe? Base existe?');
  } else {
    console.log('✅ Connecté à PostgreSQL');
  }
});

pool.on('error', (err) => console.error('❌ Erreur PostgreSQL:', err.message));

module.exports = pool;