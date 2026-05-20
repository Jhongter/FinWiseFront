// api.js — FinWise v2 | https://finwiseback.onrender.com
const API = "https://finwiseback.onrender.com";

function getToken() { return localStorage.getItem("finwise_jwt"); }

function headers() {
  const t = getToken();
  return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

async function call(method, path, body) {
  const opts = { method, headers: headers() };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  if (res.status === 401) {
    localStorage.removeItem("finwise_jwt");
    localStorage.removeItem("finwise_user_email");
    window.location.href = "/pages/login/login.html";
    throw new Error("Sessão expirada.");
  }
  if (res.status === 204) return null;
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try { const d = await res.json(); msg = d.message || d.error || msg; } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchSummary() {
  const data = await call("GET", "/transacoes/resumo");
  const s = data.summary;
  return {
    salary:     Number(s.salary)   || 0,
    income:     Number(s.income)   || 0,
    expenses:   Number(s.expenses) || 0,
    balance:    Number(s.balance)  || 0,
    categories: s.categories       || {},
  };
}
export async function getSalary()           { return (await fetchSummary()).salary; }
export async function updateSalary(v)       { await call("POST", "/salario", { amount: Number(v) }); return true; }
export async function fetchTransactions()   { const d = await call("GET", "/transacoes"); return d.transactions ?? []; }
export async function createTransaction(t) {
  return call("POST", "/transacoes", {
    description: t.description, amount: Number(t.amount),
    type: t.type, category: t.category, date: t.date,
  });
}
export async function deleteTransaction(id) { await call("DELETE", `/transacoes/${id}`); }
export async function fetchGoals()          { return call("GET", "/metas"); }
export async function createGoal(g) {
  return call("POST", "/metas", {
    title: g.title, description: g.description || null,
    targetAmount: Number(g.targetAmount), currentAmount: Number(g.currentAmount) || 0,
    deadline: g.deadline || null, emoji: g.emoji || "🎯", color: g.color || "#10b981",
  });
}
export async function updateGoalAmount(id, amt) { return call("PATCH", `/metas/${id}/valor`, { amount: Number(amt) }); }
export async function updateGoalStatus(id, st)  { return call("PATCH", `/metas/${id}/status`, { status: st }); }
export async function deleteGoal(id)            { await call("DELETE", `/metas/${id}`); }
export function logoutBackend() {
  localStorage.removeItem("finwise_jwt");
  localStorage.removeItem("finwise_user_email");
}
