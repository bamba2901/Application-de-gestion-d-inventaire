const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'inventaire.db');
const db = new Database(dbPath);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role     TEXT NOT NULL CHECK (role IN ('gestionnaire', 'employe'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name    TEXT NOT NULL,
    contact TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    category_id INTEGER,
    supplier_id INTEGER,
    unit_price  REAL    DEFAULT 0,
    min_stock   INTEGER DEFAULT 0,
    created_at  TEXT    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS stock_movements (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    type       TEXT    NOT NULL CHECK (type IN ('entree', 'sortie')),
    quantity   INTEGER NOT NULL,
    note       TEXT,
    created_at TEXT    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// ── Seed complet ─────────────────────────────────────────────────────────────
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
  // Utilisateurs
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
    .run('admin', 'admin123', 'gestionnaire');
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
    .run('employe', 'employe123', 'employe');

  // Catégories
  const catStmt = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
  const cat1 = catStmt.run('Informatique',   'Ordinateurs, composants et périphériques').lastInsertRowid;
  const cat2 = catStmt.run('Bureautique',    'Fournitures et équipements de bureau').lastInsertRowid;
  const cat3 = catStmt.run('Réseau',         'Équipements réseau et câblage').lastInsertRowid;
  const cat4 = catStmt.run('Consommables',   'Cartouches, papier et consommables divers').lastInsertRowid;

  // Fournisseurs
  const supStmt = db.prepare('INSERT INTO suppliers (name, contact) VALUES (?, ?)');
  const sup1 = supStmt.run('TechDistrib Inc.',    'techDistrib@gmail.com').lastInsertRowid;
  const sup2 = supStmt.run('Bureau Express',      'bureauExpress@gmail.com').lastInsertRowid;
  const sup3 = supStmt.run('RéseauPro Québec',    'reseauPro@gmail.com').lastInsertRowid;

  // Produits
  const prodStmt = db.prepare(
    'INSERT INTO products (name, category_id, supplier_id, unit_price, min_stock) VALUES (?, ?, ?, ?, ?)'
  );
  const p1 = prodStmt.run('Laptop Dell XPS 15',        cat1, sup1, 1899.99, 5).lastInsertRowid;
  const p2 = prodStmt.run('Souris Logitech MX Master',  cat1, sup1,   89.99, 10).lastInsertRowid;
  const p3 = prodStmt.run('Clavier mécanique RGB',      cat1, sup1,  129.99, 8).lastInsertRowid;
  const p4 = prodStmt.run('Écran 27" 4K Samsung',       cat1, sup1,  549.99, 4).lastInsertRowid;
  const p5 = prodStmt.run('Chaise de bureau ergonomique', cat2, sup2, 349.99, 3).lastInsertRowid;
  const p6 = prodStmt.run('Bureau assis-debout',         cat2, sup2, 699.99, 2).lastInsertRowid;
  const p7 = prodStmt.run('Switch réseau 24 ports',      cat3, sup3, 299.99, 3).lastInsertRowid;
  const p8 = prodStmt.run('Cartouche encre HP noir',     cat4, sup2,  24.99, 20).lastInsertRowid;

  // Mouvements de stock
  const mvStmt = db.prepare(
    'INSERT INTO stock_movements (product_id, type, quantity, note) VALUES (?, ?, ?, ?)'
  );
  // Entrées initiales
  mvStmt.run(p1, 'entree', 15, 'Commande initiale');
  mvStmt.run(p2, 'entree', 40, 'Commande initiale');
  mvStmt.run(p3, 'entree', 25, 'Commande initiale');
  mvStmt.run(p4, 'entree', 10, 'Commande initiale');
  mvStmt.run(p5, 'entree', 8,  'Commande initiale');
  mvStmt.run(p6, 'entree', 5,  'Commande initiale');
  mvStmt.run(p7, 'entree', 12, 'Commande initiale');
  mvStmt.run(p8, 'entree', 60, 'Commande initiale');
  // Sorties
  mvStmt.run(p1, 'sortie', 8,  'Déploiement équipe développement');
  mvStmt.run(p2, 'sortie', 15, 'Distribution employés');
  mvStmt.run(p3, 'sortie', 10, 'Distribution employés');
  mvStmt.run(p4, 'sortie', 7,  'Installation salles de réunion');
  mvStmt.run(p5, 'sortie', 6,  'Nouveaux bureaux étage 2');
  mvStmt.run(p6, 'sortie', 4,  'Nouveaux bureaux étage 2');
  mvStmt.run(p7, 'sortie', 10, 'Installation réseau salle serveur');
  mvStmt.run(p8, 'sortie', 45, 'Consommation mensuelle imprimantes');
  // Réapprovisionnements
  mvStmt.run(p1, 'entree', 5,  'Réapprovisionnement urgent');
  mvStmt.run(p2, 'entree', 20, 'Réapprovisionnement');
  mvStmt.run(p8, 'entree', 30, 'Réapprovisionnement cartouches');
  // Sorties supplémentaires pour données IAGen
  mvStmt.run(p2, 'sortie', 8,  'Remplacement souris défectueuses');
  mvStmt.run(p3, 'sortie', 5,  'Formation nouveau personnel');
  mvStmt.run(p8, 'sortie', 20, 'Consommation bimensuelle');

  console.log('✅ Seed complet : 2 utilisateurs, 4 catégories, 3 fournisseurs, 8 produits, 22 mouvements');
}

module.exports = db;
