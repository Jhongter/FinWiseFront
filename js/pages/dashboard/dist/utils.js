// utils.js — FinWise Dashboard

// ============================================================
// FORMATAÇÃO
// ============================================================
export function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString("pt-BR");
}

// ============================================================
// ID
// ============================================================
export function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

// ============================================================
// MOBILE
// ============================================================
export function isMobile() {
  return window.innerWidth <= 768;
}

// ============================================================
// CATEGORIAS
// ============================================================
export function getCategoryName(category) {
  const names = {
    alimentacao: "Alimentação",
    moradia: "Moradia",
    transporte: "Transporte",
    lazer: "Lazer",
    saude: "Saúde",
    educacao: "Educação",
    outros: "Outros",
  };
  return names[category] ?? category;
}

export function getCategoryColor(category) {
  const colors = {
    alimentacao: "#f59e0b",
    moradia: "#3b82f6",
    transporte: "#10b981",
    lazer: "#8b5cf6",
    saude: "#ef4444",
    educacao: "#06b6d4",
    outros: "#6b7280",
  };
  return colors[category] ?? "#6b7280";
}

// ============================================================
// INVESTIMENTO — taxas mensais para os tipos do HTML
// ============================================================
export function calculateInvestment(initialAmount, months, type) {
  // Taxa mensal equivalente às taxas anuais exibidas no select
  const rates = {
    selic:    (Math.pow(1 + 0.1015, 1/12) - 1), // 10,15% a.a.
    cdb:      (Math.pow(1 + 0.12,   1/12) - 1), // 12% a.a.
    lci:      (Math.pow(1 + 0.085,  1/12) - 1), // 8,5% a.a.
    tesouro:  (Math.pow(1 + 0.1055, 1/12) - 1), // IPCA+5,5% (~10,55% a.a. estimado)
    // Legados (caso existam dados antigos)
    poupanca: 0.005,
  };

  const monthlyRate = rates[type] ?? rates.selic;
  const finalAmount = initialAmount * Math.pow(1 + monthlyRate, months);

  return {
    finalAmount,
    earnings: finalAmount - initialAmount,
  };
}

// ============================================================
// AGRUPAMENTO POR MÊS
// ============================================================
export function groupTransactionsByMonth(transactions) {
  const grouped = {};
  for (const transaction of transactions) {
    const date = new Date(transaction.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(transaction);
  }
  return grouped;
}

// ============================================================
// PROCESSAMENTO DOS GRÁFICOS
// ============================================================
export function processChartData(transactions) {
  const grouped = groupTransactionsByMonth(transactions);
  const labels = [];
  const income = [];
  const expenses = [];
  const balance = [];

  for (const [month, items] of Object.entries(grouped).sort()) {
    let totalIncome = 0;
    let totalExpenses = 0;
    for (const transaction of items) {
      if (transaction.type === "income") {
        totalIncome += Number(transaction.amount);
      } else {
        totalExpenses += Number(transaction.amount);
      }
    }
    // Formata o label do mês (ex: "2025-05" → "Mai/25")
    const [year, m] = month.split("-");
    const d = new Date(Number(year), Number(m) - 1);
    labels.push(d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }));
    income.push(totalIncome);
    expenses.push(totalExpenses);
    balance.push(totalIncome - totalExpenses);
  }

  return { labels, income, expenses, balance };
}