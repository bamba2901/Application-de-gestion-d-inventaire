# 📦 Système de gestion d'inventaire

Application web de gestion d'inventaire avec génération automatisée de rapports et recommandations de réapprovisionnement par IA générative.

**INF4173 – Projet Synthèse | UQO, Hiver 2026**
Cheikh Bamba Gueye & Mouhamadou Lamine Dial

---

## 🚀 Démarrage rapide

### Backend (API REST)
```bash
cd backend
npm install
cp .env.example .env   # optionnel : ajouter OPENAI_API_KEY
npm run dev
```
➡️ API disponible sur `http://localhost:4000`

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
➡️ Interface disponible sur `http://localhost:5173`

---

## 🔐 Compte de démonstration

| Utilisateur | Mot de passe | Rôle |
|-------------|-------------|------|
| `admin` | `admin123` | gestionnaire |

---

## 🧱 Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 18, Vite 5 |
| Backend | Node.js, Express 4 |
| Base de données | SQLite (better-sqlite3) |
| IAGen | OpenAI API / fallback local |

---

## 📁 Structure du projet

```
inventaire-projet/
├── backend/
│   ├── src/
│   │   ├── server.js     # API REST (toutes les routes)
│   │   └── db.js         # Base de données SQLite
│   ├── data/             # Fichier .db (créé automatiquement)
│   ├── .env.example      # Template de configuration
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx       # Application React principale
    │   ├── main.jsx      # Point d'entrée
    │   └── styles.css    # Styles globaux
    ├── index.html
    ├── vite.config.mjs
    └── package.json
```

---

## ✨ Fonctionnalités

- 🔐 Authentification avec deux rôles (gestionnaire / employé)
- 📦 Gestion complète des produits (CRUD)
- 🏷️ Gestion des catégories (CRUD)
- 🚚 Gestion des fournisseurs (CRUD)
- 🔄 Mouvements de stock (entrées / sorties)
- 🚨 Alertes automatiques (produits sous seuil)
- 📊 Tableau de bord en temps réel
- 🤖 Rapports et recommandations IA (local + OpenAI)
- 👥 Gestion des utilisateurs (gestionnaire uniquement)

---

## ⚙️ Configuration IAGen (optionnel)

Créer `backend/.env` :
```env
PORT=4000
OPENAI_API_KEY=sk-...
```
Sans clé API, la génération locale s'active automatiquement.

---

## 🔗 Dépôt GitHub

https://github.com/bamba2901/Application-de-gestion-d-inventaire
