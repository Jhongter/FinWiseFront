// dashboard-script.js - VERSÃO COMPLETA E CORRIGIDA
import { getCurrentUser, logout, fetchAutenticado } from "../../auth/api-auth.js";

// Variáveis globais
let financialCharts = { evolution: null, expenses: null };

// ======== DARK MODE FUNCTIONALITY ========
function setupDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const htmlElement = document.documentElement;

    if (!darkModeToggle) return;

    // Verifica preferência salva ou do sistema
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Aplica o tema inicial
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
    } else if (systemPrefersDark) {
        htmlElement.setAttribute('data-theme', 'dark');
    }

    // Atualiza ícones iniciais
    updateDarkModeIcons(htmlElement.getAttribute('data-theme'));

    // Event listener para o toggle
    darkModeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        updateDarkModeIcons(newTheme);
    });

    // Observa mudanças no sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            htmlElement.setAttribute('data-theme', newTheme);
            updateDarkModeIcons(newTheme);
        }
    });
}

function updateDarkModeIcons(theme) {
    const darkIcon = document.querySelector('.dark-mode-icon');
    const lightIcon = document.querySelector('.light-mode-icon');
    
    if (darkIcon && lightIcon) {
        darkIcon.style.display = theme === 'light' ? 'inline' : 'none';
        lightIcon.style.display = theme === 'dark' ? 'inline' : 'none';
    }
}

// ── fetchAutenticado vem do api-auth.js (importado acima) ──────────────────

// Inicialização da Dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Configura dark mode primeiro
    setupDarkMode();
    
    // Configura viewport para mobile
    setupMobileViewport();
    
    // Verifica autenticação JWT
    const user = getCurrentUser();
    if (!user) {
        window.location.href = "../Login/login.html";
        return;
    }
    document.getElementById("username-display").textContent = user.nome || user.email.split("@")[0];
    setupEventListeners();
    loadUserData();
    
    // Define a data atual como padrão no campo de data
    document.getElementById("transaction-date").valueAsDate = new Date();

    document.getElementById('logout-btn').addEventListener('click', () => {
        document.getElementById('survey-modal').classList.add('active');
    });

    document.getElementById('survey-yes-btn').addEventListener('click', async () => {
        window.open('https://docs.google.com/forms/d/e/1FAIpQLScvMX0fHIezz_xwne5lfynoX1-7XwjkWiYQa50jR_vmqgdtrw/viewform', '_blank');
        logout();
        window.location.href = "../Login/login.html";
    });

    document.getElementById('survey-no-btn').addEventListener('click', async () => {
        logout();
        window.location.href = "../Login/login.html";
    });
});

// ======== RESPONSIVIDADE MOBILE ========
function setupMobileViewport() {
    // Previne zoom em inputs em iOS
    document.addEventListener('touchstart', function() {}, {passive: true});
    
    // Ajusta viewport para mobile
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
}

// Detecta se é mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// Ajusta gráficos para mobile
function setupChartsForMobile() {
    if (!isMobile()) return;
    
    // Ajusta opções dos gráficos para mobile
    if (financialCharts.expenses) {
        financialCharts.expenses.options.plugins.legend.position = 'bottom';
        financialCharts.expenses.options.maintainAspectRatio = true;
        financialCharts.expenses.update();
    }
    
    if (financialCharts.evolution) {
        financialCharts.evolution.options.maintainAspectRatio = true;
        financialCharts.evolution.update();
    }
}

// Redimensiona gráficos quando a janela muda de tamanho
window.addEventListener('resize', function() {
    setupChartsForMobile();
});

