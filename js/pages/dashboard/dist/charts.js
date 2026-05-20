// ============================================================
// src/charts.ts — Gráficos tipados com Chart
// ============================================================
import { processChartData, getCategoryName, getCategoryColor, isMobile } from "./utils.js";
const charts = {
    evolution: null,
    expenses: null,
};
// ---- Utilitário: mensagem no canvas ----
function showChartMessage(ctx, message) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = "14px 'DM Sans', sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(message, ctx.canvas.width / 2, ctx.canvas.height / 2);
}
function getCanvas(id) {
    const canvas = document.getElementById(id);
    return canvas?.getContext("2d") ?? null;
}
// ---- Gráfico de despesas (donut) ----
export function updateExpensesChart(categories) {
    const ctx = getCanvas("expenses-chart");
    if (!ctx)
        return;
    const hasData = categories &&
        Object.keys(categories).length > 0 &&
        Object.values(categories).some((v) => (v ?? 0) > 0);
    if (charts.expenses) {
        charts.expenses.destroy();
        charts.expenses = null;
    }
    if (!hasData) {
        showChartMessage(ctx, "Adicione despesas para ver o gráfico");
        return;
    }
    const labels = Object.keys(categories).map((category) => getCategoryName(category));
    const data = Object.values(categories).map((v) => v ?? 0);
    const colors = Object.keys(categories).map(getCategoryColor);
    charts.expenses = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: colors,
                    borderWidth: isMobile() ? 1 : 2,
                    borderColor: "transparent",
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: isMobile() ? "bottom" : "right",
                    labels: {
                        padding: 16,
                        boxWidth: 12,
                        font: { size: isMobile() ? 10 : 12, family: "'DM Sans', sans-serif" },
                    },
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const value = ctx.raw;
                            return ` R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
                        },
                    },
                },
            },
            cutout: isMobile() ? "50%" : "62%",
        },
    });
}
// ---- Gráfico de evolução (linha) ----
export function updateEvolutionChart(transactions) {
    const ctx = getCanvas("evolution-chart");
    if (!ctx)
        return;
    if (charts.evolution) {
        charts.evolution.destroy();
        charts.evolution = null;
    }
    const chartData = processChartData(transactions);
    const hasData = chartData.labels.length > 0 &&
        chartData.income.some((v) => v > 0) || chartData.expenses.some((v) => v > 0);
    if (!hasData) {
        showChartMessage(ctx, "Adicione transações para ver o gráfico");
        return;
    }
    const mobile = isMobile();
    charts.evolution = new Chart(ctx, {
        type: "line",
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: "Receita",
                    data: chartData.income,
                    borderColor: "#10b981",
                    backgroundColor: "rgba(16,185,129,0.08)",
                    fill: false,
                    tension: 0.4,
                    borderWidth: mobile ? 2 : 2.5,
                    pointRadius: mobile ? 3 : 4,
                    pointBackgroundColor: "#10b981",
                },
                {
                    label: "Despesa",
                    data: chartData.expenses,
                    borderColor: "#ef4444",
                    backgroundColor: "rgba(239,68,68,0.08)",
                    fill: false,
                    tension: 0.4,
                    borderWidth: mobile ? 2 : 2.5,
                    pointRadius: mobile ? 3 : 4,
                    pointBackgroundColor: "#ef4444",
                },
                {
                    label: "Saldo",
                    data: chartData.balance,
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59,130,246,0.08)",
                    fill: true,
                    tension: 0.4,
                    borderWidth: mobile ? 2 : 2.5,
                    pointRadius: mobile ? 3 : 4,
                    pointBackgroundColor: "#3b82f6",
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: "rgba(0,0,0,0.05)" },
                    ticks: {
                        callback: (value) => mobile && value >= 1000
                            ? `R$${(value / 1000).toFixed(0)}k`
                            : `R$ ${value.toLocaleString("pt-BR")}`,
                        font: { size: mobile ? 10 : 11, family: "'DM Sans', sans-serif" },
                    },
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { size: mobile ? 10 : 11, family: "'DM Sans', sans-serif" },
                    },
                },
            },
            plugins: {
                legend: {
                    labels: {
                        font: { size: mobile ? 10 : 12, family: "'DM Sans', sans-serif" },
                        boxWidth: 10,
                        padding: 16,
                    },
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const value = ctx.raw;
                            return ` ${ctx.dataset.label}: R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
                        },
                    },
                },
            },
        },
    });
}
// ---- Ajuste responsivo ----
export function resizeCharts() {
    if (!isMobile())
        return;
    if (charts.expenses) {
        charts.expenses.options.plugins.legend.position = "bottom";
        charts.expenses.update();
    }
}
