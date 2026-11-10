// Inicialização do Firebase (Authentication e Cloud Firestore).
//
// A configuração vem do arquivo .env (fora do Git). O Expo só coloca no app
// as variáveis com prefixo EXPO_PUBLIC_, e cada uma precisa ser lida assim,
// por extenso (process.env.EXPO_PUBLIC_...), para ser substituída no build.
// Esses valores identificam o projeto; a proteção dos dados fica nas regras
// do Firestore (firestore.rules).

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const configuracao = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const faltando = Object.entries(configuracao)
  .filter(([, valor]) => !valor)
  .map(([nome]) => nome);
if (faltando.length > 0) {
  throw new Error(
    `Configuração do Firebase incompleta (${faltando.join(', ')}). ` +
      'Crie o arquivo .env a partir do .env.example.'
  );
}

// Evita inicializar duas vezes quando o app recarrega em desenvolvimento.
const jaIniciado = getApps().length > 0;
export const app = jaIniciado ? getApp() : initializeApp(configuracao);

// O AsyncStorage guarda só a sessão do parceiro, para ele continuar logado.
// A localização do usuário nunca é gravada (RNF04).
export const auth = jaIniciado
  ? getAuth(app)
  : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

export const db = getFirestore(app);
