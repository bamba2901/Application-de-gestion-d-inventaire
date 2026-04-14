/**
 * Script de données de démonstration — INF4173
 * Exécuter UNE seule fois : node seed-demo.js
 */
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'inventaire.db'));

// ── Nettoyage des données de test ──────────────────────────────────────────
db.prepare('DELETE FROM stock_movements WHERE product_id IN (SELECT id FROM products WHERE name IN (?,?))').run('usb', 'usb1');
db.prepare('DELETE FROM products WHERE name IN (?,?)').run('usb', 'usb1');

// ── Catégories ─────────────────────────────────────────────────────────────
const cats = [
  { name: 'Informatique',  description: 'Ordinateurs, composants et accessoires' },
  { name: 'Périphériques', description: 'Claviers, souris, écrans' },
  { name: 'Réseau',        description: 'Câbles, routeurs, switches' },
  { name: 'Fournitures',   description: 'Papier, stylos, cartouches d\'encre' },
];
const catIds = {};
for (const c of cats) {
  const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(c.name);
  if (existing) { catIds[c.name] = existing.id; continue; }
  const r = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(c.name, c.description);
  catIds[c.name] = r.lastInsertRowid;
}
console.log('✅ Catégories:', catIds);

// ── Fournisseurs ───────────────────────────────────────────────────────────
const sups = [
  { name: 'TechDistrib Inc.',  contact: 'tech@techdistrib.ca' },
  { name: 'Bureau Express',    contact: '1-800-BUREAU' },
  { name: 'RéseauPro Québec', contact: 'commandes@reseaupro.qc.ca' },
];
const supIds = {};
for (const s of sups) {
  const existing = db.prepare('SELECT id FROM suppliers WHERE name = ?').get(s.name);
  if (existing) { supIds[s.name] = existing.id; continue; }
  const r = db.prepare('INSERT INTO suppliers (name, contact) VALUES (?, ?)').run(s.name, s.contact);
  supIds[s.name] = r.lastInsertRowid;
}
// Mettre à jour le fournisseur existant (Mouhamadou Lamine) si besoin
const existingSup = db.prepare('SELECT id FROM suppliers WHERE contact = ?').get('8193182624');
if (existingSup) {
  db.prepare('UPDATE suppliers SET name = ?, contact = ? WHERE id = ?')
    .run('TechDistrib Inc.', 'tech@techdistrib.ca', existingSup.id);
  supIds['TechDistrib Inc.'] = existingSup.id;
}
console.log('✅ Fournisseurs:', supIds);

// Récupérer les IDs des fournisseurs depuis la BD
const allSups = db.prepare('SELECT id, name FROM suppliers').all();
const sup1 = allSups.find(s => s.name.includes('Tech'))?.id || allSups[0]?.id;
const sup2 = allSups.find(s => s.name.includes('Bureau'))?.id || allSups[1]?.id || sup1;
const sup3 = allSups.find(s => s.name.includes('Réseau') || s.name.includes('Reseau'))?.id || allSups[2]?.id || sup1;

// ── Mise à jour des produits existants ────────────────────────────────────
db.prepare('UPDATE products SET category_id = ?, supplier_id = ?, unit_price = ?, min_stock = ? WHERE name = ?')
  .run(catIds['Informatique'], sup1, 1200.00, 3, 'Ordinateur');
db.prepare('UPDATE products SET category_id = ?, supplier_id = ?, unit_price = ?, min_stock = ? WHERE name = ?')
  .run(catIds['Périphériques'], sup1, 45.99, 5, 'Clavier');

// ── Nouveaux produits ──────────────────────────────────────────────────────
const newProducts = [
  { name: 'Souris optique',     category_id: catIds['Périphériques'], supplier_id: sup1, unit_price: 29.99, min_stock: 5 },
  { name: 'Écran 24 pouces',    category_id: catIds['Informatique'],  supplier_id: sup1, unit_price: 349.99, min_stock: 2 },
  { name: 'Switch 8 ports',     category_id: catIds['Réseau'],        supplier_id: sup3, unit_price: 89.99,  min_stock: 3 },
  { name: 'Câble HDMI 2m',      category_id: catIds['Réseau'],        supplier_id: sup3, unit_price: 12.99,  min_stock: 10 },
  { name: 'Cartouche d\'encre', category_id: catIds['Fournitures'],   supplier_id: sup2, unit_price: 24.99,  min_stock: 8 },
  { name: 'Rame de papier A4',  category_id: catIds['Fournitures'],   supplier_id: sup2, unit_price: 8.49,   min_stock: 20 },
];
const productIds = {};
for (const p of newProducts) {
  const existing = db.prepare('SELECT id FROM products WHERE name = ?').get(p.name);
  if (existing) { productIds[p.name] = existing.id; continue; }
  const r = db.prepare('INSERT INTO products (name, category_id, supplier_id, unit_price, min_stock) VALUES (?,?,?,?,?)')
    .run(p.name, p.category_id, p.supplier_id, p.unit_price, p.min_stock);
  productIds[p.name] = r.lastInsertRowid;
}

// Inclure les produits existants
const existingOrdinateur = db.prepare('SELECT id FROM products WHERE name = ?').get('Ordinateur');
const existingClavier    = db.prepare('SELECT id FROM products WHERE name = ?').get('Clavier');
if (existingOrdinateur) productIds['Ordinateur'] = existingOrdinateur.id;
if (existingClavier)    productIds['Clavier']    = existingClavier.id;
console.log('✅ Produits:', productIds);

