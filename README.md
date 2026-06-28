# Backend - Suivi de Chantier API

## Installation
```bash
npm install
cp .env.example .env   # Configurer les variables
psql -U postgres -c "CREATE DATABASE suivi_chantier;"
psql -U postgres -d suivi_chantier -f database/init.sql
npm run dev
```

## Endpoints
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/register | Créer un compte |
| POST | /api/auth/login | Se connecter |
| GET | /api/auth/me | Profil connecté |
| GET | /api/chantiers | Liste chantiers |
| POST | /api/chantiers | Créer chantier |
| GET | /api/chantiers/:id/stats | Stats d'un chantier |
| GET | /api/etapes/chantier/:id | Étapes d'un chantier |
| POST | /api/etapes/:id/intervenants/:iid | Assigner intervenant |
| GET | /api/dashboard | Stats globales |

Toutes les routes (sauf /auth/login et /auth/register) requièrent le header:
`Authorization: Bearer <token>`