/* ======== LÓGICA DE DADOS ======== */
async function loadUserData() {
    try {
        console.log("🔄 Carregando dados do usuário...");
        
        const [summaryRes, transRes] = await Promise.all([
            fetchAutenticado('/transacoes/resumo'),
            fetchAutenticado('/transacoes')
        ]);

        if (!summaryRes.ok || !transRes.ok) {
            throw new Error('Falha ao carregar dados do servidor.');
        }

        const summaryData = await summaryRes.json();
        const transactionsData = await transRes.json();

        console.log("📊 Dados carregados:", summaryData, transactionsData);

        // Atualiza a UI com os dados da API
        document.getElementById("current-salary").textContent = formatCurrency(summaryData.summary.salary);
        document.getElementById("salary-input").value = summaryData.summary.salary;
        
        updateFinancialSummary(summaryData.summary);
        loadTransactions(transactionsData.transactions);

    } catch (error) {
        console.error("❌ Erro ao carregar dados do usuário:", error);
        showAlert("Não foi possível carregar seus dados.", false);
    }
}

function updateFinancialSummary(summary) {
    console.log("📈 Atualizando resumo:", summary);
    
    document.getElementById("total-income").textContent = formatCurrency(summary.income);
    document.getElementById("total-expenses").textContent = formatCurrency(summary.expenses);
    document.getElementById("balance-amount").textContent = formatCurrency(summary.balance);

    // Atualiza status do saldo
    const balanceStatus = document.getElementById("balance-status");
    if (summary.balance > 0) {
        balanceStatus.textContent = "(Positivo)";
        balanceStatus.className = "positive";
    } else if (summary.balance < 0) {
        balanceStatus.textContent = "(Negativo)";
        balanceStatus.className = "negative";
    } else {
        balanceStatus.textContent = "(Neutro)";
        balanceStatus.className = "";
    }

    updateExpensesChart(summary.categories);
}

function loadTransactions(transactions) {
    console.log("💳 Carregando transações:", transactions);
    
    const list = document.getElementById("transaction-list");
    list.innerHTML = "";

    if (!transactions || transactions.length === 0) {
        list.innerHTML = `
            <li class='empty-list-message'>
                <i class="fas fa-receipt"></i>
                <span>Nenhuma transação registrada ainda.</span>
            </li>
        `;
        updateEvolutionChart([]);
        return;
    }

    // Ordena por data (mais recente primeiro)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Limita a 10 transações em mobile
    const displayTransactions = isMobile() ? transactions.slice(0, 10) : transactions;

    displayTransactions.forEach(transaction => {
        const item = createTransactionItem(transaction);
        list.appendChild(item);
    });

    // Mostra contador se houver mais transações em mobile
    if (isMobile() && transactions.length > 10) {
        const moreItem = document.createElement('li');
        moreItem.className = 'more-transactions-message';
        moreItem.innerHTML = `
            <i class="fas fa-ellipsis-h"></i>
            <span>+${transactions.length - 10} transações</span>
        `;
        list.appendChild(moreItem);
    }

    updateEvolutionChart(transactions);
}

// Função melhorada para criar itens de transação
function createTransactionItem(transaction) {
    const item = document.createElement("li");
    item.className = `transaction-item ${transaction.type}`;
    
    const isMobileView = isMobile();
    
    item.innerHTML = `
        <div class="transaction-main">
            <div class="transaction-info">
                <div class="transaction-header">
                    <span class="transaction-title">${transaction.description}</span>
                    <span class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'expense' ? '-' : '+'} ${formatCurrency(transaction.amount)}
                    </span>
                </div>
                <div class="transaction-details">
                    <span class="transaction-category">
                        <i class="fas ${getCategoryIcon(transaction.category)}"></i>
                        ${getCategoryName(transaction.category)}
                    </span>
                    <span class="transaction-date">
                        <i class="far fa-calendar"></i>
                        ${formatTransactionDate(transaction.date, isMobileView)}
                    </span>
                </div>
            </div>
            <button class="delete-transaction" data-id="${transaction.id}" title="Excluir transação">
                <i class="fas fa-trash"></i>
                ${isMobileView ? '' : 'Excluir'}
            </button>
        </div>
    `;
    
    return item;
}

// Ícones para categorias
function getCategoryIcon(category) {
    const icons = {
        alimentacao: 'fa-utensils',
        moradia: 'fa-home',
        transporte: 'fa-car',
        lazer: 'fa-gamepad',
        outros: 'fa-shapes'
    };
    return icons[category] || 'fa-circle';
}

