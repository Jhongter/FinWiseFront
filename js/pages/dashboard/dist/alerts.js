// ============================================================
// src/alerts.ts — Sistema de alertas inteligentes tipado
// ============================================================
import { generateId, getCategoryName, formatCurrency } from "./utils.js";
// ---- Geração de alertas a partir dos dados ----
export function generateAlerts(transactions, goals, settings, balance) {
    const alerts = [];
    const now = new Date().toISOString();
    // 1. Alerta de saldo mínimo
    if (settings.minimumBalance > 0 && balance < settings.minimumBalance) {
        alerts.push({
            id: generateId(),
            type: "saldo",
            severity: balance < 0 ? "danger" : "warning",
            title: balance < 0 ? "Saldo negativo!" : "Saldo abaixo do mínimo",
            message: balance < 0
                ? `Seu saldo está negativo em ${formatCurrency(Math.abs(balance))}. Revise seus gastos.`
                : `Seu saldo está abaixo de ${formatCurrency(settings.minimumBalance)}.`,
            read: false,
            createdAt: now,
        });
    }
    // 2. Alertas de limite de categoria
    const currentMonth = new Date();
    const monthTransactions = transactions.filter((t) => {
        const date = new Date(t.date);
        return (t.type === "expense" &&
            date.getMonth() === currentMonth.getMonth() &&
            date.getFullYear() === currentMonth.getFullYear());
    });
    const categoryTotals = {};
    for (const t of monthTransactions) {
        categoryTotals[t.category] = (categoryTotals[t.category] ?? 0) + t.amount;
    }
    for (const limit of settings.categoryLimits) {
        const spent = categoryTotals[limit.category] ?? 0;
        const percentage = limit.limitAmount > 0 ? (spent / limit.limitAmount) * 100 : 0;
        if (percentage >= 100) {
            alerts.push({
                id: generateId(),
                type: "categoria",
                severity: "danger",
                title: `Limite de ${getCategoryName(limit.category)} excedido`,
                message: `Você gastou ${formatCurrency(spent)} em ${getCategoryName(limit.category)} este mês. O limite era ${formatCurrency(limit.limitAmount)}.`,
                read: false,
                createdAt: now,
                relatedId: limit.category,
            });
        }
        else if (percentage >= 80) {
            alerts.push({
                id: generateId(),
                type: "categoria",
                severity: "warning",
                title: `${getCategoryName(limit.category)} próximo do limite`,
                message: `Você já usou ${percentage.toFixed(0)}% do limite de ${getCategoryName(limit.category)} (${formatCurrency(spent)} de ${formatCurrency(limit.limitAmount)}).`,
                read: false,
                createdAt: now,
                relatedId: limit.category,
            });
        }
    }
    // 3. Alertas de metas
    for (const goal of goals) {
        if (goal.status !== "em_andamento")
            continue;
        const progress = goal.targetAmount > 0
            ? (goal.currentAmount / goal.targetAmount) * 100
            : 0;
        // Meta concluída
        if (progress >= 100) {
            alerts.push({
                id: generateId(),
                type: "meta",
                severity: "info",
                title: `🎉 Meta "${goal.title}" concluída!`,
                message: `Parabéns! Você atingiu seu objetivo de ${formatCurrency(goal.targetAmount)}.`,
                read: false,
                createdAt: now,
                relatedId: goal.id,
            });
        }
        // Meta com prazo próximo (dentro de 7 dias)
        if (goal.deadline) {
            const deadline = new Date(goal.deadline);
            const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysLeft > 0 && daysLeft <= 7 && progress < 100) {
                alerts.push({
                    id: generateId(),
                    type: "meta",
                    severity: "warning",
                    title: `Prazo da meta "${goal.title}" se aproximando`,
                    message: `Faltam ${daysLeft} dia${daysLeft > 1 ? "s" : ""} para o prazo. Você está em ${progress.toFixed(0)}% do objetivo.`,
                    read: false,
                    createdAt: now,
                    relatedId: goal.id,
                });
            }
            // Meta vencida
            if (daysLeft <= 0 && progress < 100) {
                alerts.push({
                    id: generateId(),
                    type: "meta",
                    severity: "danger",
                    title: `Prazo da meta "${goal.title}" expirou`,
                    message: `O prazo passou e você está em ${progress.toFixed(0)}% do objetivo de ${formatCurrency(goal.targetAmount)}.`,
                    read: false,
                    createdAt: now,
                    relatedId: goal.id,
                });
            }
        }
    }
    return alerts;
}
// ---- Ícone e cor por severidade ----
export function getAlertIcon(severity) {
    const icons = {
        info: "fa-circle-check",
        warning: "fa-triangle-exclamation",
        danger: "fa-circle-xmark",
    };
    return icons[severity];
}
export function getAlertColor(severity) {
    const colors = {
        info: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
    };
    return colors[severity];
}
export function getAlertTypeLabel(type) {
    const labels = {
        categoria: "Categoria",
        saldo: "Saldo",
        meta: "Meta",
        despesa: "Despesa",
    };
    return labels[type];
}
// ---- Renderização de alertas no DOM ----
export function renderAlerts(alerts, containerId) {
    const container = document.getElementById(containerId);
    if (!container)
        return;
    container.innerHTML = "";
    if (!alerts.length) {
        container.innerHTML = `
      <div class="alerts-empty">
        <i class="fas fa-check-circle"></i>
        <span>Nenhum alerta no momento. Suas finanças estão em dia!</span>
      </div>
    `;
        return;
    }
    const unread = alerts.filter((a) => !a.read);
    const badge = document.getElementById("alerts-badge");
    if (badge) {
        badge.textContent = String(unread.length);
        badge.style.display = unread.length > 0 ? "flex" : "none";
    }
    for (const alert of alerts) {
        const el = document.createElement("div");
        el.className = `alert-item alert-${alert.severity} ${alert.read ? "read" : ""}`;
        el.dataset.id = alert.id;
        el.innerHTML = `
      <div class="alert-icon-wrap">
        <i class="fas ${getAlertIcon(alert.severity)}"></i>
      </div>
      <div class="alert-body">
        <strong class="alert-title">${alert.title}</strong>
        <p class="alert-msg">${alert.message}</p>
      </div>
      <button class="alert-dismiss" data-id="${alert.id}" title="Dispensar">
        <i class="fas fa-xmark"></i>
      </button>
    `;
        container.appendChild(el);
    }
}
// ---- Toast de alerta temporário ----
export function showToast(message, type = "info") {
    // Remove toasts existentes
    document.querySelectorAll(".fw-toast").forEach((el) => el.remove());
    const icons = {
        success: "fa-circle-check",
        error: "fa-circle-xmark",
        warning: "fa-triangle-exclamation",
        info: "fa-circle-info",
    };
    const toast = document.createElement("div");
    toast.className = `fw-toast fw-toast--${type}`;
    toast.innerHTML = `
    <i class="fas ${icons[type]}"></i>
    <span>${message}</span>
  `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 350);
    }, 3500);
}
// ---- Modal de confirmação ----
export function showConfirmModal(title, message, onConfirm) {
    document.querySelectorAll(".fw-confirm-modal").forEach((el) => el.remove());
    const modal = document.createElement("div");
    modal.className = "fw-confirm-modal";
    modal.innerHTML = `
    <div class="fw-confirm-box">
      <div class="fw-confirm-icon">
        <i class="fas fa-triangle-exclamation"></i>
      </div>
      <h4 class="fw-confirm-title">${title}</h4>
      <p class="fw-confirm-msg">${message}</p>
      <div class="fw-confirm-actions">
        <button class="fw-btn fw-btn--ghost fw-cancel-btn">Cancelar</button>
        <button class="fw-btn fw-btn--danger fw-confirm-btn">
          <i class="fas fa-trash"></i> Confirmar
        </button>
      </div>
    </div>
  `;
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add("show"));
    const close = () => {
        modal.classList.remove("show");
        setTimeout(() => modal.remove(), 300);
    };
    modal.querySelector(".fw-cancel-btn")?.addEventListener("click", close);
    modal.querySelector(".fw-confirm-btn")?.addEventListener("click", async () => {
        close();
        await onConfirm();
    });
    modal.addEventListener("click", (e) => {
        if (e.target === modal)
            close();
    });
}
