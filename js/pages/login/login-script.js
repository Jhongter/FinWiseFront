// login-script.js - VERSÃO CORRIGIDA E FUNCIONAL
document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ login-script.js carregado");

    // ========== CONFIGURAÇÃO DAS TABS ==========
    function setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const target = button.dataset.target;
                
                // Atualiza tabs ativas
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Mostra o formulário correto
                document.querySelectorAll('.form').forEach(form => form.classList.remove('active'));
                document.getElementById(target).classList.add('active');
            });
        });
    }

    // ========== TOGGLE DE SENHA ==========
    function setupPasswordToggles() {
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', function() {
                const input = this.closest('.password-input').querySelector('input');
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                this.textContent = type === 'password' ? '👁️' : '🔒';
            });
        });
    }

    // ========== MÁSCARA DE TELEFONE ==========
    function setupPhoneMask() {
        const phoneInput = document.getElementById('cadastro-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                let formattedValue = '';
                
                if (value.length > 0) formattedValue = `(${value.substring(0, 2)}`;
                if (value.length > 2) formattedValue += `) ${value.substring(2, 7)}`;
                if (value.length > 7) formattedValue += `-${value.substring(7, 11)}`;
                
                e.target.value = formattedValue;
            });
        }
    }

    // ========== DARK MODE TOGGLE ==========
    function setupDarkModeToggle() {
        const darkModeToggle = document.querySelector('.dark-mode-toggle');
        
        if (!darkModeToggle) return;
        
        // Verifica preferência do usuário ou tema salvo
        const savedTheme = localStorage.getItem('theme') || 
                          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        
        // Aplica o tema inicial
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Atualiza ícones iniciais
        updateDarkModeIcons(savedTheme);
        
        darkModeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // Alterna o tema
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Atualiza ícones
            updateDarkModeIcons(newTheme);
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

    // ========== BOTÃO GOOGLE ==========
    function setupGoogleButton() {
        const googleButton = document.getElementById('google-login');
        
        if (googleButton) {
            googleButton.addEventListener('click', function(e) {
                e.preventDefault();
                console.log("🔧 Botão Google clicado - aguardando Firebase...");
                
                // Adiciona efeito visual de loading
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fab fa-google"></i> Conectando...';
                this.disabled = true;
                
                // Restaura após 2 segundos (caso o Firebase não responda)
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.disabled = false;
                }, 2000);
            });
        } else {
            console.warn("⚠️ Botão Google não encontrado");
        }
    }

    // ========== VALIDAÇÕES DE FORMULÁRIO (APENAS UI) ==========
    function setupFormValidations() {
        // Validação de email básica
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (this.value && !this.validity.valid) {
                    this.style.borderColor = '#e74c3c';
                } else {
                    this.style.borderColor = '';
                }
            });
        });

        // Validação de confirmação de senha
        const confirmPassword = document.getElementById('cadastro-confirm-password');
        const password = document.getElementById('register-password');
        
        if (confirmPassword && password) {
            confirmPassword.addEventListener('input', function() {
                if (password.value !== this.value && this.value.length > 0) {
                    this.style.borderColor = '#e74c3c';
                } else {
                    this.style.borderColor = '';
                }
            });
        }
    }

    // ========== ANIMAÇÕES E EFEITOS VISUAIS ==========
    function setupAnimations() {
        // Efeito de foco nos inputs
        const inputs = document.querySelectorAll('.form-group input, .form-group select');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                if (!this.value) {
                    this.parentElement.classList.remove('focused');
                }
            });
        });
    }

    // ========== MENSAGENS DE ALERTA ==========
    function showAlert(message, isSuccess = true, duration = 3000) {
        // Remove alertas existentes
        const existingAlert = document.querySelector('.custom-alert');
        if (existingAlert) existingAlert.remove();

        // Cria novo alerta
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
        
        // Remove após tempo determinado
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 300);
        }, duration);
    }

    // ========== INICIALIZAÇÃO ==========
    function initialize() {
        console.log("🔄 Inicializando login-script.js...");
        
        setupTabs();
        setupPasswordToggles();
        setupPhoneMask();
        setupDarkModeToggle();
        setupGoogleButton();
        setupFormValidations();
        setupAnimations();
        
        // Atualiza o ano no rodapé
        const currentYearElement = document.getElementById('current-year');
        if (currentYearElement) {
            currentYearElement.textContent = new Date().getFullYear();
        }
        
        console.log("✅ login-script.js inicializado com sucesso");
    }

    // Inicializa tudo
    initialize();
});

// Adiciona estilos para os alertas personalizados
const alertStyles = `
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

.form-group.focused label {
    color: #4299e1;
    transform: translateY(-5px);
    font-size: 12px;
}
</style>
`;

// Adiciona os estilos ao documento
document.head.insertAdjacentHTML('beforeend', alertStyles);