// Formata data para mobile/desktop
function formatTransactionDate(dateString, isMobile) {
    const date = new Date(dateString);
    if (isMobile) {
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit',
            month: '2-digit'
        });
    }
    return date.toLocaleDateString('pt-BR');
}

/* ======== GRÁFICOS CORRIGIDOS ======== */
function updateExpensesChart(categories) {
    const ctx = document.getElementById('expenses-chart')?.getContext('2d');
    if (!ctx) {
        console.warn("Canvas do gráfico de despesas não encontrado");
        return;
    }
    
    // Verifica se há dados para mostrar
    const hasData = categories && Object.keys(categories).length > 0 && Object.values(categories).some(val => val > 0);
    
    if (!hasData) {
        // Mostra mensagem de dados insuficientes
        showChartMessage(ctx, "Adicione despesas para ver o gráfico");
        if (financialCharts.expenses) {
            financialCharts.expenses.destroy();
            financialCharts.expenses = null;
        }
        return;
    }
    
    const labels = Object.keys(categories).map(getCategoryName);
    const data = Object.values(categories);

    // Destrói gráfico anterior se existir
    if (financialCharts.expenses) {
        financialCharts.expenses.destroy();
    }
    
    financialCharts.expenses = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                borderWidth: isMobile() ? 1 : 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: isMobile() ? 'bottom' : 'right',
                    labels: { 
                        padding: 20,
                        boxWidth: 12,
                        font: {
                            size: isMobile() ? 10 : 12
                        }
                    }
                }
            },
            cutout: isMobile() ? '50%' : '60%'
        }
    });
}

function updateEvolutionChart(transactions) {
    const ctx = document.getElementById('evolution-chart')?.getContext('2d');
    if (!ctx) {
        console.warn("Canvas do gráfico de evolução não encontrado");
        return;
    }

    // Processa dados para o gráfico
    const chartData = processChartData(transactions);

    // Verifica se há dados suficientes
    const hasData = chartData.labels.length > 0 && 
                   (chartData.income.some(val => val > 0) || chartData.expenses.some(val => val > 0));

    if (!hasData) {
        // Mostra mensagem de dados insuficientes
        showChartMessage(ctx, "Adicione transações para ver o gráfico");
        if (financialCharts.evolution) {
            financialCharts.evolution.destroy();
            financialCharts.evolution = null;
        }
        return;
    }

    // Destrói gráfico anterior se existir
    if (financialCharts.evolution) {
        financialCharts.evolution.destroy();
    }

    financialCharts.evolution = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Receita',
                    data: chartData.income,
                    borderColor: '#4BC0C0',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    fill: false,
                    tension: 0.4,
                    borderWidth: isMobile() ? 2 : 3
                },
                {
                    label: 'Despesa',
                    data: chartData.expenses,
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    fill: false,
                    tension: 0.4,
                    borderWidth: isMobile() ? 2 : 3
                },
                {
                    label: 'Saldo',
                    data: chartData.balance,
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: isMobile() ? 2 : 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                y: { 
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (isMobile() && value >= 1000) {
                                return 'R$' + (value/1000).toFixed(0) + 'k';
                            }
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        },
                        font: {
                            size: isMobile() ? 10 : 12
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: isMobile() ? 10 : 12
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: isMobile() ? 10 : 12
                        }
                    }
                }
            }
        }
    });
}

