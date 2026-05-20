// dashboard.js — FinWise v2 | Sem Firebase
import { initChatbot } from "./chatbot.js";
import { formatCurrency, calculateInvestment, isMobile } from "./utils.js";
import { fetchSummary, fetchTransactions, fetchGoals, updateSalary, createTransaction, deleteTransaction } from "./api.js";
import { updateExpensesChart, updateEvolutionChart, resizeCharts } from "./charts.js";
import { generateAlerts, renderAlerts, showToast, showConfirmModal } from "./alerts.js";
import { renderGoals, openGoalModal, setupGoalCardEvents } from "./goals.js";
import { renderMonthlyReports } from "./reports.js";
import { initImportarExtrato } from "./importar-extrato.js";

const state = { transactions: [], goals: [], settings: { minimumBalance: 500, categoryLimits: [], alertsEnabled: true }, alerts: [] };

document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("finwise_jwt")) {
    window.location.href = "/pages/login/login.html";
    return;
  }

  const email = localStorage.getItem("finwise_user_email") || "";
  const el = document.getElementById("username-display");
  if (el) el.textContent = email.split("@")[0] || "Usuário";

  const dateInput = document.getElementById("transaction-date");
  if (dateInput) dateInput.valueAsDate = new Date();

  setupDarkMode();
  setupMobileViewport();
  setupAlertsPanel();
  setupEventListeners();
  setupLogoutModal();
  initImportarExtrato();
  loadAllData();
  initChatbot();
});

function setupDarkMode() {
  const toggle = document.getElementById("darkModeToggle");
  if (!toggle) return;
  const saved = localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(saved);
  toggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next); localStorage.setItem("theme", next);
  });
}
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  const d = document.querySelector(".dark-mode-icon");
  const l = document.querySelector(".light-mode-icon");
  if (d) d.style.display = t === "dark" ? "none" : "inline";
  if (l) l.style.display = t === "dark" ? "inline" : "none";
}

function setupAlertsPanel() {
  const panel = document.getElementById("alerts-panel");
  const overlay = document.getElementById("alerts-overlay");
  const open  = () => { panel?.classList.add("open");    overlay?.classList.add("show"); };
  const close = () => { panel?.classList.remove("open"); overlay?.classList.remove("show"); };
  document.getElementById("alerts-toggle-btn")?.addEventListener("click", open);
  document.getElementById("alerts-close-btn")?.addEventListener("click", close);
  overlay?.addEventListener("click", close);
  document.getElementById("alerts-list")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".alert-dismiss");
    if (!btn) return;
    btn.closest(".alert-item")?.remove();
    const n = document.querySelectorAll(".alert-item:not(.read)").length;
    const badge = document.getElementById("alerts-badge");
    if (badge) { badge.textContent = String(n); badge.style.display = n > 0 ? "flex" : "none"; }
  });
}

function setupMobileViewport() {
  document.addEventListener("touchstart", () => {}, { passive: true });
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp && /Android|iPhone|iPad/i.test(navigator.userAgent))
    vp.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no");
}

async function loadAllData() {
  try {
    showLoadingState(true);
    const [summary, transactions, goals] = await Promise.all([
      fetchSummary(), fetchTransactions(), fetchGoals().catch(() => []),
    ]);
    state.transactions = transactions; state.goals = goals;
    updateFinancialSummary(summary);
    updateExpensesChart(summary.categories);
    updateEvolutionChart(transactions);
    renderTransactionList(transactions);
    renderGoals(goals, "goals-list");
    setupGoalCardEvents("goals-list", goals, loadAllData);
    if (state.settings.alertsEnabled) {
      state.alerts = generateAlerts(transactions, goals, state.settings, summary.balance);
      renderAlerts(state.alerts, "alerts-list");
    }
    renderMonthlyReports(transactions, "monthly-report-container");
    const si = document.getElementById("salary-input");
    if (si) si.value = String(summary.salary);
  } catch (err) {
    console.error(err);
    showToast("Não foi possível carregar seus dados.", "error");
  } finally { showLoadingState(false); }
}

function showLoadingState(on) {
  const s = document.getElementById("global-spinner");
  if (s) s.style.display = on ? "flex" : "none";
}

function updateFinancialSummary(s) {
  setText("current-salary",  formatCurrency(s.salary));
  setText("total-income",    formatCurrency(s.income));
  setText("total-expenses",  formatCurrency(s.expenses));
  setText("balance-amount",  formatCurrency(s.balance));
  const el = document.getElementById("balance-status");
  if (el) {
    el.textContent = s.balance > 0 ? "Positivo" : s.balance < 0 ? "Negativo" : "Neutro";
    el.className   = `badge badge--${s.balance > 0 ? "positive" : s.balance < 0 ? "negative" : "neutral"}`;
  }
}
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

