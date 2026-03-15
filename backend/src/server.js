require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const db      = require('./db');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ── Auth middleware ────────────────────────────────────────────────────────
function requireRole(roles = []) {
  return (req, res, next) => {
    const role = req.header('X-ROLE');
    if (!role || (roles.length && !roles.includes(role))) {
      return res.status(403).json({ message: 'Accès interdit' });
    }
    next();
  };
}

// ── Helper : stock calculé ─────────────────────────────────────────────────
function getStock(productId) {
  const row = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'entree' THEN quantity ELSE 0 END), 0) AS ins,
      COALESCE(SUM(CASE WHEN type = 'sortie' THEN quantity ELSE 0 END), 0) AS outs
    FROM stock_movements WHERE product_id = ?
  `).get(productId);
  return (row.ins || 0) - (row.outs || 0);
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare(
    'SELECT id, username, role FROM users WHERE username = ? AND password = ?'
  ).get(username, password);
  if (!user) return res.status(401).json({ message: 'Identifiants invalides' });
  res.json({ user });
});

// ══════════════════════════════════════════════════════════════════════════════
// UTILISATEURS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/users', requireRole(['gestionnaire']), (req, res) => {
  const rows = db.prepare('SELECT id, username, role FROM users ORDER BY id').all();
  res.json(rows);
});

app.post('/api/users', requireRole(['gestionnaire']), (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !['gestionnaire', 'employe'].includes(role)) {
    return res.status(400).json({ message: 'Données invalides' });
  }
  try {
    const info = db.prepare(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)'
    ).run(username, password, role);
    res.status(201).json({ id: info.lastInsertRowid, username, role });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ message: "Ce nom d'utilisateur existe déjà" });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.delete('/api/users/:id', requireRole(['gestionnaire']), (req, res) => {
  const u = db.prepare('SELECT username FROM users WHERE id = ?').get(req.params.id);
  if (!u) return res.status(404).json({ message: 'Utilisateur introuvable' });
  if (u.username === 'admin') {
    return res.status(403).json({ message: 'Impossible de supprimer le compte admin' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// ══════════════════════════════════════════════════════════════════════════════
// CATÉGORIES
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/categories', (req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY name').all());
});

app.post('/api/categories', requireRole(['gestionnaire']), (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Nom requis' });
  const info = db.prepare(
    'INSERT INTO categories (name, description) VALUES (?, ?)'
  ).run(name, description || null);
  res.status(201).json({ id: info.lastInsertRowid, name, description });
});

app.put('/api/categories/:id', requireRole(['gestionnaire']), (req, res) => {
  const { name, description } = req.body;
  db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?')
    .run(name, description || null, req.params.id);
  res.json({ id: Number(req.params.id), name, description });
});

app.delete('/api/categories/:id', (req, res) => {
  console.log('DELETE category', req.params.id, 'role:', req.header('X-ROLE'));
  db.prepare('UPDATE products SET category_id = NULL WHERE category_id = ?').run(req.params.id);
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.status(204).end();
});


// ══════════════════════════════════════════════════════════════════════════════
// FOURNISSEURS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/suppliers', (req, res) => {
  res.json(db.prepare('SELECT * FROM suppliers ORDER BY name').all());
});

app.post('/api/suppliers', requireRole(['gestionnaire']), (req, res) => {
  const { name, contact } = req.body;
  if (!name) return res.status(400).json({ message: 'Nom requis' });
  const info = db.prepare(
    'INSERT INTO suppliers (name, contact) VALUES (?, ?)'
  ).run(name, contact || null);
  res.status(201).json({ id: info.lastInsertRowid, name, contact });
});

app.put('/api/suppliers/:id', requireRole(['gestionnaire']), (req, res) => {
  const { name, contact } = req.body;
  db.prepare('UPDATE suppliers SET name = ?, contact = ? WHERE id = ?')
    .run(name, contact || null, req.params.id);
  res.json({ id: Number(req.params.id), name, contact });
});

app.delete('/api/suppliers/:id', (req, res) => {
  console.log('DELETE supplier', req.params.id, 'role:', req.header('X-ROLE'));
  db.prepare('UPDATE products SET supplier_id = NULL WHERE supplier_id = ?').run(req.params.id);
  db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// ══════════════════════════════════════════════════════════════════════════════
// PRODUITS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/products', (req, res) => {
  const products = db.prepare(`
    SELECT p.*, c.name AS category_name, s.name AS supplier_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers  s ON p.supplier_id  = s.id
    ORDER BY p.created_at DESC
  `).all();
  res.json(products.map((p) => ({ ...p, current_stock: getStock(p.id) })));
});

app.post('/api/products', requireRole(['gestionnaire']), (req, res) => {
  const { name, category_id, supplier_id, unit_price, min_stock } = req.body;
  if (!name) return res.status(400).json({ message: 'Nom requis' });
  const info = db.prepare(`
    INSERT INTO products (name, category_id, supplier_id, unit_price, min_stock)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, category_id || null, supplier_id || null, unit_price || 0, min_stock || 0);
  res.status(201).json({ id: info.lastInsertRowid, name, unit_price: unit_price || 0, min_stock: min_stock || 0 });
});

