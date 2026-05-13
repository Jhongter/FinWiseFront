// check-auth.js - Verificação de autenticação via JWT (Spring Boot)
import { getCurrentUser, checkAuthOrRedirect } from "./api-auth.js";

/**
 * Retorna o usuário logado, ou null se não houver sessão.
 */
export function checkAuth() {
  return Promise.resolve(getCurrentUser());
}

export { getCurrentUser, checkAuthOrRedirect };
