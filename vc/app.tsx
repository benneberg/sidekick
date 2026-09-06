import { useState, useEffect, useCallback, useReducer } from "react";

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const DEMO_PROJECT = {
  id: "demo-001",
  name: "NordicCase",
  description: "MagSafe-ställ för iPhone – minimalistisk nordisk design",
  stage: "research",
  businessModel: "dropshipping",
  isDemo: true,
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEMO_TASKS = [
  { id: "t1", projectId: "demo-001", title: "Välj produkt", status: "done", priority: "high", createdAt: new Date().toISOString(), completedAt: new Date().toISOString() },
  { id: "t2", projectId: "demo-001", title: "Undersök 5 konkurrenter", status: "done", priority: "high", createdAt: new Date().toISOString(), completedAt: new Date().toISOString() },
  { id: "t3", projectId: "demo-001", title: "Hitta 3 leverantörer", status: "todo", priority: "high", createdAt: new Date().toISOString() },
  { id: "t4", projectId: "demo-001", title: "Kontrollera fraktkostnad", status: "todo", priority: "high", createdAt: new Date().toISOString() },
  { id: "t5", projectId: "demo-001", title: "Räkna ut faktisk marginal", status: "todo", priority: "medium", createdAt: new Date().toISOString() },
];

const DEMO_NOTES = [
  { id: "n1", projectId: "demo-001", title: "Aliexpress-leverantör", type: "supplier", content: "Hittade bra leverantör. Pris: 65 kr/st. Frakt 30-40 kr. Leveranstid 12-18 dagar.", tags: ["leverantör", "pris"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "n2", projectId: "demo-001", title: "Konkurrentanalys – Casetify", type: "research", content: "Säljer liknande för 299-499 kr. Hög marknadsföring på Instagram och TikTok. Starka reviews.", tags: ["konkurrent"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "n3", projectId: "demo-001", title: "Risk: lång leveranstid", type: "risk", content: "12-18 dagars leveranstid kan vara problem. Kunder förväntar sig max 5-7 dagar. Undersök snabbare alternativ.", tags: ["risk", "frakt"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const DEMO_PRODUCT = {
  id: "p1", projectId: "demo-001", name: "MagSafe Phone Stand – Nordic",
  description: "Minimalistisk telefonstativ i aluminium med MagSafe-stöd",
  salePrice: 29900, purchasePrice: 6500, shippingCost: 3500,
  paymentFee: 800, advertisingCost: 5500,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

const LIFECYCLE_STAGES = [
  { id: "idea", label: "Idé", color: "#7C8EF0" },
  { id: "research", label: "Forskning", color: "#5B5FEF" },
  { id: "validation", label: "Validering", color: "#F0A500" },
  { id: "test", label: "Test", color: "#FF6B35" },
  { id: "launch", label: "Lansering", color: "#4ECDC4" },
  { id: "active", label: "Aktiv", color: "#2ECC71" },
  { id: "paused", label: "Pausad", color: "#95A5A6" },
  { id: "failed", label: "Avslutad", color: "#E74C3C" },
];

const NOTE_TYPES = [
  { id: "note", label: "Anteckning", icon: "📝" },
  { id: "idea", label: "Idé", icon: "💡" },
  { id: "research", label: "Forskning", icon: "🔎" },
  { id: "risk", label: "Risk", icon: "⚠️" },
  { id: "supplier", label: "Leverantör", icon: "📦" },
  { id: "finance", label: "Ekonomi", icon: "💰" },
  { id: "competitor", label: "Konkurrent", icon: "🎯" },
];

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const storage = {
  get: (key, fallback = null) => {
    try { const v = localStorage.getItem("sk_" + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set: (key, val) => {
    try { localStorage.setItem("sk_" + key, JSON.stringify(val)); } catch {}
  },
};

function useStorage(key, initial) {
  const [state, setState] = useState(() => storage.get(key, initial));
  const set = useCallback((val) => {
    setState(prev => {
      const next = typeof val === "function" ? val(prev) : val;
      storage.set(key, next);
      return next;
    });
  }, [key]);
  return [state, set];
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── CALCULATIONS ─────────────────────────────────────────────────────────────
function calcProfit(p) {
  const revenue = p.salePrice || 0;
  const costs = (p.purchasePrice || 0) + (p.shippingCost || 0) + (p.paymentFee || 0) + (p.advertisingCost || 0);
  const contribution = revenue - costs;
  const margin = revenue > 0 ? (contribution / revenue) * 100 : 0;
  const breakEven = p.advertisingCost > 0 ? Math.ceil(p.advertisingCost / Math.max(contribution, 1)) : 0;
  return { revenue, costs, contribution, margin: Math.round(margin * 10) / 10, breakEven };
}

function formatKr(ore) {
  return (ore / 100).toFixed(0) + " kr";
}

// ─── RECOMMENDATIONS ─────────────────────────────────────────────────────────
function generateRecommendations(project, tasks, notes, product) {
  const recs = [];
  const doneTasks = tasks.filter(t => t.projectId === project.id && t.status === "done");
  const todoTasks = tasks.filter(t => t.projectId === project.id && t.status !== "done");
  const projectNotes = notes.filter(n => n.projectId === project.id);
  const supplierNotes = projectNotes.filter(n => n.type === "supplier");
  const riskNotes = projectNotes.filter(n => n.type === "risk");

  if (supplierNotes.length === 0) {
    recs.push({ id: "r1", type: "next-task", title: "Hitta minst 3 leverantörer", reason: "Du har inga leverantörer dokumenterade ännu.", priority: 90, icon: "📦" });
  }
  if (product && !product.shippingCost) {
    recs.push({ id: "r2", type: "warning", title: "Fraktkostnad saknas i kalkylen", reason: "Din vinstkalkyl stämmer inte utan fraktkostnad.", priority: 85, icon: "⚠️" });
  }
  if (product && !product.advertisingCost) {
    recs.push({ id: "r3", type: "warning", title: "Annonseringskostnad saknas", reason: "Glöm inte räkna med annonskostnader – det är en stor utgift.", priority: 80, icon: "💸" });
  }
  if (product) {
    const { margin } = calcProfit(product);
    if (margin < 20 && margin > 0) {
      recs.push({ id: "r4", type: "warning", title: "Låg marginal – bara " + margin.toFixed(0) + "%", reason: "Under 20% marginal är svårt att bli lönsam med annonsering.", priority: 95, icon: "📉" });
    }
    if (margin > 60) {
      recs.push({ id: "r5", type: "opportunity", title: "Hög marginal – bra läge!", reason: "Over 60% marginal ger dig utrymme för annonsering och returer.", priority: 40, icon: "🚀" });
    }
  }
  if (riskNotes.length === 0 && doneTasks.length > 0) {
    recs.push({ id: "r6", type: "missing-information", title: "Dokumentera risker", reason: "Alla projekt har risker. Skriv ned dem så du inte glömmer.", priority: 50, icon: "🎯" });
  }
  if (todoTasks.length > 0) {
    recs.push({ id: "r7", type: "next-task", title: todoTasks[0].title, reason: "Nästa uppgift att slutföra.", priority: 70, icon: "✅" });
  }
  return recs.sort((a, b) => b.priority - a.priority);
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0B1526;
    --surface: #111E33;
    --surface2: #162540;
    --surface3: #1D2F4A;
    --border: #243552;
    --primary: #5B5FEF;
    --primary-light: #7C80F5;
    --primary-dim: rgba(91,95,239,0.15);
    --accent: #4ECDC4;
    --accent-dim: rgba(78,205,196,0.15);
    --warn: #F59E0B;
    --warn-dim: rgba(245,158,11,0.15);
    --danger: #EF4444;
    --danger-dim: rgba(239,68,68,0.15);
    --success: #10B981;
    --success-dim: rgba(16,185,129,0.15);
    --text: #F0F4FF;
    --text2: #8FA3C4;
    --text3: #4D6480;
    --radius: 14px;
    --radius-sm: 8px;
    --shadow: 0 4px 24px rgba(0,0,0,0.4);
    --nav-h: 68px;
    --header-h: 56px;
    --font: 'Inter', system-ui, sans-serif;
  }

  html, body, #root { height: 100%; background: var(--bg); color: var(--text); font-family: var(--font); -webkit-font-smoothing: antialiased; }

  .app { display: flex; flex-direction: column; height: 100%; max-width: 480px; margin: 0 auto; position: relative; }

  /* HEADER */
  .header { position: sticky; top: 0; z-index: 50; background: var(--bg); border-bottom: 1px solid var(--border); height: var(--header-h); display: flex; align-items: center; padding: 0 16px; gap: 12px; }
  .header-title { font-size: 17px; font-weight: 700; letter-spacing: -0.3px; flex: 1; }
  .header-back { background: var(--surface2); border: none; color: var(--text2); padding: 6px 12px; border-radius: 20px; font-size: 14px; cursor: pointer; font-family: var(--font); display: flex; align-items: center; gap: 4px; }
  .header-action { background: var(--primary); border: none; color: white; padding: 7px 14px; border-radius: 20px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font); white-space: nowrap; }

  /* SCROLL AREA */
  .scroll { flex: 1; overflow-y: auto; padding-bottom: calc(var(--nav-h) + 16px); -webkit-overflow-scrolling: touch; }
  .scroll::-webkit-scrollbar { display: none; }

  /* BOTTOM NAV */
  .nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; height: var(--nav-h); background: var(--surface); border-top: 1px solid var(--border); display: flex; align-items: center; z-index: 100; }
  .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 8px 0; cursor: pointer; color: var(--text3); border: none; background: none; font-family: var(--font); transition: color 0.15s; }
  .nav-item.active { color: var(--primary-light); }
  .nav-item svg { width: 22px; height: 22px; }
  .nav-label { font-size: 10px; font-weight: 600; letter-spacing: 0.2px; }

  /* CARDS */
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; }
  .card + .card { margin-top: 10px; }
  .card-sm { padding: 12px 14px; }
  .section { padding: 16px; }
  .section + .section { padding-top: 0; }
  .section-title { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; }

  /* PILLS / BADGES */
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-primary { background: var(--primary-dim); color: var(--primary-light); }
  .badge-accent { background: var(--accent-dim); color: var(--accent); }
  .badge-warn { background: var(--warn-dim); color: var(--warn); }
  .badge-danger { background: var(--danger-dim); color: var(--danger); }
  .badge-success { background: var(--success-dim); color: var(--success); }
  .badge-neutral { background: var(--surface2); color: var(--text2); }

  /* BUTTONS */
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 11px 18px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; border: none; font-family: var(--font); transition: opacity 0.15s; }
  .btn:active { opacity: 0.8; }
  .btn-primary { background: var(--primary); color: white; }
  .btn-secondary { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
  .btn-danger { background: var(--danger-dim); color: var(--danger); }
  .btn-full { width: 100%; }
  .btn-sm { padding: 7px 14px; font-size: 13px; border-radius: 8px; }

  /* INPUTS */
  .input { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); padding: 11px 13px; font-size: 15px; font-family: var(--font); outline: none; transition: border-color 0.15s; }
  .input:focus { border-color: var(--primary); }
  .input::placeholder { color: var(--text3); }
  .textarea { min-height: 90px; resize: vertical; }
  .label { font-size: 13px; font-weight: 600; color: var(--text2); margin-bottom: 5px; display: block; }
  .field { margin-bottom: 14px; }
  .select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238FA3C4' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 13px center; padding-right: 36px; }

  /* DASHBOARD SPECIFIC */
  .greeting { padding: 20px 16px 8px; }
  .greeting-name { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
  .greeting-sub { font-size: 14px; color: var(--text2); margin-top: 2px; }

  .project-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; cursor: pointer; transition: border-color 0.15s; }
  .project-card:hover { border-color: var(--primary); }
  .project-name { font-size: 16px; font-weight: 700; }
  .project-desc { font-size: 13px; color: var(--text2); margin-top: 3px; line-height: 1.4; }
  .progress-bar { height: 5px; background: var(--surface3); border-radius: 10px; margin-top: 12px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 10px; background: var(--primary); transition: width 0.4s; }

  .rec-card { display: flex; align-items: flex-start; gap: 12px; padding: 13px 14px; background: var(--surface2); border-radius: var(--radius-sm); border: 1px solid var(--border); }
  .rec-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
  .rec-title { font-size: 14px; font-weight: 600; }
  .rec-reason { font-size: 12px; color: var(--text2); margin-top: 2px; line-height: 1.4; }
  .rec-card + .rec-card { margin-top: 8px; }

  /* TASK */
  .task-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; transition: border-color 0.15s; }
  .task-item + .task-item { margin-top: 8px; }
  .task-item.done { opacity: 0.5; }
  .task-check { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
  .task-check.checked { background: var(--success); border-color: var(--success); }
  .task-title { font-size: 14px; font-weight: 500; flex: 1; }
  .task-title.done { text-decoration: line-through; color: var(--text3); }
  .priority-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

  /* NOTE */
  .note-item { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 13px 14px; cursor: pointer; }
  .note-item + .note-item { margin-top: 8px; }
  .note-title { font-size: 14px; font-weight: 600; }
  .note-preview { font-size: 12px; color: var(--text2); margin-top: 4px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .note-meta { font-size: 11px; color: var(--text3); margin-top: 6px; }

  /* CALC */
  .calc-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); }
  .calc-row:last-child { border-bottom: none; }
  .calc-label { font-size: 14px; color: var(--text2); }
  .calc-value { font-size: 14px; font-weight: 600; }
  .calc-total { font-size: 16px; font-weight: 700; }
  .margin-display { text-align: center; padding: 20px; }
  .margin-pct { font-size: 52px; font-weight: 800; letter-spacing: -2px; }
  .margin-label { font-size: 13px; color: var(--text2); margin-top: 4px; }

  /* MODAL OVERLAY */
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200; display: flex; align-items: flex-end; max-width: 480px; margin: 0 auto; left: 50%; transform: translateX(-50%); }
  .sheet { background: var(--surface); border-radius: 20px 20px 0 0; padding: 20px 16px; width: 100%; max-height: 90vh; overflow-y: auto; }
  .sheet-handle { width: 36px; height: 4px; background: var(--border); border-radius: 10px; margin: 0 auto 16px; }
  .sheet-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; }

  /* EMPTY STATE */
  .empty { text-align: center; padding: 48px 24px; }
  .empty-icon { font-size: 48px; margin-bottom: 12px; }
  .empty-title { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
  .empty-desc { font-size: 14px; color: var(--text2); line-height: 1.5; margin-bottom: 20px; }

  /* STAGE INDICATOR */
  .stage-steps { display: flex; gap: 4px; padding: 12px 0 4px; overflow-x: auto; }
  .stage-step { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 54px; }
  .stage-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--surface3); }
  .stage-dot.active { background: var(--primary); box-shadow: 0 0 0 3px var(--primary-dim); }
  .stage-dot.done { background: var(--success); }
  .stage-step-label { font-size: 10px; color: var(--text3); text-align: center; }
  .stage-step.active .stage-step-label { color: var(--primary-light); font-weight: 600; }

  /* STAT GRID */
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .stat-card { background: var(--surface2); border-radius: var(--radius-sm); padding: 14px; border: 1px solid var(--border); }
  .stat-val { font-size: 20px; font-weight: 800; }
  .stat-lbl { font-size: 12px; color: var(--text2); margin-top: 2px; }

  /* DIVIDER */
  .divider { height: 1px; background: var(--border); margin: 4px 0; }

  /* ONBOARDING */
  .onboard { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100%; padding: 32px 24px; text-align: center; }
  .onboard-logo { font-size: 56px; margin-bottom: 16px; }
  .onboard-title { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
  .onboard-sub { font-size: 16px; color: var(--text2); line-height: 1.5; margin-bottom: 32px; }
  .option-btn { width: 100%; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); font-size: 15px; font-weight: 600; color: var(--text); cursor: pointer; font-family: var(--font); text-align: left; margin-bottom: 8px; transition: border-color 0.15s; }
  .option-btn:hover, .option-btn.selected { border-color: var(--primary); background: var(--primary-dim); }

  /* PRODUCT DETAIL */
  .pill-row { display: flex; gap: 6px; flex-wrap: wrap; }
  .tag { padding: 4px 10px; background: var(--surface2); border-radius: 20px; font-size: 12px; color: var(--text2); }

  /* Utility */
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-8 { gap: 8px; }
  .gap-12 { gap: 12px; }
  .mt-4 { margin-top: 4px; }
  .mt-8 { margin-top: 8px; }
  .mt-12 { margin-top: 12px; }
  .mt-16 { margin-top: 16px; }
  .text-sm { font-size: 13px; }
  .text-xs { font-size: 11px; }
  .text-muted { color: var(--text2); }
  .text-danger { color: var(--danger); }
  .text-success { color: var(--success); }
  .text-accent { color: var(--accent); }
  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }
`;

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = {
  Home: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Projects: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
  Notes: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>,
  Calc: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="14"/><line x1="16" x2="16" y1="18" y2="18"/><line x1="12" x2="12" y1="14" y2="14"/><line x1="12" x2="12" y1="18" y2="18"/><line x1="8" x2="8" y1="14" y2="14"/><line x1="8" x2="8" y1="18" y2="18"/><line x1="8" x2="16" y1="10" y2="10"/></svg>,
  Tasks: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 12H3"/><path d="M16 6H3"/><path d="M16 18H3"/><path d="m19 10-4 4 2 2 4-7"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="m9 18 6-6-6-6"/></svg>,
  Back: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="m15 18-6-6 6-6"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
};

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");

  const steps = [
    <div key="0" className="onboard">
      <div className="onboard-logo">🚀</div>
      <h1 className="onboard-title">Sidekick</h1>
      <p className="onboard-sub">Din personliga startuphjälpreda.<br/>Testa idéer. Räkna på lönsamhet.<br/>Ta nästa steg.</p>
      <button className="btn btn-primary btn-full" style={{fontSize:16,padding:"14px"}} onClick={() => setStep(1)}>Kom igång</button>
    </div>,
    <div key="1" className="onboard">
      <div className="onboard-logo">👋</div>
      <h1 className="onboard-title" style={{fontSize:24}}>Vad heter du?</h1>
      <input className="input" placeholder="Ditt namn" value={name} onChange={e => setName(e.target.value)} style={{marginBottom:16,textAlign:"center",fontSize:18}} autoFocus />
      <button className="btn btn-primary btn-full" onClick={() => name.trim() && setStep(2)} style={{opacity: name.trim() ? 1 : 0.5}}>Fortsätt</button>
    </div>,
    <div key="2" className="onboard">
      <div className="onboard-logo">🛠️</div>
      <h1 className="onboard-title" style={{fontSize:22}}>Hur mycket erfarenhet har du?</h1>
      <p className="onboard-sub" style={{marginBottom:20}}>Det hjälper oss ge rätt tips.</p>
      {[["beginner","🌱 Nybörjare","Jag är ny på det här"],["intermediate","🛠️ Testat lite","Har provat men vill lära mig mer"],["advanced","🚀 Erfarenhet","Har drivit projekt eller företag"]].map(([val,icon,desc]) => (
        <button key={val} className={`option-btn ${level===val?"selected":""}`} onClick={() => setLevel(val)}>
          <div>{icon}</div>
          <div style={{fontSize:12,color:"var(--text2)",marginTop:2}}>{desc}</div>
        </button>
      ))}
      <button className="btn btn-primary btn-full" style={{marginTop:8,opacity:level?1:0.5}} onClick={() => level && setStep(3)}>Fortsätt</button>
    </div>,
    <div key="3" className="onboard">
      <div className="onboard-logo">🎯</div>
      <h1 className="onboard-title" style={{fontSize:22}}>Redo, {name}!</h1>
      <p className="onboard-sub">Sidekick guidar dig från idé till lönsamt projekt – ett steg i taget.</p>
      <button className="btn btn-primary btn-full" style={{marginBottom:10,fontSize:16,padding:"14px"}} onClick={() => onDone({name, level, includeDemo: true})}>
        Skapa mitt första projekt
      </button>
      <button className="btn btn-secondary btn-full" onClick={() => onDone({name, level, includeDemo: true, goDemo: true})}>
        Visa exempelprojekt
      </button>
    </div>
  ];

  return <div style={{height:"100%",display:"flex",flexDirection:"column"}}>{steps[step]}</div>;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, projects, tasks, notes, products, onNav, onNewProject, onOpenProject }) {
  const activeProjects = projects.filter(p => !["failed","completed"].includes(p.stage));
  const allTodo = tasks.filter(t => t.status !== "done");
  const allDone = tasks.filter(t => t.status === "done");

  const topProject = activeProjects[0];
  const topRecs = topProject ? generateRecommendations(topProject, tasks, notes, products.find(p => p.projectId === topProject.id)) : [];

  const stageOrder = ["idea","research","validation","test","launch","active","paused","failed"];
  function stageProgress(stage) {
    const idx = stageOrder.indexOf(stage);
    return Math.round(((idx + 1) / 6) * 100);
  }

  return (
    <div className="scroll">
      <div className="greeting">
        <div className="greeting-name">Hej, {user.name}! 👋</div>
        <div className="greeting-sub">{activeProjects.length > 0 ? `Du har ${activeProjects.length} aktivt projekt` : "Dags att skapa ditt första projekt"}</div>
      </div>

      {/* Stats */}
      <div className="section">
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-val">{activeProjects.length}</div>
            <div className="stat-lbl">Aktiva projekt</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{allTodo.length}</div>
            <div className="stat-lbl">Uppgifter kvar</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{allDone.length}</div>
            <div className="stat-lbl">Klara uppgifter</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{notes.length}</div>
            <div className="stat-lbl">Anteckningar</div>
          </div>
        </div>
      </div>

      {/* Active Projects */}
      <div className="section">
        <div className="flex justify-between items-center" style={{marginBottom:10}}>
          <div className="section-title" style={{marginBottom:0}}>Mina projekt</div>
          <button className="btn btn-sm btn-primary" onClick={onNewProject} style={{padding:"5px 12px"}}>+ Nytt</button>
        </div>
        {activeProjects.length === 0 ? (
          <div className="empty" style={{padding:"32px 0"}}>
            <div className="empty-icon">🚀</div>
            <div className="empty-title">Inga projekt ännu</div>
            <div className="empty-desc">Har du en idé? Skapa ditt första projekt och börja undersöka den på några minuter.</div>
            <button className="btn btn-primary" onClick={onNewProject}>+ Skapa projekt</button>
          </div>
        ) : (
          activeProjects.map(p => {
            const prog = stageProgress(p.stage);
            const stage = LIFECYCLE_STAGES.find(s => s.id === p.stage);
            return (
              <div key={p.id} className="project-card" style={{marginBottom:8}} onClick={() => onOpenProject(p.id)}>
                <div className="flex justify-between items-center">
                  <div className="project-name">{p.name}</div>
                  <span className="badge badge-primary">{stage?.label}</span>
                </div>
                {p.description && <div className="project-desc">{p.description}</div>}
                <div className="progress-bar"><div className="progress-fill" style={{width:prog+"%"}}/></div>
                <div className="flex justify-between mt-4">
                  <span className="text-xs text-muted">{prog}% färdigt</span>
                  {p.isDemo && <span className="badge badge-neutral">Demo</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Recommendations */}
      {topRecs.length > 0 && (
        <div className="section">
          <div className="section-title">📌 Gör detta nu</div>
          {topRecs.slice(0, 3).map(r => (
            <div key={r.id} className="rec-card" onClick={() => onOpenProject(topProject.id)}>
              <div className="rec-icon">{r.icon}</div>
              <div>
                <div className="rec-title">{r.title}</div>
                <div className="rec-reason">{r.reason}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PROJECT LIST ─────────────────────────────────────────────────────────────
function ProjectList({ projects, tasks, onOpen, onNew }) {
  return (
    <div className="scroll">
      <div className="section">
        {projects.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🗂️</div>
            <div className="empty-title">Inga projekt ännu</div>
            <div className="empty-desc">Skapa ditt första projekt och börja testa din idé.</div>
            <button className="btn btn-primary" onClick={onNew}>+ Skapa projekt</button>
          </div>
        ) : (
          projects.map(p => {
            const stage = LIFECYCLE_STAGES.find(s => s.id === p.stage);
            const ptasks = tasks.filter(t => t.projectId === p.id);
            const done = ptasks.filter(t => t.status === "done").length;
            return (
              <div key={p.id} className="project-card" style={{marginBottom:8}} onClick={() => onOpen(p.id)}>
                <div className="flex justify-between items-center">
                  <div className="project-name">{p.name}</div>
                  <Icon.ChevronRight />
                </div>
                {p.description && <div className="project-desc">{p.description}</div>}
                <div className="flex items-center gap-8 mt-8">
                  <span className="badge badge-primary">{stage?.label}</span>
                  <span className="text-xs text-muted">{done}/{ptasks.length} uppgifter klara</span>
                  {p.isDemo && <span className="badge badge-neutral">Demo</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── PROJECT DETAIL ───────────────────────────────────────────────────────────
function ProjectDetail({ project, tasks, notes, products, onBack, onUpdateTask, onAddTask, onAddNote, onOpenNote, onUpdateProject, onDeleteProject, onOpenProduct }) {
  const [tab, setTab] = useState("overview");
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const ptasks = tasks.filter(t => t.projectId === project.id);
  const pnotes = notes.filter(n => n.projectId === project.id);
  const product = products.find(p => p.projectId === project.id);
  const recs = generateRecommendations(project, tasks, notes, product);
  const stage = LIFECYCLE_STAGES.find(s => s.id === project.stage);
  const stageOrder = ["idea","research","validation","test","launch","active"];
  const stageIdx = stageOrder.indexOf(project.stage);

  function addTask() {
    if (!newTaskTitle.trim()) return;
    onAddTask({ id: genId(), projectId: project.id, title: newTaskTitle.trim(), status: "todo", priority: "medium", createdAt: new Date().toISOString() });
    setNewTaskTitle("");
    setShowAddTask(false);
  }

  function advanceStage() {
    const next = stageOrder[stageIdx + 1];
    if (next) onUpdateProject({ ...project, stage: next, updatedAt: new Date().toISOString() });
  }

  const tabs = [
    { id: "overview", label: "Översikt" },
    { id: "tasks", label: `Uppgifter (${ptasks.filter(t=>t.status!=="done").length})` },
    { id: "notes", label: `Anteckningar (${pnotes.length})` },
    ...(project.businessModel === "dropshipping" ? [{ id: "dropshipping", label: "Dropshipping" }] : []),
  ];

  return (
    <>
      <div className="header">
        <button className="header-back" onClick={onBack}><Icon.Back /> Tillbaka</button>
        <div className="header-title" style={{fontSize:15}}>{project.name}</div>
        <button className="header-action" onClick={() => setConfirmDelete(true)} style={{background:"var(--danger-dim)",color:"var(--danger)"}}>⋯</button>
      </div>

      {/* Stage steps */}
      <div style={{padding:"8px 16px 0",borderBottom:"1px solid var(--border)"}}>
        <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:8}}>
          {stageOrder.map((s, i) => {
            const sl = LIFECYCLE_STAGES.find(x => x.id === s);
            return (
              <div key={s} style={{display:"flex",flexDirection:"column",alignItems:"center",minWidth:52,gap:4}}>
                <div style={{width:8,height:8,borderRadius:"50%",background: i < stageIdx ? "var(--success)" : i === stageIdx ? "var(--primary)" : "var(--surface3)",boxShadow: i === stageIdx ? "0 0 0 3px var(--primary-dim)" : "none"}}/>
                <div style={{fontSize:9,color: i === stageIdx ? "var(--primary-light)" : "var(--text3)",fontWeight: i === stageIdx ? 700 : 400,textAlign:"center"}}>{sl?.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:2,padding:"8px 12px",borderBottom:"1px solid var(--border)",overflowX:"auto"}}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{padding:"6px 12px",borderRadius:20,border:"none",background: tab===t.id ? "var(--primary)" : "transparent",color: tab===t.id ? "white" : "var(--text2)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"var(--font)",whiteSpace:"nowrap"}}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="scroll">
        {tab === "overview" && (
          <>
            <div className="section">
              <div className="card">
                <div style={{fontSize:13,color:"var(--text2)",marginBottom:4}}>Affärsmodell</div>
                <div style={{fontWeight:700,fontSize:15}}>
                  {project.businessModel === "dropshipping" ? "🛒 Dropshipping" : project.businessModel}
                </div>
                {project.description && <div style={{marginTop:8,fontSize:13,color:"var(--text2)",lineHeight:1.5}}>{project.description}</div>}
              </div>
            </div>

            {recs.length > 0 && (
              <div className="section">
                <div className="section-title">📌 Gör detta nu</div>
                {recs.slice(0, 4).map(r => (
                  <div key={r.id} className="rec-card">
                    <div className="rec-icon">{r.icon}</div>
                    <div>
                      <div className="rec-title">{r.title}</div>
                      <div className="rec-reason">{r.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {stageIdx < stageOrder.length - 1 && (
              <div className="section">
                <button className="btn btn-secondary btn-full" onClick={advanceStage}>
                  Nästa fas: {LIFECYCLE_STAGES.find(s => s.id === stageOrder[stageIdx+1])?.label} →
                </button>
              </div>
            )}
          </>
        )}

        {tab === "tasks" && (
          <div className="section">
            <div className="flex justify-between items-center" style={{marginBottom:12}}>
              <div className="section-title" style={{marginBottom:0}}>Uppgifter</div>
              <button className="btn btn-sm btn-primary" onClick={() => setShowAddTask(true)}>+ Lägg till</button>
            </div>

            {ptasks.length === 0 ? (
              <div className="empty" style={{padding:"24px 0"}}>
                <div className="empty-icon">✅</div>
                <div className="empty-title">Inga uppgifter</div>
                <div className="empty-desc">Lägg till uppgifter för att hålla koll på vad du ska göra.</div>
              </div>
            ) : (
              <>
                {ptasks.filter(t => t.status !== "done").map(t => (
                  <div key={t.id} className="task-item" onClick={() => onUpdateTask({...t, status:"done", completedAt: new Date().toISOString()})}>
                    <div className="task-check"><div style={{width:10,height:10,borderRadius:"50%",background: t.priority==="high"?"var(--danger)":t.priority==="medium"?"var(--warn)":"var(--text3)"}}/></div>
                    <div className="task-title">{t.title}</div>
                    <Icon.ChevronRight />
                  </div>
                ))}
                {ptasks.filter(t => t.status === "done").length > 0 && (
                  <>
                    <div style={{fontSize:11,color:"var(--text3)",margin:"12px 0 6px",fontWeight:600}}>KLARA</div>
                    {ptasks.filter(t => t.status === "done").map(t => (
                      <div key={t.id} className="task-item done" onClick={() => onUpdateTask({...t, status:"todo", completedAt: undefined})}>
                        <div className="task-check checked"><Icon.Check /></div>
                        <div className="task-title done">{t.title}</div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {tab === "notes" && (
          <div className="section">
            <div className="flex justify-between items-center" style={{marginBottom:12}}>
              <div className="section-title" style={{marginBottom:0}}>Anteckningar</div>
              <button className="btn btn-sm btn-primary" onClick={() => onAddNote(project.id)}>+ Ny</button>
            </div>
            {pnotes.length === 0 ? (
              <div className="empty" style={{padding:"24px 0"}}>
                <div className="empty-icon">📝</div>
                <div className="empty-title">Inga anteckningar</div>
                <div className="empty-desc">Dokumentera din research, risker och idéer.</div>
              </div>
            ) : (
              pnotes.map(n => {
                const nt = NOTE_TYPES.find(x => x.id === n.type);
                return (
                  <div key={n.id} className="note-item" onClick={() => onOpenNote(n.id)}>
                    <div className="flex items-center gap-8">
                      <span>{nt?.icon}</span>
                      <div className="note-title">{n.title}</div>
                    </div>
                    <div className="note-preview">{n.content}</div>
                    <div className="note-meta">{nt?.label} · {new Date(n.createdAt).toLocaleDateString("sv-SE")}</div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "dropshipping" && (
          <DropshippingTab project={project} product={product} onOpenProduct={onOpenProduct} />
        )}
      </div>

      {showAddTask && (
        <div className="overlay" onClick={() => setShowAddTask(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"/>
            <div className="sheet-title">Ny uppgift</div>
            <div className="field">
              <label className="label">Uppgiftens namn</label>
              <input className="input" placeholder="Vad ska göras?" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && addTask()} />
            </div>
            <button className="btn btn-primary btn-full" onClick={addTask}>Spara uppgift</button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="overlay" onClick={() => setConfirmDelete(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"/>
            <div className="sheet-title">Alternativ</div>
            <button className="btn btn-danger btn-full" style={{marginBottom:8}} onClick={() => { onDeleteProject(project.id); setConfirmDelete(false); }}>🗑️ Ta bort projekt</button>
            <button className="btn btn-secondary btn-full" onClick={() => setConfirmDelete(false)}>Avbryt</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── DROPSHIPPING TAB ─────────────────────────────────────────────────────────
function DropshippingTab({ project, product, onOpenProduct }) {
  if (!product) {
    return (
      <div className="section">
        <div className="empty" style={{padding:"32px 0"}}>
          <div className="empty-icon">🛒</div>
          <div className="empty-title">Ingen produkt ännu</div>
          <div className="empty-desc">Lägg till din produkt och räkna ut om den är lönsam.</div>
          <button className="btn btn-primary" onClick={() => onOpenProduct(null, project.id)}>+ Lägg till produkt</button>
        </div>
      </div>
    );
  }

  const calc = calcProfit(product);
  const marginColor = calc.margin < 20 ? "var(--danger)" : calc.margin < 35 ? "var(--warn)" : "var(--success)";

  return (
    <div className="section">
      <div className="card" style={{cursor:"pointer"}} onClick={() => onOpenProduct(product.id, project.id)}>
        <div className="flex justify-between items-center">
          <div>
            <div style={{fontSize:16,fontWeight:700}}>{product.name}</div>
            {product.description && <div style={{fontSize:12,color:"var(--text2)",marginTop:2}}>{product.description}</div>}
          </div>
          <Icon.ChevronRight />
        </div>

        <div style={{marginTop:16,textAlign:"center",padding:"12px 0",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)"}}>
          <div style={{fontSize:40,fontWeight:800,color:marginColor}}>{calc.margin.toFixed(0)}%</div>
          <div style={{fontSize:12,color:"var(--text2)",marginTop:2}}>Marginal</div>
        </div>

        <div style={{marginTop:12}}>
          <div className="calc-row"><span className="calc-label">Försäljningspris</span><span className="calc-value text-accent">{formatKr(calc.revenue)}</span></div>
          <div className="calc-row"><span className="calc-label">Totala kostnader</span><span className="calc-value text-danger">− {formatKr(calc.costs)}</span></div>
          <div className="calc-row"><span className="calc-label">Bidrag per försäljning</span><span className="calc-value" style={{color: calc.contribution > 0 ? "var(--success)" : "var(--danger)"}}>{formatKr(calc.contribution)}</span></div>
        </div>

        {calc.margin < 20 && (
          <div style={{marginTop:12,padding:"10px 12px",background:"var(--danger-dim)",borderRadius:8,fontSize:12,color:"var(--danger)"}}>
            ⚠️ Marginalen är under 20% – svårt att tjäna pengar med annonsering.
          </div>
        )}
      </div>
      <button className="btn btn-secondary btn-full mt-8" onClick={() => onOpenProduct(product.id, project.id)}>Redigera produkt & kalkyl</button>
    </div>
  );
}

// ─── PRODUCT EDITOR ───────────────────────────────────────────────────────────
function ProductEditor({ product, projectId, onBack, onSave, onDelete }) {
  const [form, setForm] = useState(product || {
    id: genId(), projectId, name: "", description: "",
    salePrice: 0, purchasePrice: 0, shippingCost: 0, paymentFee: 0, advertisingCost: 0,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setKr = (k, v) => set(k, Math.round(parseFloat(v || 0) * 100));
  const getKr = (k) => form[k] ? (form[k] / 100).toString() : "";

  const calc = calcProfit(form);
  const marginColor = calc.margin < 20 ? "var(--danger)" : calc.margin < 35 ? "var(--warn)" : "var(--success)";

  function save() {
    if (!form.name.trim()) return;
    onSave({ ...form, updatedAt: new Date().toISOString() });
  }

  return (
    <>
      <div className="header">
        <button className="header-back" onClick={onBack}><Icon.Back /> Tillbaka</button>
        <div className="header-title" style={{fontSize:14}}>{product ? "Redigera produkt" : "Ny produkt"}</div>
        <button className="header-action" onClick={save}>Spara</button>
      </div>
      <div className="scroll">
        <div className="section">
          <div className="field">
            <label className="label">Produktnamn</label>
            <input className="input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="T.ex. MagSafe Ställ – Nordic" />
          </div>
          <div className="field">
            <label className="label">Beskrivning</label>
            <textarea className="input textarea" value={form.description || ""} onChange={e => set("description", e.target.value)} placeholder="Kort beskrivning av produkten..." />
          </div>
        </div>

        <div className="section" style={{paddingTop:0}}>
          <div className="section-title">💰 Kalkyl</div>
          <div className="card">
            {[
              ["salePrice", "Försäljningspris (kr)", "Vad kunden betalar"],
              ["purchasePrice", "Inköpspris (kr)", "Vad du betalar leverantören"],
              ["shippingCost", "Fraktkostnad (kr)", "Frakt från leverantör till kund"],
              ["paymentFee", "Betalningsavgift (kr)", "T.ex. Stripe/Klarna-avgift"],
              ["advertisingCost", "Annonseringskostnad (kr)", "Genomsnittlig kostnad per försäljning"],
            ].map(([key, label, hint]) => (
              <div key={key} className="field" style={{marginBottom:12}}>
                <label className="label">{label}</label>
                <div style={{fontSize:11,color:"var(--text3)",marginBottom:4}}>{hint}</div>
                <input className="input" type="number" min="0" step="0.01" value={getKr(key)} onChange={e => setKr(key, e.target.value)} placeholder="0" />
              </div>
            ))}
          </div>
        </div>

        {/* Live calculation */}
        <div className="section" style={{paddingTop:0}}>
          <div className="section-title">📊 Resultat</div>
          <div className="card">
            <div style={{textAlign:"center",padding:"16px 0 12px",borderBottom:"1px solid var(--border)"}}>
              <div style={{fontSize:44,fontWeight:800,color:marginColor}}>{calc.margin.toFixed(1)}%</div>
              <div style={{fontSize:12,color:"var(--text2)",marginTop:2}}>Marginal</div>
            </div>
            <div style={{marginTop:10}}>
              <div className="calc-row"><span className="calc-label">Inköpspris</span><span className="calc-value">− {formatKr(form.purchasePrice||0)}</span></div>
              <div className="calc-row"><span className="calc-label">Frakt</span><span className="calc-value">− {formatKr(form.shippingCost||0)}</span></div>
              <div className="calc-row"><span className="calc-label">Betalningsavgift</span><span className="calc-value">− {formatKr(form.paymentFee||0)}</span></div>
              <div className="calc-row"><span className="calc-label">Annonsering</span><span className="calc-value">− {formatKr(form.advertisingCost||0)}</span></div>
              <div className="divider" style={{margin:"8px 0"}}/>
              <div className="calc-row"><span className="calc-label" style={{fontWeight:700}}>Totala kostnader</span><span className="calc-total text-danger">− {formatKr(calc.costs)}</span></div>
              <div className="calc-row"><span className="calc-label" style={{fontWeight:700}}>Försäljningspris</span><span className="calc-total text-accent">{formatKr(calc.revenue)}</span></div>
              <div className="divider" style={{margin:"8px 0"}}/>
              <div className="calc-row"><span className="calc-label" style={{fontWeight:700,fontSize:15}}>Bidrag per såld</span><span className="calc-total" style={{fontSize:18,color: calc.contribution > 0 ? "var(--success)" : "var(--danger)"}}>{formatKr(calc.contribution)}</span></div>
            </div>

            {calc.margin < 20 && calc.margin !== 0 && (
              <div style={{marginTop:12,padding:"10px 12px",background:"var(--danger-dim)",borderRadius:8,fontSize:12,color:"var(--danger)",lineHeight:1.4}}>
                ⚠️ <strong>Marginalen är för låg.</strong> Under 20% blir det svårt att gå med vinst när du räknar in annonsering, returer och andra kostnader.
              </div>
            )}
            {calc.margin >= 40 && (
              <div style={{marginTop:12,padding:"10px 12px",background:"var(--success-dim)",borderRadius:8,fontSize:12,color:"var(--success)",lineHeight:1.4}}>
                🚀 <strong>Bra marginal!</strong> Du har gott om utrymme för annonsering och oväntade kostnader.
              </div>
            )}
          </div>
        </div>

        {product && (
          <div className="section" style={{paddingTop:0}}>
            <button className="btn btn-danger btn-full" onClick={() => { onDelete(product.id); onBack(); }}>🗑️ Ta bort produkt</button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── NOTES LIST ───────────────────────────────────────────────────────────────
function NotesList({ notes, projects, onOpen, onNew }) {
  return (
    <div className="scroll">
      <div className="section">
        {notes.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📝</div>
            <div className="empty-title">Inga anteckningar</div>
            <div className="empty-desc">Dokumentera din research, risker och idéer här.</div>
            <button className="btn btn-primary" onClick={() => onNew(null)}>+ Ny anteckning</button>
          </div>
        ) : (
          notes.map(n => {
            const nt = NOTE_TYPES.find(x => x.id === n.type);
            const proj = projects.find(p => p.id === n.projectId);
            return (
              <div key={n.id} className="note-item" style={{marginBottom:8}} onClick={() => onOpen(n.id)}>
                <div className="flex items-center gap-8">
                  <span>{nt?.icon}</span>
                  <div className="note-title">{n.title}</div>
                </div>
                {proj && <div style={{fontSize:11,color:"var(--primary-light)",marginTop:3}}>📂 {proj.name}</div>}
                <div className="note-preview">{n.content}</div>
                <div className="flex items-center gap-8 mt-4">
                  <span className="badge badge-neutral">{nt?.label}</span>
                  <span className="text-xs text-muted">{new Date(n.createdAt).toLocaleDateString("sv-SE")}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── NOTE EDITOR ──────────────────────────────────────────────────────────────
function NoteEditor({ note, projects, defaultProjectId, onBack, onSave, onDelete }) {
  const [form, setForm] = useState(note || {
    id: genId(), title: "", type: "note", content: "", url: "", tags: [],
    projectId: defaultProjectId || null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function save() {
    if (!form.title.trim()) return;
    onSave({ ...form, updatedAt: new Date().toISOString() });
  }

  return (
    <>
      <div className="header">
        <button className="header-back" onClick={onBack}><Icon.Back /> Tillbaka</button>
        <div className="header-title" style={{fontSize:14}}>{note ? "Redigera" : "Ny anteckning"}</div>
        <button className="header-action" onClick={save}>Spara</button>
      </div>
      <div className="scroll">
        <div className="section">
          <div className="field">
            <label className="label">Rubrik</label>
            <input className="input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="Vad handlar anteckningen om?" autoFocus />
          </div>
          <div className="field">
            <label className="label">Typ</label>
            <select className="input select" value={form.type} onChange={e => set("type", e.target.value)}>
              {NOTE_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Projekt (valfritt)</label>
            <select className="input select" value={form.projectId || ""} onChange={e => set("projectId", e.target.value || null)}>
              <option value="">— Inget projekt —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Innehåll</label>
            <textarea className="input textarea" style={{minHeight:140}} value={form.content} onChange={e => set("content", e.target.value)} placeholder="Skriv din anteckning här..." />
          </div>
          <div className="field">
            <label className="label">URL (valfritt)</label>
            <input className="input" value={form.url || ""} onChange={e => set("url", e.target.value)} placeholder="https://..." />
          </div>
        </div>
        {note && (
          <div className="section" style={{paddingTop:0}}>
            <button className="btn btn-danger btn-full" onClick={() => { onDelete(note.id); onBack(); }}>🗑️ Ta bort anteckning</button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── CALCULATOR (STANDALONE) ──────────────────────────────────────────────────
function Calculator() {
  const [form, setForm] = useState({ salePrice: 0, purchasePrice: 0, shippingCost: 0, paymentFee: 0, advertisingCost: 0 });
  const set = (k, v) => setForm(f => ({ ...f, [k]: Math.round(parseFloat(v || 0) * 100) }));
  const getKr = (k) => form[k] ? (form[k] / 100).toString() : "";
  const calc = calcProfit(form);
  const marginColor = calc.margin < 20 ? "var(--danger)" : calc.margin < 35 ? "var(--warn)" : "var(--success)";

  return (
    <div className="scroll">
      <div className="section">
        <div style={{marginBottom:16}}>
          <div style={{fontSize:22,fontWeight:800}}>Lönsamhetskalkyl</div>
          <div style={{fontSize:13,color:"var(--text2)",marginTop:2}}>Räkna ut om din dropshipping-produkt är lönsam.</div>
        </div>

        <div className="card" style={{marginBottom:12}}>
          {[
            ["salePrice", "💰 Försäljningspris", "Vad kunden betalar"],
            ["purchasePrice", "📦 Inköpspris", "Leverantörspriset"],
            ["shippingCost", "🚚 Frakt", "Frakt till kund"],
            ["paymentFee", "💳 Betalningsavgift", "Klarna, Stripe etc."],
            ["advertisingCost", "📣 Annonser", "Annons per försäljning"],
          ].map(([key, label, hint]) => (
            <div key={key} style={{marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{label}</div>
              <div style={{fontSize:11,color:"var(--text3)",marginBottom:4}}>{hint}</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input className="input" type="number" min="0" step="1" value={getKr(key)} onChange={e => set(key, e.target.value)} placeholder="0" style={{flex:1}} />
                <span style={{color:"var(--text2)",fontSize:14}}>kr</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{background:"var(--surface2)"}}>
          <div style={{textAlign:"center",padding:"12px 0 16px"}}>
            <div style={{fontSize:48,fontWeight:800,color:marginColor,letterSpacing:-2}}>{calc.margin.toFixed(1)}%</div>
            <div style={{fontSize:13,color:"var(--text2)",marginTop:2}}>Marginal</div>
          </div>

          <div className="calc-row"><span className="calc-label">Försäljningspris</span><span className="calc-value text-accent">{formatKr(calc.revenue)}</span></div>
          <div className="calc-row"><span className="calc-label">Totala kostnader</span><span className="calc-value text-danger">− {formatKr(calc.costs)}</span></div>
          <div className="divider" style={{margin:"4px 0"}}/>
          <div className="calc-row"><span className="calc-label calc-total">Bidrag per såld</span><span className="calc-total" style={{color: calc.contribution > 0 ? "var(--success)" : "var(--danger)"}}>{formatKr(calc.contribution)}</span></div>

          <div style={{marginTop:16,padding:"12px",background:"var(--surface3)",borderRadius:8}}>
            <div style={{fontSize:11,color:"var(--text2)",lineHeight:1.5}}>
              {calc.margin < 10 && "🚨 Väldigt låg marginal. Svårt att gå med vinst."}
              {calc.margin >= 10 && calc.margin < 20 && "⚠️ Låg marginal. Knappt lönsamt när man räknar in returer och oväntade kostnader."}
              {calc.margin >= 20 && calc.margin < 35 && "📊 Godkänd marginal men begränsat utrymme för annonsering."}
              {calc.margin >= 35 && calc.margin < 50 && "✅ Bra marginal. Du har utrymme för annonsering och returer."}
              {calc.margin >= 50 && "🚀 Excellent marginal! Du har stor handlingsfrihet."}
              {calc.revenue === 0 && "Fyll i dina siffror ovan för att se resultatet."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NEW PROJECT FORM ─────────────────────────────────────────────────────────
function NewProjectSheet({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", description: "", stage: "idea", businessModel: "dropshipping" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function save() {
    if (!form.name.trim()) return;
    onSave({ ...form, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div className="sheet-title">Nytt projekt</div>
        <div className="field">
          <label className="label">Projektnamn</label>
          <input className="input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="T.ex. NordicCase" autoFocus />
        </div>
        <div className="field">
          <label className="label">Beskrivning (valfritt)</label>
          <textarea className="input textarea" style={{minHeight:70}} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Vad handlar projektet om?" />
        </div>
        <div className="field">
          <label className="label">Affärsmodell</label>
          <select className="input select" value={form.businessModel} onChange={e => set("businessModel", e.target.value)}>
            <option value="dropshipping">🛒 Dropshipping</option>
            <option value="other">📦 Annat</option>
          </select>
        </div>
        <div className="field">
          <label className="label">Nuvarande fas</label>
          <select className="input select" value={form.stage} onChange={e => set("stage", e.target.value)}>
            {LIFECYCLE_STAGES.slice(0,6).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <button className="btn btn-primary btn-full" onClick={save} style={{marginBottom:8}}>Skapa projekt</button>
        <button className="btn btn-secondary btn-full" onClick={onClose}>Avbryt</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useStorage("user", null);
  const [projects, setProjects] = useStorage("projects", []);
  const [tasks, setTasks] = useStorage("tasks", []);
  const [notes, setNotes] = useStorage("notes", []);
  const [products, setProducts] = useStorage("products", []);

  const [tab, setTab] = useState("home");
  const [view, setView] = useState(null); // { type, id, ... }
  const [showNewProject, setShowNewProject] = useState(false);
  const [newNoteProjectId, setNewNoteProjectId] = useState(null);

  // Init demo data
  function handleOnboardDone({ name, level, includeDemo, goDemo }) {
    const u = { name, level };
    setUser(u);
    if (includeDemo) {
      setProjects([DEMO_PROJECT]);
      setTasks(DEMO_TASKS);
      setNotes(DEMO_NOTES);
      setProducts([DEMO_PRODUCT]);
      if (goDemo) {
        setTimeout(() => { setView({ type: "project", id: "demo-001" }); }, 50);
      }
    }
  }

  // Project ops
  function addProject(p) {
    setProjects(ps => [p, ...ps]);
    setShowNewProject(false);
    setView({ type: "project", id: p.id });
  }
  function updateProject(p) { setProjects(ps => ps.map(x => x.id === p.id ? p : x)); }
  function deleteProject(id) { setProjects(ps => ps.filter(x => x.id !== id)); setTasks(ts => ts.filter(t => t.projectId !== id)); setNotes(ns => ns.filter(n => n.projectId !== id)); setProducts(ps => ps.filter(p => p.projectId !== id)); setView(null); }

  // Task ops
  function addTask(t) { setTasks(ts => [...ts, t]); }
  function updateTask(t) { setTasks(ts => ts.map(x => x.id === t.id ? t : x)); }

  // Note ops
  function saveNote(n) {
    setNotes(ns => {
      const exists = ns.find(x => x.id === n.id);
      return exists ? ns.map(x => x.id === n.id ? n : x) : [n, ...ns];
    });
    setView(null);
  }
  function deleteNote(id) { setNotes(ns => ns.filter(x => x.id !== id)); }

  // Product ops
  function saveProduct(p) {
    setProducts(ps => {
      const exists = ps.find(x => x.id === p.id);
      return exists ? ps.map(x => x.id === p.id ? p : x) : [p, ...ps];
    });
    setView(null);
  }
  function deleteProduct(id) { setProducts(ps => ps.filter(x => x.id !== id)); }

  const currentProject = view?.type === "project" ? projects.find(p => p.id === view.id) : null;
  const currentNote = view?.type === "note" ? notes.find(n => n.id === view.id) : null;
  const currentProduct = view?.type === "product" ? products.find(p => p.id === view.id) : null;

  const isInDetail = view !== null;

  if (!user) return (
    <>
      <style>{CSS}</style>
      <div className="app"><Onboarding onDone={handleOnboardDone} /></div>
    </>
  );

  // Render detail views (full screen)
  if (view?.type === "project" && currentProject) {
    return (
      <>
        <style>{CSS}</style>
        <div className="app">
          <ProjectDetail
            project={currentProject}
            tasks={tasks}
            notes={notes}
            products={products}
            onBack={() => setView(null)}
            onUpdateTask={updateTask}
            onAddTask={addTask}
            onAddNote={(pid) => { setView({ type: "note-new", projectId: pid }); }}
            onOpenNote={(id) => setView({ type: "note", id })}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
            onOpenProduct={(id, pid) => setView({ type: "product", id, projectId: pid })}
          />
        </div>
      </>
    );
  }

  if (view?.type === "note" || view?.type === "note-new") {
    return (
      <>
        <style>{CSS}</style>
        <div className="app">
          <NoteEditor
            note={currentNote || null}
            projects={projects}
            defaultProjectId={view.projectId || null}
            onBack={() => setView(null)}
            onSave={saveNote}
            onDelete={deleteNote}
          />
        </div>
      </>
    );
  }

  if (view?.type === "product") {
    return (
      <>
        <style>{CSS}</style>
        <div className="app">
          <ProductEditor
            product={currentProduct || null}
            projectId={view.projectId}
            onBack={() => setView(null)}
            onSave={(p) => { saveProduct(p); setView(null); }}
            onDelete={deleteProduct}
          />
        </div>
      </>
    );
  }

  const navItems = [
    { id: "home", label: "Hem", Icon: Icon.Home },
    { id: "projects", label: "Projekt", Icon: Icon.Projects },
    { id: "notes", label: "Anteckningar", Icon: Icon.Notes },
    { id: "calc", label: "Kalkyl", Icon: Icon.Calc },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* Header */}
        <div className="header">
          <div className="header-title">
            {tab === "home" && "🚀 Sidekick"}
            {tab === "projects" && "Projekt"}
            {tab === "notes" && "Anteckningar"}
            {tab === "calc" && "Kalkylator"}
          </div>
          {tab === "projects" && <button className="header-action" onClick={() => setShowNewProject(true)}>+ Nytt</button>}
          {tab === "notes" && <button className="header-action" onClick={() => setView({ type: "note-new", projectId: null })}>+ Ny</button>}
        </div>

        {/* Content */}
        {tab === "home" && (
          <Dashboard
            user={user}
            projects={projects}
            tasks={tasks}
            notes={notes}
            products={products}
            onNewProject={() => setShowNewProject(true)}
            onOpenProject={id => setView({ type: "project", id })}
          />
        )}
        {tab === "projects" && (
          <ProjectList
            projects={projects}
            tasks={tasks}
            onOpen={id => setView({ type: "project", id })}
            onNew={() => setShowNewProject(true)}
          />
        )}
        {tab === "notes" && (
          <NotesList
            notes={notes}
            projects={projects}
            onOpen={id => setView({ type: "note", id })}
            onNew={pid => setView({ type: "note-new", projectId: pid })}
          />
        )}
        {tab === "calc" && <Calculator />}

        {/* Bottom nav */}
        <nav className="nav">
          {navItems.map(({ id, label, Icon: I }) => (
            <button key={id} className={`nav-item ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
              <I /><span className="nav-label">{label}</span>
            </button>
          ))}
        </nav>

        {showNewProject && (
          <NewProjectSheet onClose={() => setShowNewProject(false)} onSave={addProject} />
        )}
      </div>
    </>
  );
}