// FUNÇÃO PROCESSCHARTDATA COMPLETAMENTE CORRIGIDA
function processChartData(transactions) {
    if (!transactions || transactions.length === 0) {
        return {
            labels: [],
            income: [],
            expenses: [],
            balance: []
        };
    }

    const data = {};
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        
        // Agrupa por mês-ano (ex: "Jan/24")
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear().toString().slice(-2);
        const key = `${month}/${year}`;
        
        if (!data[key]) {
            data[key] = { income: 0, expenses: 0, balance: 0 };
        }
        
        if (transaction.type === 'income') {
            data[key].income += transaction.amount;
            data[key].balance += transaction.amount;
        } else {
            data[key].expenses += transaction.amount;
            data[key].balance -= transaction.amount;
        }
    });

    // Ordena as chaves por data
    const monthOrder = { 'Jan': 1, 'Fev': 2, 'Mar': 3, 'Abr': 4, 'Mai': 5, 'Jun': 6, 
                        'Jul': 7, 'Ago': 8, 'Set': 9, 'Out': 10, 'Nov': 11, 'Dez': 12 };
    
    const labels = Object.keys(data).sort((a, b) => {
        const [monthA, yearA] = a.split('/');
        const [monthB, yearB] = b.split('/');
        
        const yearNumA = parseInt('20' + yearA);
        const yearNumB = parseInt('20' + yearB);
        
        if (yearNumA !== yearNumB) return yearNumA - yearNumB;
        return monthOrder[monthA] - monthOrder[monthB];
    });

    const income = labels.map(label => data[label].income);
    const expenses = labels.map(label => data[label].expenses);
    const balance = labels.map(label => data[label].balance);

    return { labels, income, expenses, balance };
}

// Função auxiliar para mostrar mensagem no canvas
function showChartMessage(ctx, message) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = "14px Arial";
    ctx.fillStyle = "#999";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(message, ctx.canvas.width / 2, ctx.canvas.height / 2);
}

/* ======== EVENT LISTENERS ======== */
function setupEventListeners() {
    console.log("🔧 Configurando event listeners...");
    
    // Salvar Salário
    const salaryForm = document.getElementById("salary-form");
    if (salaryForm) {
        salaryForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const newSalary = parseFloat(document.getElementById("salary-input").value);
            
            if (!newSalary || newSalary <= 0) {
                showAlert("Digite um valor válido para o salário!", false);
                return;
            }
            
            try {
                const response = await fetchAutenticado("/salario", {
                    method: "POST",
                    body: { amount: newSalary },
                });

                if (!response.ok) throw new Error("Falha ao salvar salário.");
                
                showAlert("Salário atualizado com sucesso!", true);
                loadUserData();
            } catch (error) {
                console.error(error);
                showAlert(error.message, false);
            }
        });
    }

    // Adicionar Transação
    const transactionForm = document.getElementById("transaction-form");
    if (transactionForm) {
        transactionForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const type = document.getElementById("transaction-type").value;
            const description = document.getElementById("transaction-desc").value;
            const amount = parseFloat(document.getElementById("transaction-amount").value);
            const category = document.getElementById("transaction-category").value;
            const date = document.getElementById("transaction-date").value;

            if (!description || !amount || amount <= 0 || !date) {
                showAlert("Preencha todos os campos corretamente!", false);
                return;
            }

            try {
                const response = await fetchAutenticado("/transacoes", {
                    method: "POST",
                    body: { type, description, amount, category, date },
                });

                if (!response.ok) throw new Error("Falha ao adicionar transação.");
                
                showAlert("Transação adicionada com sucesso!", true);
                transactionForm.reset();
                document.getElementById("transaction-date").valueAsDate = new Date();
                loadUserData();
                
            } catch (error) {
                console.error(error);
                showAlert(error.message, false);
            }
        });
    }

    // Deletar Transação (com confirmação melhorada)
    const transactionList = document.getElementById("transaction-list");
    if (transactionList) {
        transactionList.addEventListener("click", async (e) => {
            const deleteBtn = e.target.closest('.delete-transaction');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                showDeleteConfirmation(id, deleteBtn);
            }
        });
    }
    
    // Simulador de Investimentos
    const investmentForm = document.getElementById("investment-form");
    if (investmentForm) {
        investmentForm.addEventListener("submit", (e) => {
            e.preventDefault();
            calculateInvestment();
        });
    }

    // Previne submit duplo em mobile
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                setTimeout(() => {
                    submitBtn.disabled = false;
                }, 2000);
            }
        });
    });
}