app.put('/api/products/:id', requireRole(['gestionnaire']), (req, res) => {
  const { name, category_id, supplier_id, unit_price, min_stock } = req.body;
  db.prepare(`
    UPDATE products SET name=?, category_id=?, supplier_id=?, unit_price=?, min_stock=?
    WHERE id=?
  `).run(name, category_id || null, supplier_id || null, unit_price || 0, min_stock || 0, req.params.id);
  res.json({ id: Number(req.params.id), name });
});

app.delete('/api/products/:id', requireRole(['gestionnaire']), (req, res) => {
  db.prepare('DELETE FROM stock_movements WHERE product_id = ?').run(req.params.id);
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// ══════════════════════════════════════════════════════════════════════════════
// MOUVEMENTS DE STOCK
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/stock-movements', (req, res) => {
  const rows = db.prepare(`
    SELECT m.*, p.name AS product_name
    FROM stock_movements m
    JOIN products p ON m.product_id = p.id
    ORDER BY m.created_at DESC
  `).all();
  res.json(rows);
});

app.post('/api/stock-movements', requireRole(['gestionnaire', 'employe']), (req, res) => {
  const { product_id, type, quantity, note } = req.body;
  if (!['entree', 'sortie'].includes(type)) {
    return res.status(400).json({ message: 'Type invalide (entree ou sortie)' });
  }
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: 'La quantité doit être positive' });
  }
  if (type === 'sortie' && quantity > getStock(product_id)) {
    return res.status(400).json({ message: 'Stock insuffisant pour cette sortie' });
  }
  const info = db.prepare(
    'INSERT INTO stock_movements (product_id, type, quantity, note) VALUES (?, ?, ?, ?)'
  ).run(product_id, type, quantity, note || null);
  res.status(201).json({ id: info.lastInsertRowid, product_id, type, quantity });
});

// ══════════════════════════════════════════════════════════════════════════════
// ALERTES
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/alerts/low-stock', (req, res) => {
  const products = db.prepare(`
    SELECT p.*, c.name AS category_name, s.name AS supplier_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers  s ON p.supplier_id  = s.id
  `).all();
  const lowStock = products
    .map((p) => ({ ...p, current_stock: getStock(p.id) }))
    .filter((p) => p.current_stock < p.min_stock);
  res.json(lowStock);
});

