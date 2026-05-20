// Verificar se usuário está autenticado
import { auth } from './firebase.js';

export function checkAuth() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('👤 Usuário autenticado:', user.email);
                resolve(user);
            } else {
                console.log('❌ Usuário não autenticado');
                resolve(null);
            }
        });
    });
}

export async function getCurrentUser() {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });
    });
}