import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

/**
 * getAuth()/getFirestore() validate the API key immediately when called, which throws
 * during Next.js's server-side prerendering of every page (since AuthProvider sits in the
 * root layout) if NEXT_PUBLIC_FIREBASE_API_KEY is missing at build time. Deferring
 * construction until first real property access — which only happens client-side inside
 * useEffect/event handlers, never during the server render pass — keeps builds green even
 * without the env vars set, while still failing loudly with Firebase's own error the moment
 * the app actually tries to sign in or read Firestore in the browser without valid config.
 */
function getClientAuth(): Auth {
  if (!cachedAuth) cachedAuth = getAuth(firebaseApp);
  return cachedAuth;
}

function getClientDb(): Firestore {
  if (!cachedDb) cachedDb = getFirestore(firebaseApp);
  return cachedDb;
}

function lazyProxy<T extends object>(getInstance: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      const instance = getInstance();
      const value = Reflect.get(instance as object, prop, receiver);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });
}

export const auth = lazyProxy(getClientAuth);
export const db = lazyProxy(getClientDb);
export const googleProvider = new GoogleAuthProvider();
