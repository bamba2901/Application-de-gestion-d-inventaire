import React, { useState, useCallback, useEffect, useRef } from 'react';

const API = 'http://localhost:4000/api';
const get = (path, opts = {}) => fetch(`${API}${path}`, opts).then(r => r.json());

// ── Icons ─────────────────────────────────────────────────────────────────────
function Ic({ d, size = 15, stroke = true, fill = false }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}
      fill={fill ? 'currentColor' : 'none'}
      stroke={stroke ? 'currentColor' : 'none'}
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block' }}>
      <path d={d} />
    </svg>
  );
}
const I = {
  dash:    <Ic d="M2 2h5v5H2zm7 0h5v5H9zM2 9h5v5H2zm7 0h5v5H9z" stroke={false} fill />,
  box:     <Ic d="M8 1.5L13.5 4.5v7L8 14.5 2.5 11.5v-7L8 1.5zM8 1.5v13M2.5 4.5l5.5 3 5.5-3" />,
  arrows:  <Ic d="M5 5L8 2l3 3M8 2v5.5m-3 3.5l3 3 3-3M8 14V8.5" />,
  tag:     <Ic d="M2 2h5.5L14 8.5 9 13.5 2.5 7 2 2zm3.5 2a1 1 0 100 2 1 1 0 000-2z" fill stroke={false} />,
  truck:   <Ic d="M1 4h9v8H1zm9 2.5h3.5l1 2V12h-4.5M3.5 12a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm8 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />,
  bell:    <Ic d="M8 2a5 5 0 00-5 5v3L2 12h12l-1-2V7a5 5 0 00-5-5zm-1.5 10a1.5 1.5 0 003 0" />,
  spark:   <Ic d="M8 1.5l1.7 4L14 7l-4.3 1.5L8 12.5l-1.7-4L2 7l4.3-1.5L8 1.5z" fill stroke={false} />,
  users:   <Ic d="M5.5 7a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm-4 6c0-2.5 1.8-4 4-4s4 1.5 4 4m2.5-7a2 2 0 010 4M15.5 13c0-2-1-3.2-2.5-3.8" />,
  logout:  <Ic d="M10.5 3H13v10h-2.5M6 10.5L10 8 6 5.5M2 8h8" />,
  refresh: <Ic d="M14 6A6 6 0 102 8m12-2V3m0 3h-3" />,
  plus:    <Ic d="M8 3v10M3 8h10" />,
  edit:    <Ic d="M11.5 2.5l2 2-9 9H2.5v-2l9-9z" />,
  trash:   <Ic d="M3 4h10m-4 0V2H7v2M4.5 4l.5 9a1 1 0 001 1h4a1 1 0 001-1l.5-9" />,
  x:       <Ic d="M3 3l10 10M13 3L3 13" />,
  check:   <Ic d="M2.5 8.5l4 4 7-8" />,
  warning: <Ic d="M8 2L15 14H1L8 2zm0 5v3.5M8 12v.5" />,
  search:  <Ic d="M7 12A5 5 0 107 2a5 5 0 000 10zm4.5.5l3 3" />,
  chart:   <Ic d="M2 12l3.5-4 3 2.5 3-6 3 2.5" />,
  info:    <Ic d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 4v5m0-6.5v.5" />,
  download: <Ic d="M8 2v8m-3-3l3 3 3-3M3 13h10" />,
};

// ── Toast system ──────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4200);
  }, []);
  return { toasts, toast };
}

function ToastIcon({ type }) {
  if (type === 'success') return <span className="toast-icon" style={{ color: '#4ade80' }}>{I.check}</span>;
  if (type === 'error')   return <span className="toast-icon" style={{ color: '#f87171' }}>{I.x}</span>;
  if (type === 'warning') return <span className="toast-icon" style={{ color: '#fbbf24' }}>{I.warning}</span>;
  return <span className="toast-icon" style={{ color: '#a5b4fc' }}>{I.info}</span>;
}

function Toasts({ items }) {
  return (
    <div className="toast-stack">
      {items.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <ToastIcon type={t.type} />
          <span className="toast-msg">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ── Animated counter ──────────────────────────────────────────────────────────
function CountUp({ value, className }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current, end = Number(value) || 0;
    prev.current = end;
    if (start === end) { setDisplay(end); return; }
    const steps = 28, dur = 600;
    let step = 0;
    const id = setInterval(() => {
      step++;
      const t = step / steps;
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + (end - start) * ease));
      if (step >= steps) { clearInterval(id); setDisplay(end); }
    }, dur / steps);
    return () => clearInterval(id);
  }, [value]);
  return <span className={className}>{display}</span>;
}

