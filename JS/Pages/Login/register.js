// register.js — Cadastro via Spring Boot
import { cadastrar } from "../../auth/api-auth.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ register.js (Spring Boot) carregado");

  const cadastroForm = document.getElementById("cadastro-form");

  if (!cadastroForm) {
    console.error("❌ Formulário de cadastro não encontrado!");
    return;
  }

  cadastroForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome            = document.getElementById("cadastro-nome").value.trim();
    const email           = document.getElementById("cadastro-email").value.trim();
    const senha           = document.getElementById("cadastro-password").value;
    const confirmSenha    = document.getElementById("cadastro-confirm-password").value;
    const termos          = document.getElementById("terms").checked;

    // Validações
    if (!nome || !email || !senha || !confirmSenha) {
      alert("❌ Preencha todos os campos obrigatórios!");
      return;
    }
    if (!termos) {
      alert("❌ Você deve aceitar os termos e condições!");
      return;
    }
    if (senha !== confirmSenha) {
      alert("❌ As senhas não coincidem!");
      return;
    }
    if (senha.length < 6) {
      alert("❌ A senha deve ter pelo menos 6 caracteres!");
      return;
    }

    const btn = cadastroForm.querySelector("button[type='submit']");
    const original = btn.textContent;
    btn.textContent = "Criando conta...";
    btn.disabled = true;

    try {
      await cadastrar(nome, email, senha);

      alert("✅ Conta criada com sucesso!\n\nFaça login com suas credenciais.");
      cadastroForm.reset();

      // Muda para aba de login
      const loginTab = document.querySelector(".tab-btn[data-target='login-form']");
      if (loginTab) loginTab.click();

    } catch (error) {
      console.error("❌ Erro no cadastro:", error);

      let msg = error.message || "Erro ao criar conta.";
      if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("e-mail")) {
        msg = "❌ Este e-mail já está em uso ou é inválido.";
      } else {
        msg = `❌ ${msg}`;
      }
      alert(msg);

    } finally {
      btn.textContent = original;
      btn.disabled = false;
    }
  });

  console.log("✅ register.js inicializado com sucesso");
});
