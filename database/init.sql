-- ============================================
-- BASE DE DONNÉES : suivi_chantier
-- ============================================

-- Table utilisateurs (login sécurisé)
CREATE TABLE IF NOT EXISTS utilisateurs (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'utilisateur' CHECK (role IN ('admin', 'chef_projet', 'utilisateur')),
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table chantiers
CREATE TABLE IF NOT EXISTS chantiers (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  adresse TEXT NOT NULL,
  description TEXT,
  statut VARCHAR(50) DEFAULT 'non_commence' CHECK (statut IN ('non_commence', 'en_cours', 'termine', 'suspendu')),
  date_debut DATE,
  date_fin_prevue DATE,
  date_fin_reelle DATE,
  budget DECIMAL(15,2),
  createur_id INTEGER REFERENCES utilisateurs(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table intervenants
CREATE TABLE IF NOT EXISTS intervenants (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  telephone VARCHAR(20),
  email VARCHAR(150),
  entreprise VARCHAR(150),
  specialite VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table étapes
CREATE TABLE IF NOT EXISTS etapes (
  id SERIAL PRIMARY KEY,
  chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  titre VARCHAR(200) NOT NULL,
  description TEXT,
  statut VARCHAR(50) DEFAULT 'non_commence' CHECK (statut IN ('non_commence', 'en_cours', 'termine')),
  ordre INTEGER DEFAULT 1,
  date_debut DATE,
  date_fin DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table relation étape <-> intervenant
CREATE TABLE IF NOT EXISTS etape_intervenants (
  etape_id INTEGER REFERENCES etapes(id) ON DELETE CASCADE,
  intervenant_id INTEGER REFERENCES intervenants(id) ON DELETE CASCADE,
  PRIMARY KEY (etape_id, intervenant_id)
);

-- Table photos
CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  etape_id INTEGER NOT NULL REFERENCES etapes(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table documents
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  nom VARCHAR(200) NOT NULL,
  url VARCHAR(500) NOT NULL,
  type VARCHAR(50),
  taille INTEGER,
  uploader_id INTEGER REFERENCES utilisateurs(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_etapes_chantier ON etapes(chantier_id);
CREATE INDEX IF NOT EXISTS idx_photos_etape ON photos(etape_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_statut ON chantiers(statut);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);

-- Données de test
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role)
VALUES ('Admin', 'Système', 'admin@chantier.mg', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (email) DO NOTHING;
-- Mot de passe par défaut: password (à changer!)
