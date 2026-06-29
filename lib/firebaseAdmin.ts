import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

let cachedApp: App | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;
let cachedMessaging: Messaging | null = null;

/**
 * Builds (or reuses) the Firebase Admin app. This reads env vars and throws if they're
 * missing, but it is only ever called lazily — from getAdminDb()/getAdminAuth() the first
 * time a request handler actually needs Firestore or Auth. It must never run at module
 * import time, or `next build`'s page-data collection step will crash on every route that
 * imports this file, even when those routes don't run during the build itself.
 */
function buildAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

function getAdminApp(): App {
  if (!cachedApp) cachedApp = buildAdminApp();
  return cachedApp;
}

export function getAdminDb(): Firestore {
  if (!cachedDb) cachedDb = getFirestore(getAdminApp());
  return cachedDb;
}

export function getAdminAuth(): Auth {
  if (!cachedAuth) cachedAuth = getAuth(getAdminApp());
  return cachedAuth;
}

export function getAdminMessaging(): Messaging {
  if (!cachedMessaging) cachedMessaging = getMessaging(getAdminApp());
  return cachedMessaging;
}

/**
 * Proxy-backed exports so existing call sites (`adminDb.collection(...)`, `adminAuth.x()`)
 * keep working unchanged. Touching a property only triggers lazy init at that point — never
 * at import time — so simply importing this module is always safe, build included.
 */
function lazyProxy<T extends object>(getInstance: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      const instance = getInstance();
      const value = Reflect.get(instance as object, prop, receiver);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });
}

export const adminDb = lazyProxy(getAdminDb);
export const adminAuth = lazyProxy(getAdminAuth);
export const adminMessaging = lazyProxy(getAdminMessaging);

/**
 * Verifies the Firebase ID token sent from the client in the
 * Authorization: Bearer <token> header. Throws on invalid/expired tokens
 * or missing credentials — but only when actually called at request time.
 */
export async function verifyRequestUser(authorizationHeader: string | null) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new Error("Missing Authorization header");
  }
  const token = authorizationHeader.slice("Bearer ".length);
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded;
}
