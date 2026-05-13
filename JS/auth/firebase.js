import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    updateProfile,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// =============================================
// SUBSTITUA ESTES VALORES PELOS DO SEU PROJETO
// console.firebase.google.com → Configurações → SDK
// =============================================
const firebaseConfig = {
  apiKey: "AIzaSyDDUSrG4avnK5sl3kmAKtFBzAJNDHcP1KM",
  authDomain: "finwise-364e7.firebaseapp.com",
  projectId: "finwise-364e7",
  storageBucket: "finwise-364e7.firebasestorage.app",
  messagingSenderId: "587832702731",
  appId: "1:587832702731:web:8de843e47de75cf51a540e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    updateProfile,
    signOut,
    onAuthStateChanged
};
