// auth.js — FinWise v2 | API: https://finwiseback.onrender.com
const API = "https://finwiseback.onrender.com";

function showAlert(msg, ok = true) {
  document.querySelector(".custom-alert")?.remove();
  const el = document.createElement("div");
  el.className = `custom-alert ${ok ? "success" : "error"}`;
  el.innerHTML = `<div class="alert-content">
    <span class="alert-icon">${ok ? "✅" : "❌"}</span>
    <span class="alert-message">${msg}</span>
  </div>`;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add("show"), 10);
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); }, 3500);
}

document.addEventListener("DOMContentLoaded", () => {

  // ── LOGIN ──────────────────────────────────────────────────
  document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email   = document.getElementById("login-email").value.trim();
    const senha   = document.getElementById("login-password").value;
    const lembrar = document.getElementById("remember")?.checked;
    if (!email || !senha) { showAlert("Preencha todos os campos!", false); return; }

    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = "Entrando..."; btn.disabled = true;

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "E-mail ou senha incorretos.");
      }
      const { token } = await res.json();
      if (!token) throw new Error("Token não recebido.");
      localStorage.setItem("finwise_jwt", token);
      if (lembrar) localStorage.setItem("finwise_user_email", email);
      showAlert("Login realizado! Redirecionando...");
      setTimeout(() => { window.location.href = "/pages/dashboard/dist/dashboard.html"; }, 1200);
    } catch (err) {
      showAlert(err.message || "Erro ao fazer login.", false);
      btn.textContent = orig; btn.disabled = false;
    }
  });

  // ── CADASTRO ───────────────────────────────────────────────
  document.getElementById("cadastro-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome         = document.getElementById("cadastro-nome").value.trim();
    const email        = document.getElementById("cadastro-email").value.trim();
    const senha        = document.getElementById("cadastro-password").value;
    const confirmSenha = document.getElementById("cadastro-confirm-password").value;
    const terms        = document.getElementById("terms")?.checked;

    if (!nome || !email || !senha || !confirmSenha) { showAlert("Preencha todos os campos!", false); return; }
    if (!terms)                 { showAlert("Aceite os termos e condições!", false); return; }
    if (senha !== confirmSenha) { showAlert("As senhas não coincidem!", false); return; }
    if (senha.length < 6)       { showAlert("Senha deve ter pelo menos 6 caracteres!", false); return; }

    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = "Criando conta..."; btn.disabled = true;

    try {
      const regRes = await fetch(`${API}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });
      if (!regRes.ok) {
        const err = await regRes.json().catch(() => ({}));
        throw new Error(err.message || "Erro ao criar conta.");
      }
      const loginRes = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      if (loginRes.ok) {
        const { token } = await loginRes.json();
        if (token) localStorage.setItem("finwise_jwt", token);
        localStorage.setItem("finwise_user_email", email);
      }
      showAlert("Conta criada! Redirecionando...");
      setTimeout(() => { window.location.href = "/pages/dashboard/dist/dashboard.html"; }, 1500);
    } catch (err) {
      showAlert(err.message || "Erro ao criar conta.", false);
      btn.textContent = orig; btn.disabled = false;
    }
  });

});