// ── Chart: Donut ──────────────────────────────────────────────────────────────
function Donut({ ok, total }) {
  const r = 42, cx = 54, cy = 54, sw = 8;
  const circ = 2 * Math.PI * r;
  const ratio = total > 0 ? ok / total : 1;
  const pct   = total > 0 ? Math.round(ratio * 100) : 100;
  const color = ratio >= .7 ? '#22c55e' : ratio >= .4 ? '#f59e0b' : '#ef4444';
  return (
    <svg viewBox="0 0 108 108" width={110} height={110} style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="dg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity=".55" />
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#dg)" strokeWidth={sw}
        strokeDasharray={`${circ * ratio} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} filter="url(#glow)"
        style={{ transition: 'stroke-dasharray .9s cubic-bezier(.4,0,.2,1)' }} />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#f0f0f8"
        fontSize="17" fontWeight="900" fontFamily="Inter,sans-serif">{pct}%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#48486a"
        fontSize="8.5" fontFamily="Inter,sans-serif">en stock</text>
    </svg>
  );
}

// ── Chart: Vertical bars ──────────────────────────────────────────────────────
function MovBars({ movements }) {
  const E = movements.filter(m => m.type === 'entree').reduce((s, m) => s + m.quantity, 0);
  const S = movements.filter(m => m.type === 'sortie').reduce((s, m) => s + m.quantity, 0);
  const M = Math.max(E, S, 1);
  const H = 84, W = 38;

  const Bar = ({ val, gid, label, labelColor, x }) => {
    const h = Math.max((val / M) * H, val > 0 ? 8 : 3);
    return (
      <g>
        <rect x={x} y={H - h} width={W} height={h} rx="6" fill={`url(#${gid})`}
          style={{ transition: 'height .7s cubic-bezier(.4,0,.2,1)', transitionProperty: 'height,y' }} />
        {val > 0 && (
          <text x={x + W / 2} y={H - h - 6} textAnchor="middle"
            fill={labelColor} fontSize="10.5" fontWeight="800" fontFamily="Inter,sans-serif">{val}</text>
        )}
        <text x={x + W / 2} y={H + 15} textAnchor="middle"
          fill="#48486a" fontSize="8.5" fontFamily="Inter,sans-serif">{label}</text>
      </g>
    );
  };
  return (
    <svg viewBox="0 0 120 104" width={120} height={104} style={{ flexShrink: 0, overflow: 'visible' }}>
      <defs>
        <linearGradient id="g-e" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" /><stop offset="100%" stopColor="#166534" stopOpacity=".7" />
        </linearGradient>
        <linearGradient id="g-s" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#92400e" stopOpacity=".7" />
        </linearGradient>
      </defs>
      <Bar val={E} gid="g-e" label="Entrées" labelColor="#4ade80" x={8} />
      <Bar val={S} gid="g-s" label="Sorties"  labelColor="#fbbf24" x={74} />
      <line x1="0" y1={84} x2={120} y2={84} stroke="rgba(255,255,255,.06)" strokeWidth="1" />
    </svg>
  );
}

// ── Chart: Trend sparkline ────────────────────────────────────────────────────
function TrendLine({ movements }) {
  if (movements.length < 2) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 70, color: 'var(--t4)', fontSize: '.8rem' }}>
      Pas assez de données
    </div>
  );

  const sorted = [...movements]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(-24);

  let cum = 0;
  const vals = sorted.map(m => {
    cum += m.type === 'entree' ? m.quantity : -m.quantity;
    return cum;
  });

  const min = Math.min(...vals);
  const max = Math.max(...vals, min + 1);
  const range = max - min;
  const W = 400, H = 70, pad = 4;

  const pts = vals.map((v, i) => [
    pad + (i / (vals.length - 1)) * (W - pad * 2),
    pad + H - pad * 2 - ((v - min) / range) * (H - pad * 2)
  ]);

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`;

  const lastVal = vals[vals.length - 1];
  const prevVal = vals[vals.length - 2] ?? vals[0];
  const trend = lastVal >= prevVal ? 'up' : 'down';

  return (
    <div className="trend-wrap">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
        <span style={{ fontSize: '.72rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>
          Évolution du stock net
        </span>
        <span style={{ fontSize: '.8rem', fontWeight: 700, color: trend === 'up' ? '#4ade80' : '#f87171' }}>
          {trend === 'up' ? '↑' : '↓'} {Math.abs(lastVal - prevVal)}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity=".25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#trend-fill)" />
        <path d={line} fill="none" stroke="#818cf8" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" />
        {/* last point dot */}
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5"
          fill="#818cf8" stroke="var(--card)" strokeWidth="2" />
      </svg>
      <div className="trend-labels">
        <span>{sorted[0] ? new Date(sorted[0].created_at).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' }) : ''}</span>
        <span>{sorted[sorted.length - 1] ? new Date(sorted[sorted.length - 1].created_at).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' }) : ''}</span>
      </div>
    </div>
  );
}

// ── Chart: 7-day daily activity ──────────────────────────────────────────────
function DailyChart({ movements }) {
  const data = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    const day = movements.filter(m => (m.created_at || '').slice(0, 10) === ds);
    return {
      label: d.toLocaleDateString('fr-CA', { weekday: 'short' }),
      day:   d.getDate(),
      e: day.filter(m => m.type === 'entree').reduce((s, m) => s + m.quantity, 0),
      s: day.filter(m => m.type === 'sortie').reduce((s, m) => s + m.quantity, 0),
      isToday: i === 6,
    };
  });

  const maxVal = Math.max(...data.flatMap(d => [d.e, d.s]), 1);
  const W = 420, H = 90, BW = 16, GAP = 5, GROUP = BW * 2 + GAP;
  const STEP = W / data.length;

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.75rem', color: 'var(--t3)' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#22c55e' }} /> Entrées
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.75rem', color: 'var(--t3)' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b' }} /> Sorties
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 28}`} style={{ width: '100%', height: H + 28 }} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="dc-e" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" /><stop offset="100%" stopColor="#166534" stopOpacity=".7" />
          </linearGradient>
          <linearGradient id="dc-s" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#78350f" stopOpacity=".7" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[.25, .5, .75, 1].map(t => (
          <line key={t} x1={0} y1={H * (1 - t)} x2={W} y2={H * (1 - t)}
            stroke="rgba(255,255,255,.04)" strokeWidth="1" strokeDasharray="3,5" />
        ))}
        {data.map((d, i) => {
          const cx  = i * STEP + STEP / 2;
          const x1  = cx - GROUP / 2;
          const x2  = x1 + BW + GAP;
          const hE  = Math.max((d.e / maxVal) * H, d.e > 0 ? 5 : 0);
          const hS  = Math.max((d.s / maxVal) * H, d.s > 0 ? 5 : 0);
          return (
            <g key={i}>
              {/* Today highlight */}
              {d.isToday && <rect x={cx - GROUP / 2 - 4} y={0} width={GROUP + 8} height={H}
                fill="rgba(99,102,241,.04)" rx="4" />}
              {/* Entry bar */}
              <rect x={x1} y={H - hE} width={BW} height={hE} rx="3"
                fill={d.e > 0 ? 'url(#dc-e)' : 'rgba(34,197,94,.08)'}
                style={{ transition: 'height .5s ease, y .5s ease' }} />
              {/* Exit bar */}
              <rect x={x2} y={H - hS} width={BW} height={hS} rx="3"
                fill={d.s > 0 ? 'url(#dc-s)' : 'rgba(245,158,11,.08)'}
                style={{ transition: 'height .5s ease, y .5s ease' }} />
              {/* Value labels */}
              {d.e > 0 && <text x={x1 + BW / 2} y={H - hE - 4} textAnchor="middle"
                fill="#4ade80" fontSize="8" fontWeight="700" fontFamily="Inter,sans-serif">{d.e}</text>}
              {d.s > 0 && <text x={x2 + BW / 2} y={H - hS - 4} textAnchor="middle"
                fill="#fbbf24" fontSize="8" fontWeight="700" fontFamily="Inter,sans-serif">{d.s}</text>}
              {/* Day label */}
              <text x={cx} y={H + 14} textAnchor="middle"
                fill={d.isToday ? 'var(--a2)' : '#48486a'} fontSize="9" fontWeight={d.isToday ? '700' : '500'} fontFamily="Inter,sans-serif">
                {d.label}
              </text>
              <text x={cx} y={H + 24} textAnchor="middle"
                fill={d.isToday ? 'var(--t3)' : '#28283c'} fontSize="8" fontFamily="Inter,sans-serif">
                {d.day}
              </text>
            </g>
          );
        })}
        {/* Baseline */}
        <line x1={0} y1={H} x2={W} y2={H} stroke="rgba(255,255,255,.07)" strokeWidth="1" />
      </svg>
    </div>
  );
}

