import React, { useState, useCallback } from 'react';

const API_BASE = 'http://localhost:4000/api';

// ── Helpers ──────────────────────────────────────────────────────────────────
function api(path, options = {}) {
  return fetch(`${API_BASE}${path}`, options).then((r) => r.json());
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card" style={{ minWidth: 360, maxWidth: 480, width: '100%', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn" onClick={onClose} style={{ padding: '0.3rem 0.7rem' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Badge({ type }) {
  const color = type === 'entree' ? '#22c55e' : '#f97316';
  return (
    <span style={{
      background: color + '22', color, border: `1px solid ${color}55`,
      borderRadius: 999, padding: '0.15rem 0.6rem', fontSize: '0.8rem', fontWeight: 600
    }}>
      {type === 'entree' ? '↑ Entrée' : '↓ Sortie'}
    </span>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
  const [activeTab, setActiveTab] = useState('dashboard');

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [movements, setMovements] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [aiReport, setAiReport] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Forms
  const emptyProduct = { name: '', category_id: '', supplier_id: '', unit_price: '', min_stock: '' };
  const emptyCategory = { name: '', description: '' };
  const emptySupplier = { name: '', contact: '' };
  const emptyUser = { username: '', password: '', role: 'employe' };
  const emptyMovement = { product_id: '', type: 'entree', quantity: '' };

  const [productForm, setProductForm] = useState(emptyProduct);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [userForm, setUserForm] = useState(emptyUser);
  const [movementForm, setMovementForm] = useState(emptyMovement);

  // Edit modals
  const [editProduct, setEditProduct] = useState(null);
  const [editCategory, setEditCategory] = useState(null);
  const [editSupplier, setEditSupplier] = useState(null);

  // Users list
  const [users, setUsers] = useState([]);

  const headers = (role) => ({
  'Content-Type': 'application/json',
  'X-ROLE': role || user?.role || 'gestionnaire'
});

  // ── Load all data ──────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [p, c, s, m, a, d] = await Promise.all([
        api('/products'),
        api('/categories'),
        api('/suppliers'),
        api('/stock-movements'),
        api('/alerts/low-stock'),
        api('/dashboard'),
      ]);
      setProducts(Array.isArray(p) ? p : []);
      setCategories(Array.isArray(c) ? c : []);
      setSuppliers(Array.isArray(s) ? s : []);
      setMovements(Array.isArray(m) ? m : []);
      setLowStock(Array.isArray(a) ? a : []);
      setDashboard(d);
    } catch (err) {
      console.error('loadAll error:', err);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const data = await api('/users', { headers: headers('gestionnaire') });
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('loadUsers error:', err);
    }
  }, [user]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      if (!res.ok) { alert('Identifiants invalides'); return; }
      const json = await res.json();
      setUser(json.user);
      await loadAll();
    } catch (err) {
      alert('Erreur de connexion');
    }
  };

  // ── Products ──────────────────────────────────────────────────────────────
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        ...productForm,
        unit_price: Number(productForm.unit_price || 0),
        min_stock: Number(productForm.min_stock || 0),
        category_id: productForm.category_id ? Number(productForm.category_id) : null,
        supplier_id: productForm.supplier_id ? Number(productForm.supplier_id) : null
      })
    });
    if (!res.ok) { alert("Erreur lors de l'ajout du produit"); return; }
    setProductForm(emptyProduct);
    await loadAll();
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/products/${editProduct.id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        name: editProduct.name,
        unit_price: Number(editProduct.unit_price || 0),
        min_stock: Number(editProduct.min_stock || 0),
        category_id: editProduct.category_id ? Number(editProduct.category_id) : null,
        supplier_id: editProduct.supplier_id ? Number(editProduct.supplier_id) : null
      })
    });
    if (!res.ok) { alert('Erreur lors de la modification'); return; }
    setEditProduct(null);
    await loadAll();
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Supprimer le produit « ${name} » et tous ses mouvements ?`)) return;
    await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE', headers: headers() });
    await loadAll();
  };

  // ── Categories ────────────────────────────────────────────────────────────
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(categoryForm)
    });
    if (!res.ok) { alert("Erreur lors de l'ajout de la catégorie"); return; }
    setCategoryForm(emptyCategory);
    await loadAll();
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/categories/${editCategory.id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ name: editCategory.name, description: editCategory.description })
    });
    if (!res.ok) { alert('Erreur lors de la modification'); return; }
    setEditCategory(null);
    await loadAll();
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Supprimer la catégorie « ${name} » ?`)) return;
    await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE', headers: headers() });
    await loadAll();
  };

  // ── Suppliers ─────────────────────────────────────────────────────────────
  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/suppliers`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(supplierForm)
    });
    if (!res.ok) { alert("Erreur lors de l'ajout du fournisseur"); return; }
    setSupplierForm(emptySupplier);
    await loadAll();
  };

  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/suppliers/${editSupplier.id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ name: editSupplier.name, contact: editSupplier.contact })
    });
    if (!res.ok) { alert('Erreur lors de la modification'); return; }
    setEditSupplier(null);
    await loadAll();
  };

  const handleDeleteSupplier = async (id, name) => {
    if (!window.confirm(`Supprimer le fournisseur « ${name} » ?`)) return;
    await fetch(`${API_BASE}/suppliers/${id}`, { method: 'DELETE', headers: headers() });
    await loadAll();
  };

  // ── Movements ─────────────────────────────────────────────────────────────
  const handleMovement = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/stock-movements`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        product_id: Number(movementForm.product_id),
        type: movementForm.type,
        quantity: Number(movementForm.quantity)
      })
    });
    const json = await res.json();
    if (!res.ok) { alert(json.message || "Erreur lors de l'enregistrement"); return; }
    setMovementForm(emptyMovement);
    await loadAll();
  };

  // ── Users ─────────────────────────────────────────────────────────────────
  const handleCreateUser = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: headers('gestionnaire'),
      body: JSON.stringify(userForm)
    });
    const json = await res.json();
    if (!res.ok) { alert(json.message || "Erreur lors de la création"); return; }
    setUserForm(emptyUser);
    await loadUsers();
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Supprimer l'utilisateur « ${username} » ?`)) return;
    await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE', headers: headers('gestionnaire') });
    await loadUsers();
  };

  // ── AI ────────────────────────────────────────────────────────────────────
  const fetchAi = async () => {
    setLoadingAi(true);
    try {
      const [r, rec] = await Promise.all([
        api('/ai/report'),
        api('/ai/recommendations')
      ]);
      setAiReport(r.report || '');
      setAiRecommendations(rec.recommendations || '');
    } catch (err) {
      alert("Erreur lors de l'appel IA");
    } finally {
      setLoadingAi(false);
    }
  };

  // ── Nav tabs ──────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'dashboard', label: '📊 Tableau de bord' },
    { id: 'products',  label: '📦 Produits & stock' },
    { id: 'movements', label: '🔄 Mouvements' },
    { id: 'categories',label: '🏷️ Catégories' },
    { id: 'suppliers', label: '🚚 Fournisseurs' },
    { id: 'alerts',    label: '🚨 Alertes' },
    { id: 'ai',        label: '🤖 Rapports IA' },
    ...(user?.role === 'gestionnaire' ? [{ id: 'users', label: '👥 Utilisateurs' }] : []),
  ];

  // ── Login page ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="app app-center">
        <div className="card login-card">
          <h1>Gestion d'inventaire</h1>
          <p className="subtitle">INF4173 – Projet Synthèse · Connexion</p>
          <form onSubmit={handleLogin} className="form">
            <label>
              Nom d'utilisateur
              <input type="text" value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} />
            </label>
            <label>
              Mot de passe
              <input type="password" value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
            </label>
            <button type="submit" className="btn primary">Se connecter</button>
            <p className="hint">Démo : <code>admin / admin123</code> (gestionnaire)</p>
          </form>
        </div>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <div className="app">
      {/* Edit modals */}
      {editProduct && (
        <Modal title="Modifier le produit" onClose={() => setEditProduct(null)}>
          <form className="form" onSubmit={handleUpdateProduct}>
            <label>Nom <input required value={editProduct.name}
              onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} /></label>
            <div className="form-row">
              <label>Catégorie
                <select value={editProduct.category_id || ''}
                  onChange={(e) => setEditProduct({ ...editProduct, category_id: e.target.value })}>
                  <option value="">Aucune</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label>Fournisseur
                <select value={editProduct.supplier_id || ''}
                  onChange={(e) => setEditProduct({ ...editProduct, supplier_id: e.target.value })}>
                  <option value="">Aucun</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>Prix unitaire <input type="number" step="0.01" value={editProduct.unit_price}
                onChange={(e) => setEditProduct({ ...editProduct, unit_price: e.target.value })} /></label>
              <label>Stock minimum <input type="number" value={editProduct.min_stock}
                onChange={(e) => setEditProduct({ ...editProduct, min_stock: e.target.value })} /></label>
            </div>
            <button type="submit" className="btn primary">Enregistrer les modifications</button>
          </form>
        </Modal>
      )}

      {editCategory && (
        <Modal title="Modifier la catégorie" onClose={() => setEditCategory(null)}>
          <form className="form" onSubmit={handleUpdateCategory}>
            <label>Nom <input required value={editCategory.name}
              onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })} /></label>
            <label>Description <input value={editCategory.description || ''}
              onChange={(e) => setEditCategory({ ...editCategory, description: e.target.value })} /></label>
            <button type="submit" className="btn primary">Enregistrer</button>
          </form>
        </Modal>
      )}

      {editSupplier && (
        <Modal title="Modifier le fournisseur" onClose={() => setEditSupplier(null)}>
          <form className="form" onSubmit={handleUpdateSupplier}>
            <label>Nom <input required value={editSupplier.name}
              onChange={(e) => setEditSupplier({ ...editSupplier, name: e.target.value })} /></label>
            <label>Contact <input value={editSupplier.contact || ''}
              onChange={(e) => setEditSupplier({ ...editSupplier, contact: e.target.value })} /></label>
            <button type="submit" className="btn primary">Enregistrer</button>
          </form>
        </Modal>
      )}

      {/* Top bar */}
      <header className="topbar">
        <div>
          <h1>Gestion d'inventaire</h1>
          <p className="subtitle">
            {user.username} · <span style={{ color: user.role === 'gestionnaire' ? '#60a5fa' : '#34d399' }}>
              {user.role}
            </span>
          </p>
        </div>
        <button className="btn" onClick={() => { setUser(null); setActiveTab('dashboard'); }}>
          Se déconnecter
        </button>
      </header>

      <div className="layout">
        {/* Sidebar */}
        <nav className="sidebar">
          {tabs.map((t) => (
            <button key={t.id}
              className={activeTab === t.id ? 'nav-btn active' : 'nav-btn'}
              onClick={() => {
                setActiveTab(t.id);
                if (t.id === 'users') loadUsers();
              }}>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className="content">

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <section>
              <h2>Tableau de bord</h2>
              {dashboard && (
                <div className="grid">
                  <div className="stat-card">
                    <span className="stat-label">Produits</span>
                    <span className="stat-value">{dashboard.totalProducts}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Catégories</span>
                    <span className="stat-value">{dashboard.totalCategories}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Fournisseurs</span>
                    <span className="stat-value">{dashboard.totalSuppliers}</span>
                  </div>
                  <div className={`stat-card${dashboard.lowStockCount > 0 ? ' warning' : ''}`}>
                    <span className="stat-label">⚠️ Sous seuil</span>
                    <span className="stat-value" style={{ color: dashboard.lowStockCount > 0 ? '#f97316' : 'inherit' }}>
                      {dashboard.lowStockCount}
                    </span>
                  </div>
                </div>
              )}
              <div className="card">
                <h3>Mouvements récents</h3>
                <table className="table">
                  <thead><tr><th>Date</th><th>Produit</th><th>Type</th><th>Quantité</th></tr></thead>
                  <tbody>
                    {(dashboard?.recentMovements || []).map((m) => (
                      <tr key={m.id}>
                        <td>{new Date(m.created_at).toLocaleString('fr-CA')}</td>
                        <td>{m.product_name}</td>
                        <td><Badge type={m.type} /></td>
                        <td>{m.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ── PRODUCTS ── */}
          {activeTab === 'products' && (
            <section>
              <h2>Produits & stock</h2>
              {user.role === 'gestionnaire' && (
                <div className="card">
                  <h3>Ajouter un produit</h3>
                  <form className="form" onSubmit={handleCreateProduct}>
                    <label>Nom du produit *
                      <input required value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                    </label>
                    <div className="form-row">
                      <label>Catégorie
                        <select value={productForm.category_id}
                          onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}>
                          <option value="">Aucune</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </label>
                      <label>Fournisseur
                        <select value={productForm.supplier_id}
                          onChange={(e) => setProductForm({ ...productForm, supplier_id: e.target.value })}>
                          <option value="">Aucun</option>
                          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </label>
                    </div>
                    <div className="form-row">
                      <label>Prix unitaire ($)
                        <input type="number" step="0.01" value={productForm.unit_price}
                          onChange={(e) => setProductForm({ ...productForm, unit_price: e.target.value })} />
                      </label>
                      <label>Stock minimum
                        <input type="number" min="0" value={productForm.min_stock}
                          onChange={(e) => setProductForm({ ...productForm, min_stock: e.target.value })} />
                      </label>
                    </div>
                    <button type="submit" className="btn primary">Ajouter le produit</button>
                  </form>
                </div>
              )}
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom</th><th>Catégorie</th><th>Fournisseur</th>
                    <th>Prix</th><th>Stock actuel</th><th>Seuil min.</th>
                    {user.role === 'gestionnaire' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className={p.current_stock < p.min_stock ? 'row-warning' : ''}>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.category_name || <span className="hint">—</span>}</td>
                      <td>{p.supplier_name || <span className="hint">—</span>}</td>
                      <td>{p.unit_price?.toFixed(2)} $</td>
                      <td>
                        <span style={{ color: p.current_stock < p.min_stock ? '#f97316' : '#22c55e', fontWeight: 600 }}>
                          {p.current_stock}
                        </span>
                      </td>
                      <td>{p.min_stock}</td>
                      {user.role === 'gestionnaire' && (
                        <td style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            onClick={() => setEditProduct({ ...p })}>✏️</button>
                          <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#f87171' }}
                            onClick={() => handleDeleteProduct(p.id, p.name)}>🗑️</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* ── MOVEMENTS ── */}
          {activeTab === 'movements' && (
            <section>
              <h2>Mouvements de stock</h2>
              <div className="card">
                <h3>Enregistrer un mouvement</h3>
                <form className="form" onSubmit={handleMovement}>
                  <div className="form-row">
                    <label>Produit *
                      <select required value={movementForm.product_id}
                        onChange={(e) => setMovementForm({ ...movementForm, product_id: e.target.value })}>
                        <option value="">Sélectionner…</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} (stock: {p.current_stock})</option>
                        ))}
                      </select>
                    </label>
                    <label>Type
                      <select value={movementForm.type}
                        onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })}>
                        <option value="entree">↑ Entrée</option>
                        <option value="sortie">↓ Sortie</option>
                      </select>
                    </label>
                    <label>Quantité *
                      <input type="number" min="1" required value={movementForm.quantity}
                        onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} />
                    </label>
                  </div>
                  <button type="submit" className="btn primary">Enregistrer le mouvement</button>
                </form>
              </div>
              <table className="table">
                <thead><tr><th>Date</th><th>Produit</th><th>Type</th><th>Quantité</th></tr></thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td>{new Date(m.created_at).toLocaleString('fr-CA')}</td>
                      <td>{m.product_name}</td>
                      <td><Badge type={m.type} /></td>
                      <td>{m.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* ── CATEGORIES ── */}
          {activeTab === 'categories' && (
            <section>
              <h2>Catégories</h2>
              {user.role === 'gestionnaire' && (
                <div className="card">
                  <h3>Ajouter une catégorie</h3>
                  <form className="form" onSubmit={handleCreateCategory}>
                    <div className="form-row">
                      <label>Nom *
                        <input required value={categoryForm.name}
                          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                      </label>
                      <label>Description
                        <input value={categoryForm.description}
                          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
                      </label>
                    </div>
                    <button type="submit" className="btn primary">Ajouter</button>
                  </form>
                </div>
              )}
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom</th><th>Description</th>
                    {user.role === 'gestionnaire' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.name}</strong></td>
                      <td>{c.description || <span className="hint">—</span>}</td>
                      {user.role === 'gestionnaire' && (
                        <td style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            onClick={() => setEditCategory({ ...c })}>✏️</button>
                          <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#f87171' }}
                            onClick={() => handleDeleteCategory(c.id, c.name)}>🗑️</button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr><td colSpan={3} style={{ textAlign: 'center', color: '#9ca3af' }}>
                      Aucune catégorie. Ajoutez-en une ci-dessus.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </section>
          )}

          {/* ── SUPPLIERS ── */}
          {activeTab === 'suppliers' && (
            <section>
              <h2>Fournisseurs</h2>
              {user.role === 'gestionnaire' && (
                <div className="card">
                  <h3>Ajouter un fournisseur</h3>
                  <form className="form" onSubmit={handleCreateSupplier}>
                    <div className="form-row">
                      <label>Nom *
                        <input required value={supplierForm.name}
                          onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
                      </label>
                      <label>Contact (email / tél.)
                        <input value={supplierForm.contact}
                          onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })} />
                      </label>
                    </div>
                    <button type="submit" className="btn primary">Ajouter</button>
                  </form>
                </div>
              )}
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom</th><th>Contact</th>
                    {user.role === 'gestionnaire' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.contact || <span className="hint">—</span>}</td>
                      {user.role === 'gestionnaire' && (
                        <td style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            onClick={() => setEditSupplier({ ...s })}>✏️</button>
                          <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#f87171' }}
                            onClick={() => handleDeleteSupplier(s.id, s.name)}>🗑️</button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {suppliers.length === 0 && (
                    <tr><td colSpan={3} style={{ textAlign: 'center', color: '#9ca3af' }}>
                      Aucun fournisseur. Ajoutez-en un ci-dessus.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </section>
          )}

          {/* ── ALERTS ── */}
          {activeTab === 'alerts' && (
            <section>
              <h2>🚨 Alertes — Produits sous seuil minimum</h2>
              {lowStock.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                  <p style={{ fontSize: '1.5rem', margin: 0 }}>✅</p>
                  <p>Tous les produits sont au-dessus de leur seuil minimum.</p>
                </div>
              ) : (
                <>
                  <p style={{ color: '#f97316' }}>
                    ⚠️ <strong>{lowStock.length}</strong> produit(s) nécessitent un réapprovisionnement.
                  </p>
                  <table className="table">
                    <thead>
                      <tr><th>Produit</th><th>Catégorie</th><th>Fournisseur</th><th>Stock actuel</th><th>Seuil min.</th><th>Déficit</th></tr>
                    </thead>
                    <tbody>
                      {lowStock.map((p) => (
                        <tr key={p.id} className="row-warning">
                          <td><strong>{p.name}</strong></td>
                          <td>{p.category_name || '—'}</td>
                          <td>{p.supplier_name || '—'}</td>
                          <td style={{ color: '#f97316', fontWeight: 600 }}>{p.current_stock}</td>
                          <td>{p.min_stock}</td>
                          <td style={{ color: '#f87171', fontWeight: 600 }}>−{p.min_stock - p.current_stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </section>
          )}

          {/* ── AI REPORTS ── */}
          {activeTab === 'ai' && (
            <section>
              <h2>🤖 Rapports & recommandations IA</h2>
              <p className="hint" style={{ marginBottom: '1rem' }}>
                Génération locale ou via OpenAI si <code>OPENAI_API_KEY</code> est configurée dans <code>backend/.env</code>.
              </p>
              <button className="btn primary" onClick={fetchAi} disabled={loadingAi}
                style={{ marginBottom: '1.5rem' }}>
                {loadingAi ? '⏳ Génération en cours…' : '🚀 Générer le rapport et les recommandations'}
              </button>
              <div className="grid-two">
                <div className="card">
                  <h3>📋 Rapport de synthèse</h3>
                  <pre className="ai-output">
                    {aiReport || 'Cliquez sur « Générer » pour obtenir un rapport.'}
                  </pre>
                </div>
                <div className="card">
                  <h3>💡 Recommandations de réapprovisionnement</h3>
                  <pre className="ai-output">
                    {aiRecommendations || 'Cliquez sur « Générer » pour obtenir des recommandations.'}
                  </pre>
                </div>
              </div>
            </section>
          )}

          {/* ── USERS (gestionnaire only) ── */}
          {activeTab === 'users' && user.role === 'gestionnaire' && (
            <section>
              <h2>👥 Gestion des utilisateurs</h2>
              <div className="card">
                <h3>Créer un compte</h3>
                <form className="form" onSubmit={handleCreateUser}>
                  <div className="form-row">
                    <label>Nom d'utilisateur *
                      <input required value={userForm.username}
                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} />
                    </label>
                    <label>Mot de passe *
                      <input type="password" required value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
                    </label>
                    <label>Rôle
                      <select value={userForm.role}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                        <option value="employe">Employé</option>
                        <option value="gestionnaire">Gestionnaire</option>
                      </select>
                    </label>
                  </div>
                  <button type="submit" className="btn primary">Créer le compte</button>
                </form>
              </div>
              <table className="table">
                <thead><tr><th>#</th><th>Nom d'utilisateur</th><th>Rôle</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td><strong>{u.username}</strong></td>
                      <td>
                        <span style={{
                          color: u.role === 'gestionnaire' ? '#60a5fa' : '#34d399',
                          fontWeight: 600
                        }}>{u.role}</span>
                      </td>
                      <td>
                        {u.username !== 'admin' && (
                          <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#f87171' }}
                            onClick={() => handleDeleteUser(u.id, u.username)}>🗑️ Supprimer</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#9ca3af' }}>
                      Aucun utilisateur chargé.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}
