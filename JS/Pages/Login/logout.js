// logout.js
import { auth, signOut } from '../../auth/firebase.js';

/**
 * Desloga o usuário e redireciona.
 */
async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = '../Login/login.html';
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        alert("Erro ao tentar sair da conta. Tente novamente.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
});
