// api-auth.js - Autenticação com Spring Boot JWT
// Substitui o firebase.js — importe este arquivo onde antes usava firebase.js

const API_BASE = "http://localhost:8081";

// ─────────────────────────────────────────────
// Funções principais de autenticação
// ─────────────────────────────────────────────

/**
 * Faz login e salva token + dados do usuário no localStorage.
 * @returns {Promise<{token, nome, email}>}
 */
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

  const data = await response.json(); // { token, nome, email }
  _salvarSessao(data);
  return data;
}

/**
 * Cadastra um novo usuário (endpoint público POST /usuarios).
 * @returns {Promise<{id, nome, email}>}
 */
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

/**
 * Remove os dados de sessão do localStorage (logout).
 */
export function logout() {
  localStorage.removeItem("jwtToken");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
}

/**
 * Retorna o token JWT salvo, ou null se não houver sessão.
 */
export function getToken() {
  return (
    localStorage.getItem("jwtToken") ||
    sessionStorage.getItem("jwtToken")
  );
}

/**
 * Retorna objeto { nome, email } do usuário logado, ou null.
 */
export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  return {
    nome: localStorage.getItem("userName"),
    email: localStorage.getItem("userEmail"),
    // displayName compatível com o padrão Firebase usado no dashboard
    displayName: localStorage.getItem("userName"),
  };
}

/**
 * Verifica se há sessão ativa e redireciona para login se não houver.
 * Substitui o onAuthStateChanged do Firebase.
 */
export function checkAuthOrRedirect(redirectPath = "../Login/login.html") {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = redirectPath;
    return null;
  }
  return user;
}

/**
 * Faz uma requisição autenticada com o token JWT.
 * Redireciona para login se token expirado (401).
 */
export async function fetchAutenticado(url, options = {}) {
  const token = getToken();
  if (!token) {
    window.location.href = "../Login/login.html";
    throw new Error("Usuário não autenticado");
  }

  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  if (options.body && typeof options.body === "object") {
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, options);

  if (response.status === 401) {
    logout();
    window.location.href = "../Login/login.html";
    throw new Error("Sessão expirada");
  }

  return response;
}

// ─────────────────────────────────────────────
// Privado
// ─────────────────────────────────────────────
function _salvarSessao({ token, nome, email }) {
  localStorage.setItem("userName", nome);
  localStorage.setItem("userEmail", email);
}
