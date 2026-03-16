# 📦 Application de gestion d'inventaire

Conception et développement d'une application web de gestion d'inventaire avec génération automatisée de rapports et recommandations de réapprovisionnement par IA générative.

**INF4173 – Projet Synthèse | UQO, Hiver 2026**  
Cheikh Bamba Gueye & Mouhamadou Lamine Dial

---

## 🚀 Démarrage

### Backend
```bash
cd backend
npm install
npm run dev
```
➡️ API sur `http://localhost:4000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
➡️ Interface sur `http://localhost:5173`

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

## ✅ Fonctionnalités implémentées

- 🔐 Authentification (gestionnaire / employé)
- 📦 Gestion des produits (CRUD)
- 🏷️ Gestion des catégories (CRUD)
- 🚚 Gestion des fournisseurs (CRUD)
- 🔄 Mouvements de stock (entrées / sorties)
- 🚨 Alertes produits sous seuil
- 📊 Tableau de bord
- 🤖 Rapports et recommandations IA
- 👥 Gestion des utilisateurs

## 🔄 En cours

- Tests manuels complets
- IA phase 2
- Rapport final

---

## ⚙️ Configuration IAGen (optionnel)

Créer `backend/.env` :
```
PORT=4000
OPENAI_API_KEY=sk-...
```
Sans clé API, la génération locale s'active automatiquement.