// ── Skeleton block ────────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 18, r = 6 }) {
  return (
    <div style={{ width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, var(--raised) 25%, var(--hover) 50%, var(--raised) 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease infinite' }} />
  );
}

// ── Stock bar ─────────────────────────────────────────────────────────────────
function SBar({ cur, min, max }) {
  const top = Math.max(max || 0, cur || 0, min || 0, 1);
  const pct = Math.min((cur / top) * 100, 100);
  const low = cur < min;
  return (
    <div className="sbar">
      <span className="sbar-num" style={{ color: low ? '#fbbf24' : '#4ade80' }}>{cur}</span>
      <div className="sbar-track">
        <div className="sbar-fill" style={{
          width: `${pct}%`,
          background: low
            ? 'linear-gradient(90deg,#92400e,#f59e0b)'
            : 'linear-gradient(90deg,#166534,#22c55e)'
        }} />
      </div>
    </div>
  );
}

// ── Movement badge ────────────────────────────────────────────────────────────
function MovBadge({ type }) {
  return type === 'entree'
    ? <span className="badge badge-green">↑ Entrée</span>
    : <span className="badge badge-amber">↓ Sortie</span>;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-bg">
      <div className="modal-box">
        <div className="modal-hd">
          <span className="modal-title">{title}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>{I.x}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]     = useState(null);
  const [login, setLogin]   = useState({ username: 'admin', password: 'admin123' });
  const [tab, setTab]       = useState('dashboard');
  const [search, setSearch] = useState('');

  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers,  setSuppliers]  = useState([]);
  const [movements,  setMovements]  = useState([]);
  const [lowStock,   setLowStock]   = useState([]);
  const [dashboard,  setDashboard]  = useState(null);
  const [aiReport,   setAiReport]   = useState(null);
  const [aiRec,      setAiRec]      = useState(null);
  const [loadingAi,  setLoadingAi]  = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);

  const { toasts, toast } = useToast();

  const EP = { name:'', category_id:'', supplier_id:'', unit_price:'', min_stock:'' };
  const EC = { name:'', description:'' };
  const ES = { name:'', contact:'' };
  const EU = { username:'', password:'', role:'employe' };
  const EM = { product_id:'', type:'entree', quantity:'' };

  const [pForm, setPForm] = useState(EP);
  const [cForm, setCForm] = useState(EC);
  const [sForm, setSForm] = useState(ES);
  const [uForm, setUForm] = useState(EU);
  const [mForm, setMForm] = useState(EM);

  const [editP, setEditP] = useState(null);
  const [editC, setEditC] = useState(null);
  const [editS, setEditS] = useState(null);
  const [users,  setUsers]  = useState([]);

  const hdr = (role) => ({
    'Content-Type': 'application/json',
    'X-ROLE': role || user?.role || 'gestionnaire',
  });

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [p, c, s, m, a, d] = await Promise.all([
        get('/products'), get('/categories'), get('/suppliers'),
        get('/stock-movements'), get('/alerts/low-stock'), get('/dashboard'),
      ]);
      setProducts(Array.isArray(p) ? p : []);
      setCategories(Array.isArray(c) ? c : []);
      setSuppliers(Array.isArray(s) ? s : []);
      setMovements(Array.isArray(m) ? m : []);
      setLowStock(Array.isArray(a) ? a : []);
      setDashboard(d);
    } catch (e) { console.error(e); toast('Erreur de chargement', 'error'); }
    finally { setIsLoading(false); }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const d = await get('/users', { headers: hdr('gestionnaire') });
      setUsers(Array.isArray(d) ? d : []);
    } catch { toast('Erreur chargement utilisateurs', 'error'); }
  }, [user]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const doLogin = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(`${API}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(login),
      });
      if (!r.ok) { toast('Identifiants invalides', 'error'); return; }
      const j = await r.json();
      setUser(j.user);
      await loadAll();
      toast(`Bienvenue, ${j.user.username} !`, 'success');
    } catch { toast('Erreur de connexion au serveur', 'error'); }
  };

  // ── Products ──────────────────────────────────────────────────────────────
  const createProduct = async (e) => {
    e.preventDefault();
    const r = await fetch(`${API}/products`, {
      method: 'POST', headers: hdr(),
      body: JSON.stringify({
        ...pForm,
        unit_price:  Number(pForm.unit_price  || 0),
        min_stock:   Number(pForm.min_stock   || 0),
        category_id: pForm.category_id ? Number(pForm.category_id) : null,
        supplier_id: pForm.supplier_id ? Number(pForm.supplier_id) : null,
      }),
    });
    if (!r.ok) { toast("Erreur lors de l'ajout du produit", 'error'); return; }
    setPForm(EP); await loadAll();
    toast(`Produit « ${pForm.name} » ajouté`, 'success');
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    const r = await fetch(`${API}/products/${editP.id}`, {
      method: 'PUT', headers: hdr(),
      body: JSON.stringify({
        name: editP.name,
        unit_price:  Number(editP.unit_price  || 0),
        min_stock:   Number(editP.min_stock   || 0),
        category_id: editP.category_id ? Number(editP.category_id) : null,
        supplier_id: editP.supplier_id ? Number(editP.supplier_id) : null,
      }),
    });
    if (!r.ok) { toast('Erreur lors de la modification', 'error'); return; }
    const name = editP.name;
    setEditP(null); await loadAll();
    toast(`« ${name} » mis à jour`, 'success');
  };

  const deleteProduct = async (id, name) => {
    if (!confirm(`Supprimer « ${name} » et tous ses mouvements ?`)) return;
    await fetch(`${API}/products/${id}`, { method: 'DELETE', headers: hdr() });
    await loadAll();
    toast(`« ${name} » supprimé`, 'warning');
  };

  // ── Categories ────────────────────────────────────────────────────────────
  const createCategory = async (e) => {
    e.preventDefault();
    const r = await fetch(`${API}/categories`, {
      method: 'POST', headers: hdr(), body: JSON.stringify(cForm),
    });
    if (!r.ok) { toast("Erreur lors de l'ajout", 'error'); return; }
    const name = cForm.name;
    setCForm(EC); await loadAll();
    toast(`Catégorie « ${name} » ajoutée`, 'success');
  };

  const updateCategory = async (e) => {
    e.preventDefault();
    const r = await fetch(`${API}/categories/${editC.id}`, {
      method: 'PUT', headers: hdr(),
      body: JSON.stringify({ name: editC.name, description: editC.description }),
    });
    if (!r.ok) { toast('Erreur lors de la modification', 'error'); return; }
    setEditC(null); await loadAll();
    toast('Catégorie mise à jour', 'success');
  };

  const deleteCategory = async (id, name) => {
    if (!confirm(`Supprimer la catégorie « ${name} » ?`)) return;
    await fetch(`${API}/categories/${id}`, { method: 'DELETE', headers: hdr() });
    await loadAll();
    toast(`Catégorie supprimée`, 'warning');
  };

  // ── Suppliers ─────────────────────────────────────────────────────────────
  const createSupplier = async (e) => {
    e.preventDefault();
    const r = await fetch(`${API}/suppliers`, {
      method: 'POST', headers: hdr(), body: JSON.stringify(sForm),
    });
    if (!r.ok) { toast("Erreur lors de l'ajout", 'error'); return; }
    const name = sForm.name;
    setSForm(ES); await loadAll();
    toast(`Fournisseur « ${name} » ajouté`, 'success');
  };

  const updateSupplier = async (e) => {
    e.preventDefault();
    const r = await fetch(`${API}/suppliers/${editS.id}`, {
      method: 'PUT', headers: hdr(),
      body: JSON.stringify({ name: editS.name, contact: editS.contact }),
    });
    if (!r.ok) { toast('Erreur lors de la modification', 'error'); return; }
    setEditS(null); await loadAll();
    toast('Fournisseur mis à jour', 'success');
  };

  const deleteSupplier = async (id, name) => {
    if (!confirm(`Supprimer le fournisseur « ${name} » ?`)) return;
    await fetch(`${API}/suppliers/${id}`, { method: 'DELETE', headers: hdr() });
    await loadAll();
    toast('Fournisseur supprimé', 'warning');
  };

  // ── Movements ─────────────────────────────────────────────────────────────
  const createMovement = async (e) => {
    e.preventDefault();
    const r = await fetch(`${API}/stock-movements`, {
      method: 'POST', headers: hdr(),
      body: JSON.stringify({
        product_id: Number(mForm.product_id),
        type: mForm.type, quantity: Number(mForm.quantity),
      }),
    });
    const j = await r.json();
    if (!r.ok) { toast(j.message || "Erreur lors de l'enregistrement", 'error'); return; }
    const prod = products.find(p => p.id === Number(mForm.product_id));
    setMForm(EM); await loadAll();
    toast(`Mouvement enregistré — ${prod?.name ?? ''}`, 'success');
  };

  // ── Users ─────────────────────────────────────────────────────────────────
  const createUser = async (e) => {
    e.preventDefault();
    const r = await fetch(`${API}/users`, {
      method: 'POST', headers: hdr('gestionnaire'), body: JSON.stringify(uForm),
    });
    const j = await r.json();
    if (!r.ok) { toast(j.message || "Erreur lors de la création", 'error'); return; }
    const name = uForm.username;
    setUForm(EU); await loadUsers();
    toast(`Compte « ${name} » créé`, 'success');
  };

  const deleteUser = async (id, username) => {
    if (!confirm(`Supprimer l'utilisateur « ${username} » ?`)) return;
    await fetch(`${API}/users/${id}`, { method: 'DELETE', headers: hdr('gestionnaire') });
    await loadUsers();
    toast(`Utilisateur « ${username} » supprimé`, 'warning');
  };

  // ── AI ────────────────────────────────────────────────────────────────────
  const fetchAi = async () => {
    setLoadingAi(true);
    toast('Analyse en cours…', 'info');
    try {
      const [r, rec] = await Promise.all([get('/ai/report'), get('/ai/recommendations')]);
      setAiReport(r);
      setAiRec(rec);
      toast('Analyse générée avec succès', 'success');
    } catch { toast("Erreur lors de l'analyse", 'error'); }
    finally { setLoadingAi(false); }
  };

  const downloadReport = (format) => {
    const date  = new Date().toLocaleDateString('fr-CA');
    const titre = `Rapport d'inventaire StockFlow — ${date}`;

    const stockLines = (aiReport?.stockItems || []).map(i =>
      `  • ${i.name.padEnd(22)} stock: ${String(i.stock).padStart(3)} / seuil: ${i.minStock}  [${i.status.toUpperCase()}]`
    ).join('\n');
    const recLines = (aiRec?.items || []).map(i =>
      `  ${i.rank}. ${i.name.padEnd(22)} commander ${i.suggested} unités  (urgence: ${i.urgency})`
    ).join('\n');

    const texte = [
      titre, '─'.repeat(60), '',
      `Score de santé du stock : ${aiReport?.healthScore ?? '—'}%`,
      `Produits total : ${aiReport?.totalProducts ?? '—'}   Sous seuil : ${aiReport?.criticalCount ?? '—'}`,
      aiReport?.aiComment ? `\nAnalyse : ${aiReport.aiComment}` : '',
      '', 'ÉTAT DES STOCKS', '─'.repeat(40),
      stockLines || '  (aucune donnée)',
      '', 'RECOMMANDATIONS DE RÉAPPROVISIONNEMENT', '─'.repeat(40),
      recLines || '  (aucune donnée)',
      aiRec?.aiComment ? `\nConseil : ${aiRec.aiComment}` : '',
      '', `Généré le ${date} par StockFlow`,
    ].join('\n');

    if (format === 'txt') {
      const blob = new Blob([texte], { type: 'text/plain;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `rapport-stockflow-${date}.txt`;
      a.click(); URL.revokeObjectURL(url);
      toast('Fichier TXT téléchargé', 'success');
    } else {
      const hc = (aiReport?.healthScore ?? 0) >= 70 ? '#16a34a' : (aiReport?.healthScore ?? 0) >= 40 ? '#d97706' : '#dc2626';
      const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${titre}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;color:#1e293b;line-height:1.6;padding:2.5rem}
  .page{max-width:900px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 4px 40px rgba(0,0,0,.1);overflow:hidden}
  /* Header */
  .header{background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4338ca 100%);padding:2.5rem 3rem;color:#fff}
  .header-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem}
  .logo{display:flex;align-items:center;gap:.75rem}
  .logo-icon{width:44px;height:44px;background:rgba(255,255,255,.15);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.4rem}
  .logo-name{font-size:1.3rem;font-weight:800;letter-spacing:-.02em}
  .logo-tag{font-size:.72rem;color:rgba(255,255,255,.6);margin-top:2px}
  .header-date{text-align:right;font-size:.82rem;color:rgba(255,255,255,.6)}
  .header-date strong{display:block;font-size:1rem;color:#fff;margin-bottom:.2rem}
  .header-title{font-size:1.6rem;font-weight:900;letter-spacing:-.03em;margin-bottom:.4rem}
  .header-sub{font-size:.9rem;color:rgba(255,255,255,.65)}
  /* Score section */
  .score-section{display:grid;grid-template-columns:auto 1fr auto auto auto;gap:1.5rem;align-items:center;padding:2rem 3rem;border-bottom:1px solid #e2e8f0;background:#f8fafc}
  .score-circle{width:90px;height:90px;border-radius:50%;border:6px solid ${hc};display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0}
  .score-pct{font-size:1.7rem;font-weight:900;color:${hc};line-height:1}
  .score-lbl{font-size:.6rem;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-top:2px}
  .score-info{flex:1}
  .score-info h3{font-size:1rem;font-weight:700;color:#1e293b;margin-bottom:.25rem}
  .score-info p{font-size:.84rem;color:#64748b}
  .kpi{text-align:center;padding:.75rem 1.25rem;background:#fff;border-radius:12px;border:1px solid #e2e8f0;min-width:100px}
  .kpi-v{font-size:1.8rem;font-weight:900;line-height:1}
  .kpi-l{font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;margin-top:.2rem}
  /* Comment box */
  .comment{margin:1.5rem 3rem;padding:1rem 1.25rem;background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;font-size:.88rem;color:#1d4ed8;line-height:1.6}
  /* Section */
  .section{padding:1.75rem 3rem}
  .section+.section{border-top:1px solid #f1f5f9}
  .section-title{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:1rem}
  /* Stock table */
  table{width:100%;border-collapse:collapse;font-size:.87rem}
  th{text-align:left;padding:.55rem .75rem;background:#f8fafc;color:#64748b;font-size:.72rem;text-transform:uppercase;letter-spacing:.07em;border-bottom:2px solid #e2e8f0;font-weight:600}
  td{padding:.6rem .75rem;border-bottom:1px solid #f1f5f9;vertical-align:middle}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:#fafafa}
  .badge{display:inline-flex;align-items:center;padding:.2rem .65rem;border-radius:99px;font-size:.73rem;font-weight:600;line-height:1.5}
  .ok{background:#dcfce7;color:#16a34a}.critique{background:#fef9c3;color:#ca8a04}.rupture{background:#fee2e2;color:#dc2626}
  .urgent{background:#fee2e2;color:#dc2626}.eleve{background:#fef9c3;color:#ca8a04}.normal{background:#dcfce7;color:#16a34a}
  .rank{font-weight:800;color:#6366f1}
  .qty{font-size:1rem;font-weight:800;color:#4f46e5}
  /* Progress bar in table */
  .bar-wrap{width:80px;height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;display:inline-block;vertical-align:middle;margin-right:.5rem}
  .bar-fill{height:100%;border-radius:99px}
  /* Footer */
  .footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:1.25rem 3rem;display:flex;justify-content:space-between;align-items:center;font-size:.78rem;color:#94a3b8}
  .footer strong{color:#64748b}
  @media print{body{padding:0;background:#fff}.page{box-shadow:none;border-radius:0}}
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-top">
      <div class="logo">
        <div class="logo-icon">📦</div>
        <div>
          <div class="logo-name">StockFlow</div>
          <div class="logo-tag">Système de gestion d'inventaire</div>
        </div>
      </div>
      <div class="header-date">
        <strong>Rapport généré le</strong>${date}
      </div>
    </div>
    <div class="header-title">Rapport d'analyse des stocks</div>
    <div class="header-sub">Analyse de santé du stock · Recommandations de réapprovisionnement</div>
  </div>

  <div class="score-section">
    <div class="score-circle">
      <div class="score-pct">${aiReport?.healthScore ?? 0}%</div>
      <div class="score-lbl">Santé</div>
    </div>
    <div class="score-info">
      <h3>Score de santé du stock</h3>
      <p>${(aiReport?.criticalCount ?? 0) === 0 ? 'Tous les produits sont correctement approvisionnés.' : `${aiReport.criticalCount} produit(s) nécessitent une action immédiate.`}</p>
    </div>
    <div class="kpi"><div class="kpi-v" style="color:#6366f1">${aiReport?.totalProducts ?? 0}</div><div class="kpi-l">Produits</div></div>
    <div class="kpi"><div class="kpi-v" style="color:${(aiReport?.criticalCount ?? 0) > 0 ? '#f59e0b' : '#22c55e'}">${aiReport?.criticalCount ?? 0}</div><div class="kpi-l">Sous seuil</div></div>
    <div class="kpi"><div class="kpi-v" style="color:#2dd4bf">${aiRec?.items?.length ?? 0}</div><div class="kpi-l">Recommandations</div></div>
  </div>

  ${aiReport?.aiComment ? `<div class="comment">💡 ${aiReport.aiComment}</div>` : ''}

  <div class="section">
    <div class="section-title">État des stocks</div>
    <table>
      <thead><tr><th>Produit</th><th>Niveau</th><th>Stock actuel</th><th>Seuil min.</th><th>Statut</th></tr></thead>
      <tbody>
        ${(aiReport?.stockItems || []).map(i => {
          const pct = i.minStock > 0 ? Math.min(Math.round((i.stock / (i.minStock * 2)) * 100), 100) : 100;
          const barColor = i.status === 'ok' ? '#22c55e' : i.status === 'critique' ? '#f59e0b' : '#ef4444';
          return `<tr>
            <td><strong>${i.name}</strong></td>
            <td><div class="bar-wrap"><div class="bar-fill" style="width:${pct}%;background:${barColor}"></div></div>${pct}%</td>
            <td>${i.stock}</td>
            <td>${i.minStock}</td>
            <td><span class="badge ${i.status}">${i.status === 'ok' ? '✓ OK' : i.status === 'critique' ? '⚠ Critique' : '✗ Rupture'}</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Recommandations de réapprovisionnement</div>
    ${aiRec?.aiComment ? `<div class="comment" style="margin:0 0 1rem">💡 ${aiRec.aiComment}</div>` : ''}
    <table>
      <thead><tr><th>#</th><th>Produit</th><th>Stock actuel</th><th>Sorties totales</th><th>Qté suggérée</th><th>Urgence</th></tr></thead>
      <tbody>
        ${(aiRec?.items || []).map(i => `<tr>
          <td class="rank">${i.rank}</td>
          <td><strong>${i.product}</strong></td>
          <td>${i.currentStock}</td>
          <td>${i.totalSales} unités</td>
          <td><span class="qty">+${i.suggested}</span></td>
          <td><span class="badge ${i.urgency === 'critique' ? 'urgent' : i.urgency === 'elevee' ? 'eleve' : 'normal'}">${i.urgency === 'critique' ? '🔴 Urgent' : i.urgency === 'elevee' ? '🟡 Élevé' : '🟢 Normal'}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span><strong>StockFlow</strong> — Système de gestion d'inventaire intelligent</span>
    <span>Document généré automatiquement le ${date}</span>
  </div>

</div>
</body>
</html>`;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `rapport-stockflow-${date}.html`;
      a.click(); URL.revokeObjectURL(url);
      toast('Rapport HTML téléchargé', 'success');
    }
  };

  // ── Nav ───────────────────────────────────────────────────────────────────
  const navItems = [
    { section: 'Workspace' },
    { id: 'dashboard',  label: 'Tableau de bord', icon: I.dash },
    { id: 'products',   label: 'Produits',          icon: I.box },
    { id: 'movements',  label: 'Mouvements',        icon: I.arrows },
    { section: 'Catalogue' },
    { id: 'categories', label: 'Catégories',         icon: I.tag },
    { id: 'suppliers',  label: 'Fournisseurs',       icon: I.truck },
    { section: 'Monitoring' },
    { id: 'alerts',     label: 'Alertes', icon: I.bell, badge: lowStock.length > 0 ? lowStock.length : null },
    { id: 'ai',         label: 'Analyse IA',         icon: I.spark },
    ...(user?.role === 'gestionnaire'
      ? [{ section: 'Admin' }, { id: 'users', label: 'Utilisateurs', icon: I.users }]
      : []),
  ];

  // ── Filtered products ─────────────────────────────────────────────────────
  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.supplier_name || '').toLowerCase().includes(search.toLowerCase())
  );

  // ── Login ─────────────────────────────────────────────────────────────────
  if (!user) return (
    <>
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-logo">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1>StockFlow</h1>
            <p>Gestion intelligente des stocks</p>
          </div>
          <form className="form" onSubmit={doLogin}>
            <label>Nom d'utilisateur
              <input autoFocus autoComplete="username" value={login.username}
                onChange={e => setLogin({ ...login, username: e.target.value })} />
            </label>
            <label>Mot de passe
              <input type="password" autoComplete="current-password" value={login.password}
                onChange={e => setLogin({ ...login, password: e.target.value })} />
            </label>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '.3rem' }}>
              Connexion
            </button>
            <p className="hint" style={{ textAlign: 'center', marginTop: '.25rem' }}>
              Démo : <code>admin</code> / <code>admin123</code>
            </p>
          </form>
        </div>
      </div>
      <Toasts items={toasts} />
    </>
  );

  // ── App ───────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <Toasts items={toasts} />

      {/* Edit modals */}
      {editP && (
        <Modal title="Modifier le produit" onClose={() => setEditP(null)}>
          <form className="form" onSubmit={updateProduct}>
            <label>Nom * <input required value={editP.name} onChange={e => setEditP({ ...editP, name: e.target.value })} /></label>
            <div className="form-row">
              <label>Catégorie
                <select value={editP.category_id || ''} onChange={e => setEditP({ ...editP, category_id: e.target.value })}>
                  <option value="">Aucune</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label>Fournisseur
                <select value={editP.supplier_id || ''} onChange={e => setEditP({ ...editP, supplier_id: e.target.value })}>
                  <option value="">Aucun</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>Prix ($) <input type="number" step=".01" value={editP.unit_price} onChange={e => setEditP({ ...editP, unit_price: e.target.value })} /></label>
              <label>Stock min. <input type="number" value={editP.min_stock} onChange={e => setEditP({ ...editP, min_stock: e.target.value })} /></label>
            </div>
            <div style={{ display:'flex', gap:'.5rem', justifyContent:'flex-end', marginTop:'.2rem' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditP(null)}>Annuler</button>
              <button type="submit" className="btn btn-primary btn-sm">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}
      {editC && (
        <Modal title="Modifier la catégorie" onClose={() => setEditC(null)}>
          <form className="form" onSubmit={updateCategory}>
            <label>Nom * <input required value={editC.name} onChange={e => setEditC({ ...editC, name: e.target.value })} /></label>
            <label>Description <input value={editC.description || ''} onChange={e => setEditC({ ...editC, description: e.target.value })} /></label>
            <div style={{ display:'flex', gap:'.5rem', justifyContent:'flex-end', marginTop:'.2rem' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditC(null)}>Annuler</button>
              <button type="submit" className="btn btn-primary btn-sm">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}
      {editS && (
        <Modal title="Modifier le fournisseur" onClose={() => setEditS(null)}>
          <form className="form" onSubmit={updateSupplier}>
            <label>Nom * <input required value={editS.name} onChange={e => setEditS({ ...editS, name: e.target.value })} /></label>
            <label>Contact <input value={editS.contact || ''} onChange={e => setEditS({ ...editS, contact: e.target.value })} /></label>
            <div style={{ display:'flex', gap:'.5rem', justifyContent:'flex-end', marginTop:'.2rem' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditS(null)}>Annuler</button>
              <button type="submit" className="btn btn-primary btn-sm">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div className="brand-name">StockFlow</div>
            <div className="brand-ver">v1.0</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) =>
            item.section ? (
              <div key={i} className="nav-section">{item.section}</div>
            ) : (
              <button key={item.id}
                className={`nav-item${tab === item.id ? ' active' : ''}`}
                onClick={() => { setTab(item.id); setSearch(''); if (item.id === 'users') loadUsers(); }}>
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-ava">{user.username[0].toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user.username}</div>
            <div className="user-role">{user.role}</div>
          </div>
          <button className="logout-btn" title="Déconnexion"
            onClick={() => { setUser(null); setTab('dashboard'); toast('Déconnecté', 'info'); }}>
            {I.logout}
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <div className="content">

        {/* ══ DASHBOARD ══════════════════════════════════════════════════════ */}
        {tab === 'dashboard' && (
          <div className="page-section">
            <div className="page-head">
              <div className="page-head-left">
                <h2>Tableau de bord</h2>
                <p>Vue d'ensemble en temps réel</p>
              </div>
              <div className="page-head-actions">
                <button className="btn btn-ghost btn-sm" onClick={loadAll} disabled={isLoading}>
                  <span className={isLoading ? 'spin' : ''}>{I.refresh}</span>
                  {isLoading ? 'Chargement…' : 'Actualiser'}
                </button>
              </div>
            </div>
            <div className="page-body">
              {/* Skeletons pendant le chargement initial */}
              {isLoading && !dashboard && (
                <div className="kpi-row" style={{ marginBottom: '.9rem' }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} className="kpi-skel">
                      <div className="skel-block" style={{ width: 32, height: 32, borderRadius: 8 }} />
                      <div className="skel-block" style={{ width: '60%', height: 11 }} />
                      <div className="skel-block" style={{ width: '45%', height: 28 }} />
                    </div>
                  ))}
                </div>
              )}

              {dashboard && (
                <>
                  {/* KPIs */}
                  <div className="kpi-row">
                    <div className="kpi c-indigo">
                      <div className="kpi-icon c-indigo">{I.box}</div>
                      <div className="kpi-label">Produits</div>
                      <CountUp value={dashboard.totalProducts} className="kpi-value c-indigo" />
                    </div>
                    <div className="kpi c-purple">
                      <div className="kpi-icon c-purple">{I.tag}</div>
                      <div className="kpi-label">Catégories</div>
                      <CountUp value={dashboard.totalCategories} className="kpi-value c-purple" />
                    </div>
                    <div className="kpi c-teal">
                      <div className="kpi-icon c-teal">{I.truck}</div>
                      <div className="kpi-label">Fournisseurs</div>
                      <CountUp value={dashboard.totalSuppliers} className="kpi-value c-teal" />
                    </div>
                    <div className={`kpi ${dashboard.lowStockCount > 0 ? 'c-amber' : 'c-green'}`}>
                      <div className={`kpi-icon ${dashboard.lowStockCount > 0 ? 'c-amber' : 'c-green'}`}>
                        {dashboard.lowStockCount > 0 ? I.warning : I.check}
                      </div>
                      <div className="kpi-label">Sous seuil</div>
                      <CountUp value={dashboard.lowStockCount} className={`kpi-value ${dashboard.lowStockCount > 0 ? 'c-amber' : 'c-green'}`} />
                      {dashboard.totalProducts > 0 && (
                        <div className="kpi-sub">
                          {Math.round((dashboard.lowStockCount / dashboard.totalProducts) * 100)}% du catalogue
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Charts row */}
                  <div className="chart-row">
                    <div className="panel">
                      <div className="panel-hd">
                        <span className="panel-title">Santé du stock</span>
                        <span className="panel-meta">{dashboard.totalProducts} produits</span>
                      </div>
                      <div className="donut-wrap">
                        <Donut ok={dashboard.totalProducts - dashboard.lowStockCount} total={dashboard.totalProducts} />
                        <div className="donut-legend">
                          <div className="legend-item">
                            <div className="legend-dot" style={{ background: '#22c55e' }} />
                            <span className="legend-val">{dashboard.totalProducts - dashboard.lowStockCount}</span>
                            <span className="legend-lbl">en stock</span>
                          </div>
                          <div className="legend-item">
                            <div className="legend-dot" style={{ background: '#f59e0b' }} />
                            <span className="legend-val">{dashboard.lowStockCount}</span>
                            <span className="legend-lbl">sous seuil</span>
                          </div>
                          <hr className="legend-sep" />
                          <div className="legend-item">
                            <div className="legend-dot" style={{ background: 'var(--t4)' }} />
                            <span className="legend-val">{dashboard.totalProducts}</span>
                            <span className="legend-lbl">total</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="panel">
                      <div className="panel-hd">
                        <span className="panel-title">Volume des mouvements</span>
                        <span className="panel-meta">{movements.length} opérations</span>
                      </div>
                      <div className="bars-wrap">
                        <MovBars movements={movements} />
                        <div className="bar-stats">
                          <div>
                            <div className="bar-stat-lbl">Entrées totales</div>
                            <div className="bar-stat-val" style={{ color: '#4ade80' }}>
                              {movements.filter(m => m.type === 'entree').reduce((s, m) => s + m.quantity, 0)}
                            </div>
                          </div>
                          <div>
                            <div className="bar-stat-lbl">Sorties totales</div>
                            <div className="bar-stat-val" style={{ color: '#fbbf24' }}>
                              {movements.filter(m => m.type === 'sortie').reduce((s, m) => s + m.quantity, 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trend line */}
                  {movements.length >= 2 && (
                    <div className="panel" style={{ marginBottom: '.9rem' }}>
                      <TrendLine movements={movements} />
                    </div>
                  )}

                  {/* Daily activity chart */}
                  <div className="panel" style={{ marginBottom: '.9rem' }}>
                    <div className="panel-hd">
                      <span className="panel-title">Activité des 7 derniers jours</span>
                      <span className="panel-meta">entrées · sorties</span>
                    </div>
                    <DailyChart movements={movements} />
                  </div>

                  {/* Top products */}
                  {products.length > 0 && (
                    <div className="panel" style={{ marginBottom: '.9rem' }}>
                      <div className="panel-hd">
                        <span className="panel-title">Top produits — niveau de stock</span>
                        <span className="panel-meta">5 premiers</span>
                      </div>
                      {[...products]
                        .sort((a, b) => b.current_stock - a.current_stock)
                        .slice(0, 5)
                        .map(p => {
                          const maxV = Math.max(...products.map(x => x.current_stock), 1);
                          const pct  = (p.current_stock / maxV) * 100;
                          const low  = p.current_stock < p.min_stock;
                          return (
                            <div key={p.id} className="hbar">
                              <span className="hbar-name" title={p.name}>{p.name}</span>
                              <div className="hbar-track">
                                <div className="hbar-fill" style={{
                                  width: `${pct}%`,
                                  background: low
                                    ? 'linear-gradient(90deg,#92400e,#f59e0b)'
                                    : 'linear-gradient(90deg,#4f46e5,#818cf8)'
                                }} />
                              </div>
                              <span className="hbar-val">{p.current_stock}</span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </>
              )}

              {/* Recent movements */}
              <div className="table-card">
                <div className="table-card-hd">
                  <span className="table-card-title">Mouvements récents</span>
                </div>
                <table>
                  <thead><tr><th>Date</th><th>Produit</th><th>Type</th><th>Qté</th></tr></thead>
                  <tbody>
                    {(dashboard?.recentMovements || []).map(m => (
                      <tr key={m.id}>
                        <td className="mono">{new Date(m.created_at).toLocaleString('fr-CA')}</td>
                        <td><strong>{m.product_name}</strong></td>
                        <td><MovBadge type={m.type} /></td>
                        <td style={{ fontWeight: 700 }}>{m.quantity}</td>
                      </tr>
                    ))}
                    {!dashboard?.recentMovements?.length && <tr><td colSpan={4} className="empty">Aucun mouvement enregistré</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ PRODUCTS ═══════════════════════════════════════════════════════ */}
        {tab === 'products' && (
          <div className="page-section">
            <div className="page-head">
              <div className="page-head-left">
                <h2>Produits & stock</h2>
                <p>{filteredProducts.length} / {products.length} produits</p>
              </div>
              <div className="page-head-actions">
                <div className="search-bar">
                  {I.search}
                  <input placeholder="Rechercher…" value={search}
                    onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="page-body">
              {user.role === 'gestionnaire' && (
                <div className="card">
                  <div className="card-title">Ajouter un produit</div>
                  <form className="form" onSubmit={createProduct}>
                    <label>Nom du produit *
                      <input required value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} />
                    </label>
                    <div className="form-row">
                      <label>Catégorie
                        <select value={pForm.category_id} onChange={e => setPForm({ ...pForm, category_id: e.target.value })}>
                          <option value="">Aucune</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </label>
                      <label>Fournisseur
                        <select value={pForm.supplier_id} onChange={e => setPForm({ ...pForm, supplier_id: e.target.value })}>
                          <option value="">Aucun</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </label>
                      <label>Prix ($) <input type="number" step=".01" value={pForm.unit_price} onChange={e => setPForm({ ...pForm, unit_price: e.target.value })} /></label>
                      <label>Stock min. <input type="number" min="0" value={pForm.min_stock} onChange={e => setPForm({ ...pForm, min_stock: e.target.value })} /></label>
                    </div>
                    <div><button type="submit" className="btn btn-primary btn-sm">{I.plus} Ajouter</button></div>
                  </form>
                </div>
              )}
              <div className="table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th><th>Catégorie</th><th>Fournisseur</th>
                      <th>Prix</th><th>Stock</th><th>Seuil</th>
                      {user.role === 'gestionnaire' && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id} className={p.current_stock < p.min_stock ? 'row-warn' : ''}>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.category_name
                          ? <span className="badge badge-indigo">{p.category_name}</span>
                          : <span style={{ color: 'var(--t4)' }}>—</span>}</td>
                        <td style={{ color: 'var(--t2)' }}>{p.supplier_name || <span style={{ color: 'var(--t4)' }}>—</span>}</td>
                        <td className="mono">{p.unit_price?.toFixed(2)} $</td>
                        <td><SBar cur={p.current_stock} min={p.min_stock} max={Math.max(p.current_stock * 1.5, p.min_stock * 2, 1)} /></td>
                        <td style={{ color: 'var(--t3)' }}>{p.min_stock}</td>
                        {user.role === 'gestionnaire' && (
                          <td><div className="td-actions">
                            <button className="btn btn-ghost btn-xs" onClick={() => setEditP({ ...p })}>{I.edit}</button>
                            <button className="btn btn-danger btn-xs" onClick={() => deleteProduct(p.id, p.name)}>{I.trash}</button>
                          </div></td>
                        )}
                      </tr>
                    ))}
                    {!filteredProducts.length && (
                      <tr><td colSpan={7} className="empty">
                        {search ? `Aucun résultat pour « ${search} »` : 'Aucun produit enregistré'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ MOVEMENTS ══════════════════════════════════════════════════════ */}
        {tab === 'movements' && (
          <div className="page-section">
            <div className="page-head">
              <div className="page-head-left">
                <h2>Mouvements de stock</h2>
                <p>{movements.length} opération{movements.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="page-body">
              <div className="card">
                <div className="card-title">Enregistrer un mouvement</div>
                <form className="form" onSubmit={createMovement}>
                  <div className="form-row">
                    <label>Produit *
                      <select required value={mForm.product_id} onChange={e => setMForm({ ...mForm, product_id: e.target.value })}>
                        <option value="">Sélectionner…</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock : {p.current_stock})</option>)}
                      </select>
                    </label>
                    <label>Type
                      <select value={mForm.type} onChange={e => setMForm({ ...mForm, type: e.target.value })}>
                        <option value="entree">↑ Entrée</option>
                        <option value="sortie">↓ Sortie</option>
                      </select>
                    </label>
                    <label>Quantité *
                      <input type="number" min="1" required value={mForm.quantity} onChange={e => setMForm({ ...mForm, quantity: e.target.value })} />
                    </label>
                  </div>
                  <div><button type="submit" className="btn btn-primary btn-sm">{I.plus} Enregistrer</button></div>
                </form>
              </div>
              <div className="table-card">
                <table>
                  <thead><tr><th>Date</th><th>Produit</th><th>Type</th><th>Quantité</th></tr></thead>
                  <tbody>
                    {movements.map(m => (
                      <tr key={m.id}>
                        <td className="mono">{new Date(m.created_at).toLocaleString('fr-CA')}</td>
                        <td><strong>{m.product_name}</strong></td>
                        <td><MovBadge type={m.type} /></td>
                        <td style={{ fontWeight: 700 }}>{m.quantity}</td>
                      </tr>
                    ))}
                    {!movements.length && <tr><td colSpan={4} className="empty">Aucun mouvement enregistré</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ CATEGORIES ═════════════════════════════════════════════════════ */}
        {tab === 'categories' && (
          <div className="page-section">
            <div className="page-head">
              <div className="page-head-left">
                <h2>Catégories</h2>
                <p>{categories.length} catégorie{categories.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="page-body">
              {user.role === 'gestionnaire' && (
                <div className="card">
                  <div className="card-title">Ajouter une catégorie</div>
                  <form className="form" onSubmit={createCategory}>
                    <div className="form-row">
                      <label>Nom * <input required value={cForm.name} onChange={e => setCForm({ ...cForm, name: e.target.value })} /></label>
                      <label>Description <input value={cForm.description} onChange={e => setCForm({ ...cForm, description: e.target.value })} /></label>
                    </div>
                    <div><button type="submit" className="btn btn-primary btn-sm">{I.plus} Ajouter</button></div>
                  </form>
                </div>
              )}
              <div className="table-card">
                <table>
                  <thead><tr><th>Nom</th><th>Description</th>{user.role === 'gestionnaire' && <th></th>}</tr></thead>
                  <tbody>
                    {categories.map(c => (
                      <tr key={c.id}>
                        <td><span className="badge badge-indigo">{c.name}</span></td>
                        <td style={{ color: 'var(--t2)' }}>{c.description || <span style={{ color: 'var(--t4)' }}>—</span>}</td>
                        {user.role === 'gestionnaire' && (
                          <td><div className="td-actions">
                            <button className="btn btn-ghost btn-xs" onClick={() => setEditC({ ...c })}>{I.edit}</button>
                            <button className="btn btn-danger btn-xs" onClick={() => deleteCategory(c.id, c.name)}>{I.trash}</button>
                          </div></td>
                        )}
                      </tr>
                    ))}
                    {!categories.length && <tr><td colSpan={3} className="empty">Aucune catégorie</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ SUPPLIERS ══════════════════════════════════════════════════════ */}
        {tab === 'suppliers' && (
          <div className="page-section">
            <div className="page-head">
              <div className="page-head-left">
                <h2>Fournisseurs</h2>
                <p>{suppliers.length} fournisseur{suppliers.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="page-body">
              {user.role === 'gestionnaire' && (
                <div className="card">
                  <div className="card-title">Ajouter un fournisseur</div>
                  <form className="form" onSubmit={createSupplier}>
                    <div className="form-row">
                      <label>Nom * <input required value={sForm.name} onChange={e => setSForm({ ...sForm, name: e.target.value })} /></label>
                      <label>Contact <input value={sForm.contact} onChange={e => setSForm({ ...sForm, contact: e.target.value })} /></label>
                    </div>
                    <div><button type="submit" className="btn btn-primary btn-sm">{I.plus} Ajouter</button></div>
                  </form>
                </div>
              )}
              <div className="table-card">
                <table>
                  <thead><tr><th>Nom</th><th>Contact</th>{user.role === 'gestionnaire' && <th></th>}</tr></thead>
                  <tbody>
                    {suppliers.map(s => (
                      <tr key={s.id}>
                        <td><strong>{s.name}</strong></td>
                        <td style={{ color: 'var(--t2)' }}>{s.contact || <span style={{ color: 'var(--t4)' }}>—</span>}</td>
                        {user.role === 'gestionnaire' && (
                          <td><div className="td-actions">
                            <button className="btn btn-ghost btn-xs" onClick={() => setEditS({ ...s })}>{I.edit}</button>
                            <button className="btn btn-danger btn-xs" onClick={() => deleteSupplier(s.id, s.name)}>{I.trash}</button>
                          </div></td>
                        )}
                      </tr>
                    ))}
                    {!suppliers.length && <tr><td colSpan={3} className="empty">Aucun fournisseur</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ ALERTS ═════════════════════════════════════════════════════════ */}
        {tab === 'alerts' && (
          <div className="page-section">
            <div className="page-head">
              <div className="page-head-left">
                <h2>Alertes stock</h2>
                {lowStock.length > 0 && <p>{lowStock.length} produit{lowStock.length > 1 ? 's' : ''} à réapprovisionner</p>}
              </div>
            </div>
            <div className="page-body">
              {lowStock.length === 0 ? (
                <div className="alert-ok">
                  {I.check}
                  <strong>Stock en bonne santé</strong>
                  <span>Tous les produits sont au-dessus de leur seuil minimum.</span>
                </div>
              ) : (
                <>
                  <div className="alert-bar">
                    {I.warning}
                    <strong>{lowStock.length} produit{lowStock.length > 1 ? 's' : ''}</strong>
                    &nbsp;{lowStock.length > 1 ? 'nécessitent' : 'nécessite'} un réapprovisionnement urgent.
                  </div>
                  <div className="table-card">
                    <table>
                      <thead><tr><th>Produit</th><th>Catégorie</th><th>Fournisseur</th><th>Stock</th><th>Seuil</th><th>Déficit</th></tr></thead>
                      <tbody>
                        {lowStock.map(p => (
                          <tr key={p.id} className="row-warn">
                            <td><strong>{p.name}</strong></td>
                            <td>{p.category_name ? <span className="badge badge-indigo">{p.category_name}</span> : <span style={{ color: 'var(--t4)' }}>—</span>}</td>
                            <td style={{ color: 'var(--t2)' }}>{p.supplier_name || '—'}</td>
                            <td><span className="badge badge-amber">{p.current_stock}</span></td>
                            <td style={{ color: 'var(--t3)' }}>{p.min_stock}</td>
                            <td><span className="badge badge-red">−{p.min_stock - p.current_stock}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ AI ═════════════════════════════════════════════════════════════ */}
        {tab === 'ai' && (
          <div className="page-section">
            <div className="page-head">
              <div className="page-head-left">
                <h2>Analyse IA</h2>
                <p>Santé du stock et recommandations de réapprovisionnement</p>
              </div>
              <div className="page-head-actions">
                <button className="btn btn-primary" onClick={fetchAi} disabled={loadingAi}>
                  {loadingAi ? <><span className="spin">{I.refresh}</span> Analyse…</> : <>{I.spark} Lancer l'analyse</>}
                </button>
                {aiReport && <>
                  <button className="btn btn-ghost btn-sm" onClick={() => downloadReport('txt')}>{I.download} TXT</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => downloadReport('pdf')}>{I.download} PDF</button>
                </>}
              </div>
            </div>
            <div className="page-body">
              {!aiReport ? (
                <div className="ai-empty">
                  <div className="ai-empty-icon">{I.spark}</div>
                  <div className="ai-empty-title">Aucune analyse générée</div>
                  <div className="ai-empty-sub">Cliquez sur « Lancer l'analyse » pour obtenir un rapport complet de santé du stock et des recommandations de réapprovisionnement.</div>
                  <button className="btn btn-primary" onClick={fetchAi} disabled={loadingAi} style={{ marginTop: '1.25rem' }}>
                    {loadingAi ? <><span className="spin">{I.refresh}</span> Analyse…</> : <>{I.spark} Lancer l'analyse</>}
                  </button>
                </div>
              ) : (
                <>
                  <div className="ai-kpi-row">
                    <div className="ai-health-card">
                      <div className="ai-health-ring" style={{
                        '--hc': aiReport.healthScore >= 70 ? '#22c55e' : aiReport.healthScore >= 40 ? '#f59e0b' : '#ef4444',
                        '--hdeg': `${(aiReport.healthScore / 100) * 360}deg`,
                      }}>
                        <span className="ai-health-pct">{aiReport.healthScore}%</span>
                      </div>
                      <div className="ai-health-info">
                        <div className="ai-health-title">Score de santé du stock</div>
                        <div className="ai-health-sub">
                          {aiReport.criticalCount === 0
                            ? 'Tous les produits sont bien approvisionnés'
                            : `${aiReport.criticalCount} produit${aiReport.criticalCount > 1 ? 's' : ''} nécessite${aiReport.criticalCount > 1 ? 'nt' : ''} une action`}
                        </div>
                        {aiReport.aiComment && <p className="ai-comment">{aiReport.aiComment}</p>}
                      </div>
                    </div>
                    <div className="ai-meta-cards">
                      <div className="ai-meta-card">
                        <div className="ai-meta-val" style={{ color: 'var(--a2)' }}>{aiReport.totalProducts}</div>
                        <div className="ai-meta-lbl">Produits analysés</div>
                      </div>
                      <div className="ai-meta-card">
                        <div className="ai-meta-val" style={{ color: aiReport.criticalCount > 0 ? 'var(--amber)' : 'var(--green)' }}>{aiReport.criticalCount}</div>
                        <div className="ai-meta-lbl">Sous seuil</div>
                      </div>
                      <div className="ai-meta-card">
                        <div className="ai-meta-val" style={{ color: 'var(--teal)' }}>{aiRec?.items?.length ?? 0}</div>
                        <div className="ai-meta-lbl">Recommandations</div>
                      </div>
                    </div>
                  </div>

                  <div className="panel" style={{ marginBottom: '.9rem' }}>
                    <div className="panel-hd">
                      <span className="panel-title">État des stocks</span>
                      <span className="panel-meta">{new Date(aiReport.generatedAt).toLocaleString('fr-CA')}</span>
                    </div>
                    <div className="ai-stock-list">
                      {aiReport.stockItems.map(item => {
                        const pct = item.minStock > 0 ? Math.min((item.stock / (item.minStock * 2)) * 100, 100) : 100;
                        return (
                          <div key={item.name} className="ai-stock-row">
                            <span className="ai-stock-name">{item.name}</span>
                            <div className="ai-stock-bar-wrap">
                              <div className="ai-stock-bar" style={{
                                width: `${pct}%`,
                                background: item.status === 'ok'
                                  ? 'linear-gradient(90deg,#166534,#22c55e)'
                                  : item.status === 'critique'
                                  ? 'linear-gradient(90deg,#92400e,#f59e0b)'
                                  : 'linear-gradient(90deg,#7f1d1d,#ef4444)',
                              }} />
                            </div>
                            <span className="ai-stock-nums">{item.stock} / {item.minStock}</span>
                            <span className={`badge ${item.status === 'ok' ? 'badge-green' : item.status === 'critique' ? 'badge-amber' : 'badge-red'}`}>
                              {item.status === 'ok' ? 'OK' : item.status === 'rupture' ? 'Rupture' : 'Critique'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {aiRec?.items?.length > 0 && (
                    <div className="panel">
                      <div className="panel-hd">
                        <span className="panel-title">Recommandations de réapprovisionnement</span>
                      </div>
                      {aiRec.aiComment && <p className="ai-comment" style={{ marginBottom: '1rem' }}>{aiRec.aiComment}</p>}
                      <div className="ai-rec-list">
                        {aiRec.items.map(item => (
                          <div key={item.product} className={`ai-rec-card ai-rec-${item.urgency}`}>
                            <div className="ai-rec-rank">#{item.rank}</div>
                            <div className="ai-rec-info">
                              <div className="ai-rec-name">{item.product}</div>
                              <div className="ai-rec-meta">Stock actuel : <strong>{item.currentStock}</strong> · Sorties totales : <strong>{item.totalSales}</strong></div>
                            </div>
                            <div className="ai-rec-qty">
                              <div className="ai-rec-qty-val">+{item.suggested}</div>
                              <div className="ai-rec-qty-lbl">unités suggérées</div>
                            </div>
                            <span className={`badge ${item.urgency === 'critique' ? 'badge-red' : item.urgency === 'elevee' ? 'badge-amber' : 'badge-green'}`}>
                              {item.urgency === 'critique' ? 'Urgent' : item.urgency === 'elevee' ? 'Élevé' : 'Normal'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ USERS ══════════════════════════════════════════════════════════ */}
        {tab === 'users' && user.role === 'gestionnaire' && (
          <div className="page-section">
            <div className="page-head">
              <div className="page-head-left">
                <h2>Utilisateurs</h2>
                <p>Gestion des comptes et des rôles</p>
              </div>
            </div>
            <div className="page-body">
              <div className="card">
                <div className="card-title">Créer un compte</div>
                <form className="form" onSubmit={createUser}>
                  <div className="form-row">
                    <label>Nom d'utilisateur * <input required value={uForm.username} onChange={e => setUForm({ ...uForm, username: e.target.value })} /></label>
                    <label>Mot de passe * <input type="password" required value={uForm.password} onChange={e => setUForm({ ...uForm, password: e.target.value })} /></label>
                    <label>Rôle
                      <select value={uForm.role} onChange={e => setUForm({ ...uForm, role: e.target.value })}>
                        <option value="employe">Employé</option>
                        <option value="gestionnaire">Gestionnaire</option>
                      </select>
                    </label>
                  </div>
                  <div><button type="submit" className="btn btn-primary btn-sm">{I.plus} Créer</button></div>
                </form>
              </div>
              <div className="table-card">
                <table>
                  <thead><tr><th>#</th><th>Utilisateur</th><th>Rôle</th><th></th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="mono">{u.id}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
                            <div className="user-ava" style={{ width: 26, height: 26, fontSize: '.65rem' }}>
                              {u.username[0].toUpperCase()}
                            </div>
                            <strong>{u.username}</strong>
                          </div>
                        </td>
                        <td><span className={`role ${u.role === 'gestionnaire' ? 'role-g' : 'role-e'}`}>{u.role}</span></td>
                        <td>
                          {u.username !== 'admin' && (
                            <button className="btn btn-danger btn-xs" onClick={() => deleteUser(u.id, u.username)}>
                              {I.trash} Supprimer
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!users.length && <tr><td colSpan={4} className="empty">Aucun utilisateur chargé</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
