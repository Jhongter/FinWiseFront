// reports.ts
import { formatCurrency, groupTransactionsByMonth } from "./utils.js";
// ============================================================
// GERAÇÃO DOS RELATÓRIOS MENSAIS
// ============================================================
export function generateMonthlyReports(transactions) {
    const grouped = groupTransactionsByMonth(transactions);
    const reports = [];
    for (const [month, items] of Object.entries(grouped)) {
        let income = 0;
        let expenses = 0;
        for (const transaction of items) {
            if (transaction.type === "income") {
                income += transaction.amount;
            }
            else {
                expenses += transaction.amount;
            }
        }
        reports.push({
            month,
            income,
            expenses,
            balance: income - expenses,
            count: items.length,
        });
    }
    return reports.sort((a, b) => b.month.localeCompare(a.month));
}
// ============================================================
// RENDERIZAÇÃO DOS RELATÓRIOS
// ============================================================
export function renderMonthlyReports(transactions, containerId) {
    const container = document.getElementById(containerId);
    if (!container)
        return;
    const reports = generateMonthlyReports(transactions);
    container.innerHTML = "";
    if (!reports.length) {
        container.innerHTML = `
      <div class="empty-report">
        <i class="fas fa-chart-column"></i>
        <p>Nenhum relatório disponível.</p>
      </div>
    `;
        return;
    }
    for (const report of reports) {
        const card = document.createElement("div");
        card.className = "monthly-report-card";
        card.innerHTML = `
      <div class="report-header">
        <h3>${formatMonth(report.month)}</h3>
      </div>

      <div class="report-body">

        <div class="report-item">
          <span class="label">Receitas</span>
          <span class="value positive">
            ${formatCurrency(report.income)}
          </span>
        </div>

        <div class="report-item">
          <span class="label">Despesas</span>
          <span class="value negative">
            ${formatCurrency(report.expenses)}
          </span>
        </div>

        <div class="report-item">
          <span class="label">Saldo</span>
          <span class="value ${report.balance >= 0 ? "positive" : "negative"}">
            ${formatCurrency(report.balance)}
          </span>
        </div>

        <div class="report-item">
          <span class="label">Transações</span>
          <span class="value">
           ${report.count}
          </span>
        </div>

      </div>
    `;
        container.appendChild(card);
    }
}
// ============================================================
// FORMATADOR DE MÊS
// ============================================================
function formatMonth(month) {
    const [year, m] = month.split("-");
    const date = new Date(Number(year), Number(m) - 1);
    return date.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
    });
}
