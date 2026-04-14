# StockFlow — Application de gestion d'inventaire

Application web complète de gestion d'inventaire avec tableau de bord analytique, suivi des mouvements de stock, système d'alertes et module de recommandations de réapprovisionnement.

**Auteurs :** Cheikh Bamba Gueye & Mouhamadou Lamine Dial  
**Cours :** INF4173 – Projet Synthèse | Université du Québec en Outaouais, Hiver 2026

---

## Prérequis

- Node.js v18 ou supérieur
- npm v9 ou supérieur

---

## Installation et démarrage

### 1. Cloner le dépôt

```bash
git clone https://github.com/bamba2901/Application-de-gestion-d-inventaire.git
cd Application-de-gestion-d-inventaire
```

### 2. Démarrer le backend

```bash
cd backend
npm install
node src/server.js
```

L'API est disponible sur `http://localhost:4000`

### 3. Démarrer le frontend

```bash
cd frontend
npm install
npm run dev
```

L'interface est disponible sur `http://localhost:5173`

### 4. Charger les données de démonstration (optionnel)

```bash
cd backend
node seed-demo.js
```

Insère 8 produits, 4 catégories, 3 fournisseurs et 31 mouvements de stock réalistes.

---

## Comptes de démonstration

| Utilisateur | Mot de passe | Rôle |
|-------------|--------------|------|
| `admin` | `admin123` | Gestionnaire |

> Le compte gestionnaire donne accès à toutes les fonctionnalités (CRUD, gestion des utilisateurs, rapports).

---

## Fonctionnalités

### Gestion de l'inventaire
- Authentification avec gestion des rôles (gestionnaire / employé)
- CRUD complet : produits, catégories, fournisseurs
- Enregistrement des mouvements de stock (entrées et sorties)
- Contrôle automatique du stock disponible avant chaque sortie

### Tableau de bord
- Vue d'ensemble en temps réel (produits, catégories, fournisseurs)
- Graphique d'évolution du stock net
- Histogramme des mouvements des 7 derniers jours
- Top 5 produits par niveau de stock
- Liste des mouvements récents

### Alertes
- Détection automatique des produits sous le seuil minimum
- Affichage du déficit et des informations fournisseur

### Analyse et recommandations
- Score de santé global du stock
- Analyse de l'état de chaque produit (OK / Critique / Rupture)
- Recommandations de réapprovisionnement classées par urgence
- Téléchargement du rapport complet en PDF

### Administration
- Création et suppression de comptes utilisateurs
- Gestion des accès par rôle

---

## Stack technique

| Couche | Technologies |
|--------|--------------|
| Frontend | React 18, Vite 5 |
| Backend | Node.js, Express 4 |
| Base de données | SQLite (better-sqlite3) |
| Génération PDF | jsPDF |
| Analyse de stock | OpenAI API (optionnel) |

---

## Configuration (optionnel)

Pour activer l'analyse textuelle des rapports, créer le fichier `backend/.env` :

```
PORT=4000
OPENAI_API_KEY=votre_cle_api
```

Sans clé API, le module d'analyse fonctionne en mode local avec les données de stock disponibles.

---

## Structure du projet

```
Application-de-gestion-d-inventaire/
├── backend/
│   ├── src/
│   │   ├── server.js       # Serveur Express + routes API
│   │   └── db.js           # Connexion SQLite + schéma
│   ├── data/               # Fichier base de données (généré)
│   ├── seed-demo.js        # Script de données de démonstration
│   └── package.json
└── frontend/
    ├── src/
│   │   ├── App.jsx         # Application React principale
│   │   └── styles.css      # Styles globaux
    └── package.json
```