// ══════════════════════════════════════════════════════════════════════════════
// TABLEAU DE BORD
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/dashboard', (req, res) => {
  const totalProducts   = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  const totalCategories = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
  const totalSuppliers  = db.prepare('SELECT COUNT(*) AS c FROM suppliers').get().c;
  const recentMovements = db.prepare(`
    SELECT m.*, p.name AS product_name FROM stock_movements m
    JOIN products p ON m.product_id = p.id
    ORDER BY m.created_at DESC LIMIT 10
  `).all();
  const allProducts = db.prepare('SELECT id, min_stock FROM products').all();
  const lowStockCount = allProducts.filter((p) => getStock(p.id) < p.min_stock).length;
  res.json({ totalProducts, totalCategories, totalSuppliers, lowStockCount, recentMovements });
});

// ══════════════════════════════════════════════════════════════════════════════
// IAGen
// ══════════════════════════════════════════════════════════════════════════════
function localReport(summaryLines, lowStock) {
  let t = '=== Rapport de synthèse (génération locale) ===\n\n';
  t += '1. État du stock\n' + summaryLines.join('\n') + '\n\n';
  t += '2. Produits critiques\n';
  t += lowStock.length === 0
    ? 'Aucun produit sous le seuil minimum.\n'
    : lowStock.map((p) => `  ⚠️  ${p.name} : stock ${p.stock} < seuil ${p.min_stock}`).join('\n') + '\n';
  t += '\n3. Recommandation\nConsultez l\'onglet Recommandations IA. Configurez OPENAI_API_KEY dans backend/.env pour activer la génération par IA.\n';
  return t;
}

function localRecommendations(rows) {
  const sorted = rows.filter((r) => r.total_sorties > 0).sort((a, b) => b.total_sorties - a.total_sorties);
  let t = '=== Recommandations de réapprovisionnement (génération locale) ===\n\n';
  if (sorted.length === 0) {
    return t + 'Aucune sortie enregistrée. Enregistrez des mouvements pour obtenir des recommandations.\n';
  }
  sorted.forEach((r, i) => {
    const qty = Math.max(r.total_sorties, 10);
    t += `${i + 1}. ${r.name}\n   Sorties totales : ${r.total_sorties}\n   Quantité suggérée : ~${qty} unités\n\n`;
  });
  t += 'Conseil : activez OPENAI_API_KEY pour des recommandations enrichies par IA.\n';
  return t;
}

async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: "Tu es un assistant expert en gestion d'inventaire. Réponds en français, de façon claire et structurée." },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

app.get('/api/ai/report', async (req, res) => {
  try {
    const products = db.prepare('SELECT id, name, min_stock FROM products').all();
    const lowStock = [];
    const summaryLines = [];
    for (const p of products) {
      const stock = getStock(p.id);
      summaryLines.push(`  - ${p.name} : stock=${stock}, seuil=${p.min_stock}`);
      if (stock < p.min_stock) lowStock.push({ name: p.name, stock, min_stock: p.min_stock });
    }
    const prompt = `État du stock :\n${summaryLines.join('\n')}\n\nProduits critiques :\n${lowStock.map((p) => `- ${p.name}: stock ${p.stock} < seuil ${p.min_stock}`).join('\n') || 'Aucun.'}\n\nGénère un rapport de synthèse structuré (introduction, état du stock, points critiques, recommandations) en français.`;
    const text = await callOpenAI(prompt);
    res.json({ report: text || localReport(summaryLines, lowStock) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la génération du rapport' });
  }
});

app.get('/api/ai/recommendations', async (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT p.id, p.name,
        COALESCE(SUM(CASE WHEN m.type='sortie' THEN m.quantity ELSE 0 END), 0) AS total_sorties
      FROM products p
      LEFT JOIN stock_movements m ON p.id = m.product_id
      GROUP BY p.id, p.name
    `).all();
    const prompt = `Historique des sorties :\n${rows.map((r) => `- ${r.name}: ${r.total_sorties} unités sorties`).join('\n')}\n\nPropose des recommandations de réapprovisionnement claires (priorités, quantités, conseils) en français.`;
    const text = await callOpenAI(prompt);
    res.json({ recommendations: text || localRecommendations(rows) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la génération des recommandations' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n🚀 API Inventaire → http://localhost:${PORT}\n`);
});
