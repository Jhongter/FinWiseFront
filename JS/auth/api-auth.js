// api-auth.js - Autenticação com Spring Boot JWT
const API_BASE = "https://finwiseback.onrender.com";

// ── Autenticação ──────────────────────────────────────────

export async function login(email, senha) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.message || "Credenciais inválidas");
  }
  const data = await response.json();
  _salvarSessao(data);
  return data;
}

export async function cadastrar(nome, email, senha) {
  const response = await fetch(`${API_BASE}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha }),
  });
  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.message || "Erro ao criar conta");
  }
  return response.json();
}

export async function trocarSenha(senhaAtual, novaSenha) {
  const response = await fetchAutenticado(`${API_BASE}/usuarios/senha`, {
    method: "PUT",
    body: JSON.stringify({ senhaAtual, novaSenha }),
  });
  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.message || "Erro ao trocar senha");
  }
}

export function logout() {
  localStorage.removeItem("jwtToken");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
}

export function getToken() {
  return localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
}

export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  return {
    nome: localStorage.getItem("userName") || sessionStorage.getItem("userName"),
    email: localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail"),
    displayName: localStorage.getItem("userName") || sessionStorage.getItem("userName"),
  };
}

export function checkAuthOrRedirect(redirectPath = "../Login/login.html") {
  const user = getCurrentUser();
  if (!user) { window.location.href = redirectPath; return null; }
  return user;
}

/**
 * Faz fetch autenticado. Aceita URL relativa (ex: /transacoes)
 * ou absoluta (ex: https://...).
 */
export async function fetchAutenticado(url, options = {}) {
  const token = getToken();
  if (!token) {
    window.location.href = "../Login/login.html";
    throw new Error("Usuário não autenticado");
  }

  // Prepend API_BASE se URL relativa
  const fullUrl = url.startsWith("/") ? `${API_BASE}${url}` : url;

  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  if (options.body && typeof options.body === "object") {
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(fullUrl, options);

  if (response.status === 401) {
    logout();
    window.location.href = "../Login/login.html";
    throw new Error("Sessão expirada");
  }

  return response;
}

function _salvarSessao({ token, nome, email }) {
  localStorage.setItem("jwtToken", token);
  localStorage.setItem("userName", nome);
  localStorage.setItem("userEmail", email);
}
