// login.js — Login via Spring Boot JWT
import { login } from "../../auth/api-auth.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ login.js (Spring Boot) carregado");

  // ── Redireciona se já estiver logado ──────────────────────────
  if (localStorage.getItem("jwtToken")) {
    window.location.href = "../Dashboard/dashboard.html";
    return;
  }

  // ── Formulário de login ───────────────────────────────────────
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email    = document.getElementById("login-email").value.trim();
      const senha    = document.getElementById("login-password").value;
      const lembrar  = document.getElementById("remember").checked;

      if (!email || !senha) {
        alert("❌ Preencha todos os campos!");
        return;
      }

      const btn = loginForm.querySelector("button[type='submit']");
      const original = btn.textContent;
      btn.textContent = "Entrando...";
      btn.disabled = true;

  try {
  const { nome, token } = await login(email, senha);

  // Salva corretamente o token
if (lembrar) {
  localStorage.setItem("jwtToken", token);
  localStorage.setItem("userName", nome);
  localStorage.setItem("userEmail", email);

  sessionStorage.removeItem("jwtToken");
  sessionStorage.removeItem("userName");
  sessionStorage.removeItem("userEmail");

} else {
  sessionStorage.setItem("jwtToken", token);
  sessionStorage.setItem("userName", nome);
  sessionStorage.setItem("userEmail", email);

  localStorage.removeItem("jwtToken");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
}

  alert(`✅ Bem-vindo, ${nome}!\n\nRedirecionando para o dashboard...`);

  setTimeout(() => {
    window.location.href = "../Dashboard/dashboard.html";
  }, 1500);

      } catch (error) {
        console.error("❌ Erro no login:", error);
        alert(`❌ ${error.message || "Erro ao fazer login. Verifique suas credenciais."}`);
        btn.textContent = original;
        btn.disabled = false;
      }
    });
  }

  // ── Botão Google (desabilitado — usar login nativo) ──────────
  const googleBtn = document.getElementById("google-login");
  if (googleBtn) {
    googleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      alert("ℹ️ Login com Google não disponível nesta versão.\nUse seu e-mail e senha cadastrados.");
    });
  }

  console.log("✅ login.js inicializado com sucesso");
});