function renderTransactionList(transactions) {
  const list = document.getElementById("transaction-list");
  if (!list) return;
  list.innerHTML = "";
  if (!transactions.length) {
    list.innerHTML = `<li class="empty-list-msg"><i class="fas fa-receipt"></i><span>Nenhuma transação ainda.</span></li>`;
    updateEvolutionChart([]); return;
  }
  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  (isMobile() ? sorted.slice(0, 10) : sorted).forEach(t => list.appendChild(mkItem(t)));
  if (isMobile() && sorted.length > 10) {
    const m = document.createElement("li");
    m.className = "more-transactions-msg";
    m.innerHTML = `<i class="fas fa-ellipsis-h"></i><span>+${sorted.length - 10} transações</span>`;
    list.appendChild(m);
  }
}
function mkItem(t) {
  const ICONS  = { alimentacao:"fa-utensils",moradia:"fa-house",transporte:"fa-car",lazer:"fa-gamepad",saude:"fa-heartbeat",educacao:"fa-graduation-cap",outros:"fa-shapes" };
  const LABELS = { alimentacao:"Alimentação",moradia:"Moradia",transporte:"Transporte",lazer:"Lazer",saude:"Saúde",educacao:"Educação",outros:"Outros" };
  const li = document.createElement("li");
  li.className = `transaction-item transaction-item--${t.type}`;
  li.innerHTML = `
    <div class="t-icon t-icon--${t.type}"><i class="fas ${ICONS[t.category]??"fa-circle"}"></i></div>
    <div class="t-info">
      <span class="t-desc">${t.description}</span>
      <span class="t-meta"><span class="t-category">${LABELS[t.category]??t.category}</span><span class="t-date">${new Date(t.date).toLocaleDateString("pt-BR")}</span></span>
    </div>
    <div class="t-right">
      <span class="t-amount t-amount--${t.type}">${t.type==="expense"?"-":"+"} ${formatCurrency(t.amount)}</span>
      <button class="t-delete-btn" data-id="${t.id}" title="Excluir"><i class="fas fa-trash-can"></i></button>
    </div>`;
  return li;
}

function setupEventListeners() {
  document.getElementById("salary-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = Number(document.getElementById("salary-input").value);
    if (!v || v <= 0) { showToast("Digite um valor válido.", "error"); return; }
    try { await updateSalary(v); showToast("Salário atualizado!", "success"); loadAllData(); }
    catch { showToast("Erro ao atualizar salário.", "error"); }
  });

  document.getElementById("transaction-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const type = document.getElementById("transaction-type").value;
    const description = document.getElementById("transaction-desc").value.trim();
    const amount = Number(document.getElementById("transaction-amount").value);
    const category = document.getElementById("transaction-category").value;
    const date = document.getElementById("transaction-date").value;
    if (!description || !amount || amount <= 0 || !date) { showToast("Preencha todos os campos.", "error"); return; }
    try {
      await createTransaction({ type, description, amount, category, date });
      showToast("Transação adicionada!", "success");
      e.target.reset();
      document.getElementById("transaction-date").valueAsDate = new Date();
      loadAllData();
    } catch { showToast("Erro ao adicionar transação.", "error"); }
  });

  document.getElementById("transaction-list")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".t-delete-btn");
    if (!btn) return;
    showConfirmModal("Excluir transação?", "Esta ação não pode ser desfeita.", async () => {
      try { await deleteTransaction(btn.dataset.id); showToast("Excluída.", "info"); loadAllData(); }
      catch { showToast("Erro ao excluir.", "error"); }
    });
  });

  document.getElementById("investment-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const r = calculateInvestment(
      parseFloat(document.getElementById("initial-amount").value),
      parseInt(document.getElementById("investment-months").value),
      document.getElementById("investment-type").value
    );
    setText("final-amount",    formatCurrency(r.finalAmount));
    setText("earnings-amount", formatCurrency(r.earnings));
  });

  document.getElementById("new-goal-btn")?.addEventListener("click", () => openGoalModal(loadAllData));
  window.addEventListener("resize", resizeCharts);
}

function setupLogoutModal() {
  function doLogout() {
    localStorage.removeItem("finwise_jwt");
    localStorage.removeItem("finwise_user_email");
    window.location.href = "/pages/login/login.html";
  }
  document.getElementById("logout-btn")?.addEventListener("click", () =>
    document.getElementById("survey-modal")?.classList.add("active")
  );
  document.getElementById("survey-yes-btn")?.addEventListener("click", () => {
    window.open("https://docs.google.com/forms/d/e/1FAIpQLScvMX0fHIezz_xwne5lfynoX1-7XwjkWiYQa50jR_vmqgdtrw/viewform", "_blank");
    doLogout();
  });
  document.getElementById("survey-no-btn")?.addEventListener("click", doLogout);
}