// Confirmação de exclusão melhorada
function showDeleteConfirmation(transactionId, deleteButton) {
    const confirmation = document.createElement('div');
    confirmation.className = 'delete-confirmation';
    confirmation.innerHTML = `
        <div class="confirmation-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h4>Excluir Transação?</h4>
            <p>Esta ação não pode ser desfeita.</p>
            <div class="confirmation-buttons">
                <button class="btn-cancel">Cancelar</button>
                <button class="btn-confirm-delete">
                    <i class="fas fa-trash"></i>
                    Excluir
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmation);
    
    // Anima a entrada
    setTimeout(() => confirmation.classList.add('show'), 10);
    
    // Event listeners dos botões
    confirmation.querySelector('.btn-cancel').addEventListener('click', () => {
        confirmation.classList.remove('show');
        setTimeout(() => confirmation.remove(), 300);
    });
    
    confirmation.querySelector('.btn-confirm-delete').addEventListener('click', async () => {
        confirmation.classList.remove('show');
        setTimeout(() => confirmation.remove(), 300);
        
        try {
            const response = await fetchAutenticado(`/transacoes/${transactionId}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Falha ao deletar transação.");
            
            showAlert("Transação deletada com sucesso!", true);
            loadUserData();
            
        } catch (error) {
            console.error(error);
            showAlert(error.message, false);
        }
    });
    
    // Fecha ao clicar fora
    confirmation.addEventListener('click', (e) => {
        if (e.target === confirmation) {
            confirmation.classList.remove('show');
            setTimeout(() => confirmation.remove(), 300);
        }
    });
}

/* ======== SIMULADOR DE INVESTIMENTOS ======== */
function calculateInvestment() {
    const initialAmount = parseFloat(document.getElementById("initial-amount").value);
    const months = parseInt(document.getElementById("investment-months").value);
    const investmentType = document.getElementById("investment-type").value;

    const rates = {
        selic: 0.1015,
        cdb: 0.12,
        lci: 0.085,
        tesouro: 0.055 // IPCA + 5.5%
    };

    const annualRate = rates[investmentType] || 0.1;
    const monthlyRate = Math.pow(1 + annualRate, 1/12) - 1;
    
    const finalAmount = initialAmount * Math.pow(1 + monthlyRate, months);
    const earnings = finalAmount - initialAmount;

    document.getElementById("final-amount").textContent = formatCurrency(finalAmount);
    document.getElementById("earnings-amount").textContent = formatCurrency(earnings);
}

/* ======== FUNÇÕES AUXILIARES ======== */
function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", { 
        style: "currency", 
        currency: "BRL" 
    }).format(value || 0);
}

function getCategoryName(category) {
    const categories = {
        alimentacao: 'Alimentação',
        moradia: 'Moradia',
        transporte: 'Transporte',
        lazer: 'Lazer',
        outros: 'Outros'
    };
    return categories[category] || category;
}

