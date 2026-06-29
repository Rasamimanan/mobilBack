require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ✅ Créer le dossier uploads si absent
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Dossier uploads créé');
}

// ✅ CORS élargi pour mobile + Render
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Servir les images uploadées (sans authentification)
app.use('/uploads', express.static(uploadDir));

// ============================
// ROUTES
// ============================
const authenticateToken = require('./middleware/roles').authenticateToken;

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/admin',        require('./routes/admin'));
app.use('/api/chantiers',    authenticateToken, require('./routes/chantiers'));
app.use('/api/etapes',       authenticateToken, require('./routes/etapes'));
app.use('/api/depenses',     require('./routes/depenses'));
app.use('/api/intervenants', authenticateToken, require('./routes/intervenants'));
app.use('/api/commentaires', authenticateToken, require('./routes/commentaires'));
app.use('/api/photos',       require('./routes/photos'));
app.use('/api/dashboard',    authenticateToken, require('./routes/dashboard'));
app.use('/api/notifications',authenticateToken, require('./routes/notifications'));
app.use('/api/recherche',    authenticateToken, require('./routes/recherche'));
app.use('/api/budget',       authenticateToken, require('./routes/budget'));

// ============================
// HEALTHCHECK (Render ping)
// ============================
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app:    'Suivi Chantier API',
    version:'1.0.0',
    db:     process.env.DATABASE_URL ? 'Neon Cloud' : 'PostgreSQL local',
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ============================
// 404
// ============================
app.use((req, res) => res.status(404).json({ error: 'Route introuvable' }));

// ============================
// START — ✅ 0.0.0.0 pour Render
// ============================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📦 Environnement : ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Base de données : ${process.env.DATABASE_URL ? 'Neon Cloud' : `${process.env.DB_HOST}/${process.env.DB_NAME}`}`);
});