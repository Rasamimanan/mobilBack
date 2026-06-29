const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
});

// Test connexion avy hatrany amin'ny fanombohana
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
{}
['bcryptjs', 'cors', 'dotenv', 'express', 'express-validator', 'jsonwebtoken', 'multer', 'nodemailer', 'pg']