// ── Mouvements réalistes ───────────────────────────────────────────────────
// Supprimer les mouvements existants pour repartir proprement
db.prepare('DELETE FROM stock_movements').run();

const now = new Date();
const daysAgo = (n) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d.toISOString().replace('T', ' ').slice(0, 19);
};

const mvts = [
  // Ordinateur
  { product: 'Ordinateur',       type: 'entree', quantity: 10, note: 'Commande initiale', days: 30 },
  { product: 'Ordinateur',       type: 'sortie', quantity: 2,  note: 'Vente client',      days: 25 },
  { product: 'Ordinateur',       type: 'sortie', quantity: 3,  note: 'Vente client',      days: 18 },
  { product: 'Ordinateur',       type: 'sortie', quantity: 2,  note: 'Vente client',      days: 10 },
  { product: 'Ordinateur',       type: 'entree', quantity: 5,  note: 'Réapprovisionnement', days: 7 },
  { product: 'Ordinateur',       type: 'sortie', quantity: 1,  note: 'Vente client',      days: 2 },
  // Clavier
  { product: 'Clavier',          type: 'entree', quantity: 15, note: 'Stock initial',     days: 30 },
  { product: 'Clavier',          type: 'sortie', quantity: 4,  note: 'Vente',             days: 22 },
  { product: 'Clavier',          type: 'sortie', quantity: 5,  note: 'Vente',             days: 14 },
  { product: 'Clavier',          type: 'sortie', quantity: 6,  note: 'Vente',             days: 5 },
  // Souris
  { product: 'Souris optique',   type: 'entree', quantity: 20, note: 'Stock initial',     days: 28 },
  { product: 'Souris optique',   type: 'sortie', quantity: 5,  note: 'Vente',             days: 20 },
  { product: 'Souris optique',   type: 'sortie', quantity: 7,  note: 'Vente',             days: 12 },
  { product: 'Souris optique',   type: 'sortie', quantity: 4,  note: 'Vente',             days: 4 },
  // Écran
  { product: 'Écran 24 pouces',  type: 'entree', quantity: 6,  note: 'Stock initial',     days: 25 },
  { product: 'Écran 24 pouces',  type: 'sortie', quantity: 2,  note: 'Vente client',      days: 15 },
  { product: 'Écran 24 pouces',  type: 'sortie', quantity: 1,  note: 'Vente client',      days: 6 },
  // Switch
  { product: 'Switch 8 ports',   type: 'entree', quantity: 8,  note: 'Stock initial',     days: 20 },
  { product: 'Switch 8 ports',   type: 'sortie', quantity: 3,  note: 'Vente réseau',      days: 10 },
  { product: 'Switch 8 ports',   type: 'sortie', quantity: 2,  note: 'Vente réseau',      days: 3 },
  // Câble HDMI
  { product: 'Câble HDMI 2m',    type: 'entree', quantity: 30, note: 'Stock initial',     days: 20 },
  { product: 'Câble HDMI 2m',    type: 'sortie', quantity: 8,  note: 'Vente',             days: 12 },
  { product: 'Câble HDMI 2m',    type: 'sortie', quantity: 10, note: 'Vente',             days: 5 },
  { product: 'Câble HDMI 2m',    type: 'sortie', quantity: 6,  note: 'Vente',             days: 1 },
  // Cartouche
  { product: 'Cartouche d\'encre', type: 'entree', quantity: 12, note: 'Stock initial',   days: 18 },
  { product: 'Cartouche d\'encre', type: 'sortie', quantity: 4,  note: 'Usage bureau',    days: 10 },
  { product: 'Cartouche d\'encre', type: 'sortie', quantity: 5,  note: 'Usage bureau',    days: 3 },
  // Papier A4
  { product: 'Rame de papier A4', type: 'entree', quantity: 50, note: 'Stock initial',    days: 15 },
  { product: 'Rame de papier A4', type: 'sortie', quantity: 10, note: 'Usage bureau',     days: 10 },
  { product: 'Rame de papier A4', type: 'sortie', quantity: 15, note: 'Usage bureau',     days: 5 },
  { product: 'Rame de papier A4', type: 'sortie', quantity: 12, note: 'Usage bureau',     days: 1 },
];

const insertMvt = db.prepare(
  'INSERT INTO stock_movements (product_id, type, quantity, note, created_at) VALUES (?,?,?,?,?)'
);
let count = 0;
for (const m of mvts) {
  const pid = productIds[m.product];
  if (!pid) { console.warn(`⚠️  Produit introuvable: ${m.product}`); continue; }
  insertMvt.run(pid, m.type, m.quantity, m.note, daysAgo(m.days));
  count++;
}
console.log(`✅ ${count} mouvements insérés`);

// ── Résumé final ───────────────────────────────────────────────────────────
const stats = {
  categories: db.prepare('SELECT COUNT(*) AS c FROM categories').get().c,
  suppliers:  db.prepare('SELECT COUNT(*) AS c FROM suppliers').get().c,
  products:   db.prepare('SELECT COUNT(*) AS c FROM products').get().c,
  movements:  db.prepare('SELECT COUNT(*) AS c FROM stock_movements').get().c,
};
console.log('\n📊 État final de la BD :', stats);
console.log('\n✅ Seed terminé. Redémarre le backend (node src/server.js).\n');
db.close();
