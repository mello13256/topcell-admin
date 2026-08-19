import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// Pegue esses valores em: Firebase Console → Configurações do
// projeto → Geral → "Seus apps" → app da Web → SDK config.
// ============================================================
const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Autenticação anônima automática — é o que dá permissão pro
// app ler/escrever no Firestore e Storage (as regras de segurança
// exigem "usuário autenticado", mesmo que anônimo). O controle de
// acesso de verdade pra quem usa o app é o PIN na tela de login.
export function ensureSignedIn() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user);
      } else {
        signInAnonymously(auth).then((cred) => resolve(cred.user)).catch(reject);
      }
    });
  });
}
