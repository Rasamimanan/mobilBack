require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Créer le dossier uploads si absent
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ CORS élargi pour mobile
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

// ========== ROUTES ==========

// Routes publiques (pas d'authentification requise)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));

// Routes authentifiées
const { authenticateToken } = require('./middleware/roles');

// ✅ FIX #7: Supprimer la double définition de /api/chantiers
// Utiliser une seule route sans authentification pour les GET publics
app.use('/api/chantiers', require('./routes/chantiers'));
app.use('/api/etapes', require('./routes/etapes'));
app.use('/api/intervenants', require('./routes/intervenants'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/commentaires', require('./routes/commentaires'));
app.use('/api/depenses', require('./routes/depenses'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/recherche', require('./routes/recherche'));

// Route budget (authentifiée)
app.use('/api/budget', authenticateToken, require('./routes/budget'));

// ========== HEALTH CHECK ==========

app.get('/', (req, res) => res.json({ 
  message: '🏗️ API Suivi Chantier v3 ✅', 
  version: '3.0.0',
  timestamp: new Date().toISOString()
}));

// ========== 404 & ERROR HANDLERS ==========

app.use((req, res) => res.status(404).json({ 
  error: 'Route non trouvée.',
  path: req.path,
  method: req.method
}));

app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  res.status(500).json({ 
    error: 'Erreur serveur.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========== START SERVER ==========

// ✅ FIX #6: Écouter sur 0.0.0.0 pour accepter les connexions réseau
const HOST = '0.0.0.0';

app.listen(PORT, HOST, async () => {
  // Afficher l'IP locale du serveur
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
  }
  
  console.log(`
╔════════════════════════════════════════════╗
║   🚀 SERVEUR DÉMARRÉ AVEC SUCCÈS 🚀      ║
╠════════════════════════════════════════════╣
║ 🌐 Local:     http://localhost:${PORT}   
║ 📱 Réseau:    http://${localIP}:${PORT}
║ 🔗 API:       http://${localIP}:${PORT}/api
╚════════════════════════════════════════════╝
  `);
  
  // Vérifier la base de données
  try {
    const pool = require('./config/database');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connexion à la base de données réussie');
  } catch (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;