function showAlert(message, isSuccess) {
    // Remove alertas existentes
    const existingAlerts = document.querySelectorAll('.custom-alert, .delete-confirmation');
    existingAlerts.forEach(alert => alert.remove());

    const alert = document.createElement('div');
    alert.className = `custom-alert ${isSuccess ? 'success' : 'error'}`;
    alert.innerHTML = `
        <div class="alert-content">
            <span class="alert-icon">${isSuccess ? '✅' : '❌'}</span>
            <span class="alert-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(alert);

    // Mostra alerta
    setTimeout(() => alert.classList.add('show'), 10);
    
    // Remove após 3 segundos
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Adiciona estilos para os botões melhorados
const buttonStyles = `
<style>
/* Estados de loading para botões */
.btn.loading {
    position: relative;
    color: transparent;
}

.btn.loading::before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Melhorias nos botões de transação */
.transaction-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

/* Botão de edição */
.btn-edit {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    padding: 0.5rem 0.875rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    transition: all 0.3s ease;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.btn-edit:hover {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
}

/* Grupo de botões */
.btn-group {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.btn-group .btn {
    flex: 1;
    min-width: auto;
}

@media (max-width: 768px) {
    .btn-group {
        flex-direction: column;
    }
    
    .btn-group .btn {
        width: 100%;
    }
    
    .transaction-actions {
        flex-direction: column;
        width: 100%;
    }
    
    .transaction-actions .btn {
        width: 100%;
        justify-content: center;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', buttonStyles);

// Adiciona estilos para os alertas e confirmações
const additionalStyles = `
<style>
.custom-alert {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-left: 4px solid #2ecc71;
    border-radius: 8px;
    padding: 15px 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 400px;
}

.custom-alert.error {
    border-left-color: #e74c3c;
}

.custom-alert.show {
    transform: translateX(0);
    opacity: 1;
}

.alert-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.alert-icon {
    font-size: 16px;
}

.alert-message {
    font-weight: 500;
    color: #2c3e50;
}

/* Confirmação de exclusão */
.delete-confirmation {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.delete-confirmation.show {
    opacity: 1;
}

.confirmation-content {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
    max-width: 90%;
    width: 400px;
    transform: scale(0.9);
    transition: transform 0.3s ease;
}

.delete-confirmation.show .confirmation-content {
    transform: scale(1);
}

.confirmation-content i {
    font-size: 3rem;
    color: #ff6b6b;
    margin-bottom: 1rem;
}

.confirmation-content h4 {
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
}

.confirmation-content p {
    color: #7f8c8d;
    margin-bottom: 1.5rem;
}

.confirmation-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.btn-cancel, .btn-confirm-delete {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    flex: 1;
}

.btn-cancel {
    background: #bdc3c7;
    color: #2c3e50;
}

.btn-cancel:hover {
    background: #a0a7b0;
}

.btn-confirm-delete {
    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.btn-confirm-delete:hover {
    background: linear-gradient(135deg, #ff5252, #e53935);
}

/* Transações responsivas */
.transaction-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
}

.transaction-info {
    flex: 1;
    min-width: 0;
}

.transaction-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
}

.transaction-title {
    font-weight: 600;
    color: var(--text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    margin-right: 1rem;
}

.transaction-amount {
    font-weight: 700;
    white-space: nowrap;
}

.transaction-amount.income {
    color: #27ae60;
}

.transaction-amount.expense {
    color: #e74c3c;
}

.transaction-details {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.transaction-category, .transaction-date {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.transaction-category i, .transaction-date i {
    font-size: 0.75rem;
    opacity: 0.7;
}

.delete-transaction {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    white-space: nowrap;
    margin-left: 1rem;
}

.delete-transaction:hover {
    background: #c0392b;
    transform: translateY(-1px);
}

.empty-list-message, .more-transactions-message {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.empty-list-message i, .more-transactions-message i {
    font-size: 2rem;
    opacity: 0.5;
}

[data-theme="dark"] .custom-alert {
    background: #2d3748;
    border-left-color: #48bb78;
}

[data-theme="dark"] .custom-alert.error {
    border-left-color: #fc8181;
}

[data-theme="dark"] .alert-message {
    color: #e2e8f0;
}

[data-theme="dark"] .confirmation-content {
    background: #2d3748;
    color: #e2e8f0;
}

[data-theme="dark"] .confirmation-content h4 {
    color: #e2e8f0;
}

[data-theme="dark"] .confirmation-content p {
    color: #a0aec0;
}

/* Mobile styles */
@media (max-width: 768px) {
    .custom-alert {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
    }
    
    .transaction-main {
        flex-direction: column;
        gap: 1rem;
    }
    
    .transaction-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
    
    .transaction-title {
        margin-right: 0;
        white-space: normal;
    }
    
    .transaction-details {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .delete-transaction {
        align-self: stretch;
        justify-content: center;
        margin-left: 0;
    }
    
    .confirmation-content {
        margin: 1rem;
        padding: 1.5rem;
    }
    
    .confirmation-buttons {
        flex-direction: column;
    }
}

@media (max-width: 480px) {
    .transaction-item {
        padding: 1rem;
    }
    
    .delete-transaction {
        padding: 0.75rem;
    }
    
    .delete-transaction span {
        display: none;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);