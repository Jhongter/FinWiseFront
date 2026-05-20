// ============================================================
// src/goals.ts — Módulo de metas financeiras tipado
// ============================================================
import { formatCurrency, formatDate } from "./utils.js";
import { showToast, showConfirmModal } from "./alerts.js";
import { createGoal, updateGoalAmount, updateGoalStatus, deleteGoal, } from "./api.js";
// ---- Opções de emoji/cor para metas ----
const GOAL_EMOJIS = ["🏠", "🚗", "✈️", "📚", "💍", "🏥", "🎓", "💻", "📱", "🌟", "💰", "🎯"];
const GOAL_COLORS = [
    "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b",
    "#ef4444", "#06b6d4", "#ec4899", "#84cc16",
];
// ---- Cálculos de meta ----
export function getGoalProgress(goal) {
    if (goal.targetAmount <= 0)
        return 0;
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
}
export function getGoalDaysLeft(goal) {
    if (!goal.deadline)
        return null;
    const deadline = new Date(goal.deadline);
    return Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
export function getGoalStatusLabel(status) {
    const labels = {
        em_andamento: "Em andamento",
        concluida: "Concluída",
        pausada: "Pausada",
    };
    return labels[status];
}
export function getGoalStatusClass(status) {
    const classes = {
        em_andamento: "status--active",
        concluida: "status--done",
        pausada: "status--paused",
    };
    return classes[status];
}
// ---- Renderização de card de meta ----
function renderGoalCard(goal) {
    const progress = getGoalProgress(goal);
    const daysLeft = getGoalDaysLeft(goal);
    const card = document.createElement("div");
    card.className = `goal-card ${goal.status === "concluida" ? "goal-card--done" : ""}`;
    card.dataset.id = goal.id;
    let deadlineHtml = "";
    if (daysLeft !== null) {
        const deadlineClass = daysLeft < 0 ? "deadline--overdue" : daysLeft <= 7 ? "deadline--soon" : "";
        const deadlineText = daysLeft < 0
            ? `Prazo expirado (${formatDate(goal.deadline)})`
            : daysLeft === 0
                ? "Prazo: hoje!"
                : `${daysLeft} dia${daysLeft !== 1 ? "s" : ""} restante${daysLeft !== 1 ? "s" : ""}`;
        deadlineHtml = `<span class="goal-deadline ${deadlineClass}">
      <i class="fas fa-calendar-alt"></i> ${deadlineText}
    </span>`;
    }
    card.innerHTML = `
    <div class="goal-header" style="--goal-color: ${goal.color}">
      <span class="goal-emoji">${goal.emoji}</span>
      <div class="goal-meta">
        <span class="goal-title">${goal.title}</span>
        <span class="goal-status ${getGoalStatusClass(goal.status)}">
          ${getGoalStatusLabel(goal.status)}
        </span>
      </div>
      <div class="goal-actions-menu">
        <button class="goal-menu-btn" title="Opções">
          <i class="fas fa-ellipsis-v"></i>
        </button>
        <div class="goal-dropdown">
          <button class="goal-dropdown-item goal-add-funds" data-id="${goal.id}">
            <i class="fas fa-plus"></i> Adicionar valor
          </button>
          <button class="goal-dropdown-item goal-toggle-status" data-id="${goal.id}" data-status="${goal.status}">
            <i class="fas fa-${goal.status === "pausada" ? "play" : "pause"}"></i>
            ${goal.status === "pausada" ? "Retomar" : "Pausar"}
          </button>
          <button class="goal-dropdown-item goal-dropdown-item--danger goal-delete" data-id="${goal.id}">
            <i class="fas fa-trash"></i> Excluir
          </button>
        </div>
      </div>
    </div>

    <div class="goal-body">
      ${goal.description ? `<p class="goal-description">${goal.description}</p>` : ""}

      <div class="goal-amounts">
        <span class="goal-current">${formatCurrency(goal.currentAmount)}</span>
        <span class="goal-separator">de</span>
        <span class="goal-target">${formatCurrency(goal.targetAmount)}</span>
      </div>

      <div class="goal-progress-bar">
        <div
          class="goal-progress-fill"
          style="width: ${progress}%; background: ${goal.color}"
          role="progressbar"
          aria-valuenow="${progress}"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>

      <div class="goal-footer">
        <span class="goal-percent">${progress.toFixed(0)}%</span>
        ${deadlineHtml}
        <span class="goal-remaining">
          Faltam ${formatCurrency(Math.max(goal.targetAmount - goal.currentAmount, 0))}
        </span>
      </div>
    </div>
  `;
    // Toggle dropdown
    const menuBtn = card.querySelector(".goal-menu-btn");
    const dropdown = card.querySelector(".goal-dropdown");
    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("open");
    });
    document.addEventListener("click", () => dropdown.classList.remove("open"), { once: true });
    return card;
}
// ---- Renderização da lista de metas ----
export function renderGoals(goals, containerId) {
    const container = document.getElementById(containerId);
    if (!container)
        return;
    container.innerHTML = "";
    if (!goals.length) {
        container.innerHTML = `
      <div class="goals-empty">
        <i class="fas fa-bullseye"></i>
        <p>Nenhuma meta criada ainda.</p>
        <p class="goals-empty-sub">Crie sua primeira meta e comece a poupar!</p>
      </div>
    `;
        return;
    }
    // Ordena: em_andamento primeiro, depois pausadas, por fim concluídas
    const sorted = [...goals].sort((a, b) => {
        const order = { em_andamento: 0, pausada: 1, concluida: 2 };
        return order[a.status] - order[b.status];
    });
    for (const goal of sorted) {
        container.appendChild(renderGoalCard(goal));
    }
}
// ---- Modal de criação de meta ----
export function openGoalModal(onSuccess) {
    document.getElementById("goal-modal")?.remove();
    const modal = document.createElement("div");
    modal.id = "goal-modal";
    modal.className = "fw-modal";
    let selectedEmoji = GOAL_EMOJIS[0];
    let selectedColor = GOAL_COLORS[0];
    modal.innerHTML = `
    <div class="fw-modal-box">
      <div class="fw-modal-header">
        <h3><i class="fas fa-bullseye"></i> Nova Meta</h3>
        <button class="fw-modal-close" id="close-goal-modal">
          <i class="fas fa-xmark"></i>
        </button>
      </div>

      <div class="fw-modal-body">
        <!-- Emoji picker -->
        <div class="form-group">
          <label>Ícone da meta</label>
          <div class="emoji-picker">
            ${GOAL_EMOJIS.map((e, i) => `
              <button type="button" class="emoji-btn ${i === 0 ? "selected" : ""}" data-emoji="${e}">${e}</button>
            `).join("")}
          </div>
        </div>

        <!-- Cor -->
        <div class="form-group">
          <label>Cor</label>
          <div class="color-picker">
            ${GOAL_COLORS.map((c, i) => `
              <button type="button" class="color-btn ${i === 0 ? "selected" : ""}"
                data-color="${c}" style="background: ${c}"></button>
            `).join("")}
          </div>
        </div>

        <form id="goal-form">
          <div class="form-group">
            <label for="goal-title">Título <span class="required">*</span></label>
            <input type="text" id="goal-title" placeholder="Ex: Reserva de emergência" required maxlength="60">
          </div>

          <div class="form-group">
            <label for="goal-desc">Descrição (opcional)</label>
            <input type="text" id="goal-desc" placeholder="Ex: 6 meses de despesas guardados">
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label for="goal-target">Valor alvo <span class="required">*</span></label>
              <input type="number" id="goal-target" placeholder="R$ 0,00" min="1" step="0.01" required>
            </div>
            <div class="form-group">
              <label for="goal-current">Já tenho (opcional)</label>
              <input type="number" id="goal-current" placeholder="R$ 0,00" min="0" step="0.01">
            </div>
          </div>

          <div class="form-group">
            <label for="goal-deadline">Prazo (opcional)</label>
            <input type="date" id="goal-deadline">
          </div>

          <div class="fw-modal-footer">
            <button type="button" class="fw-btn fw-btn--ghost" id="cancel-goal-btn">Cancelar</button>
            <button type="submit" class="fw-btn fw-btn--primary">
              <i class="fas fa-plus"></i> Criar meta
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add("show"));
    const close = () => {
        modal.classList.remove("show");
        setTimeout(() => modal.remove(), 300);
    };
    document.getElementById("close-goal-modal")?.addEventListener("click", close);
    document.getElementById("cancel-goal-btn")?.addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal)
        close(); });
    // Emoji picker
    modal.querySelectorAll(".emoji-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            modal.querySelectorAll(".emoji-btn").forEach((b) => b.classList.remove("selected"));
            btn.classList.add("selected");
            selectedEmoji = btn.dataset.emoji ?? GOAL_EMOJIS[0];
        });
    });
    // Color picker
    modal.querySelectorAll(".color-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            modal.querySelectorAll(".color-btn").forEach((b) => b.classList.remove("selected"));
            btn.classList.add("selected");
            selectedColor = btn.dataset.color ?? GOAL_COLORS[0];
        });
    });
    // Submit
    document.getElementById("goal-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("goal-title").value.trim();
        const description = document.getElementById("goal-desc").value.trim();
        const targetAmount = parseFloat(document.getElementById("goal-target").value);
        const currentAmount = parseFloat(document.getElementById("goal-current").value) || 0;
        const deadline = document.getElementById("goal-deadline").value;
        if (!title || isNaN(targetAmount) || targetAmount <= 0) {
            showToast("Preencha os campos obrigatórios corretamente.", "error");
            return;
        }
        const payload = {
            title,
            description: description || undefined,
            targetAmount,
            currentAmount,
            deadline: deadline || undefined,
            emoji: selectedEmoji,
            color: selectedColor,
        };
        try {
            await createGoal(payload);
            close();
            showToast("Meta criada com sucesso!", "success");
            onSuccess();
        }
        catch (err) {
            showToast("Erro ao criar meta. Tente novamente.", "error");
        }
    });
}
// ---- Modal de adicionar fundos ----
export function openAddFundsModal(goalId, goalTitle, onSuccess) {
    document.getElementById("add-funds-modal")?.remove();
    const modal = document.createElement("div");
    modal.id = "add-funds-modal";
    modal.className = "fw-modal";
    modal.innerHTML = `
    <div class="fw-modal-box fw-modal-box--sm">
      <div class="fw-modal-header">
        <h3><i class="fas fa-plus-circle"></i> Adicionar valor</h3>
        <button class="fw-modal-close" id="close-funds-modal"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="fw-modal-body">
        <p class="funds-goal-name">Meta: <strong>${goalTitle}</strong></p>
        <div class="form-group">
          <label for="funds-amount">Valor a adicionar (R$) <span class="required">*</span></label>
          <input type="number" id="funds-amount" placeholder="R$ 0,00" min="0.01" step="0.01" autofocus>
        </div>
        <div class="fw-modal-footer">
          <button class="fw-btn fw-btn--ghost" id="cancel-funds-btn">Cancelar</button>
          <button class="fw-btn fw-btn--primary" id="confirm-funds-btn">
            <i class="fas fa-check"></i> Adicionar
          </button>
        </div>
      </div>
    </div>
  `;
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add("show"));
    const close = () => {
        modal.classList.remove("show");
        setTimeout(() => modal.remove(), 300);
    };
    document.getElementById("close-funds-modal")?.addEventListener("click", close);
    document.getElementById("cancel-funds-btn")?.addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal)
        close(); });
    document.getElementById("confirm-funds-btn")?.addEventListener("click", async () => {
        const amount = parseFloat(document.getElementById("funds-amount").value);
        if (isNaN(amount) || amount <= 0) {
            showToast("Digite um valor válido.", "error");
            return;
        }
        try {
            await updateGoalAmount(goalId, amount);
            close();
            showToast("Valor adicionado à meta!", "success");
            onSuccess();
        }
        catch {
            showToast("Erro ao atualizar meta.", "error");
        }
    });
}
// ---- Setup de eventos dos cards de meta ----
export function setupGoalCardEvents(containerId, goals, onRefresh) {
    const container = document.getElementById(containerId);
    if (!container)
        return;
    container.addEventListener("click", async (e) => {
        const target = e.target;
        // Adicionar fundos
        const addBtn = target.closest(".goal-add-funds");
        if (addBtn) {
            const id = addBtn.dataset.id;
            const goal = goals.find((g) => g.id === id);
            if (goal)
                openAddFundsModal(id, goal.title, onRefresh);
            return;
        }
        // Toggle pausar/retomar
        const toggleBtn = target.closest(".goal-toggle-status");
        if (toggleBtn) {
            const id = toggleBtn.dataset.id;
            const currentStatus = toggleBtn.dataset.status;
            const newStatus = currentStatus === "pausada" ? "em_andamento" : "pausada";
            try {
                await updateGoalStatus(id, newStatus);
                showToast(newStatus === "pausada" ? "Meta pausada." : "Meta retomada!", "info");
                onRefresh();
            }
            catch {
                showToast("Erro ao atualizar status.", "error");
            }
            return;
        }
        // Deletar
        const deleteBtn = target.closest(".goal-delete");
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            showConfirmModal("Excluir meta?", "Esta ação não pode ser desfeita.", async () => {
                try {
                    await deleteGoal(id);
                    showToast("Meta excluída.", "info");
                    onRefresh();
                }
                catch {
                    showToast("Erro ao excluir meta.", "error");
                }
            });
        }
    });
}
