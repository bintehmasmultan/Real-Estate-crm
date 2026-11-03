import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | null = null;

export function hasFirebaseAdminCredentials() {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

function initAdmin(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0]!;
    return app;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId) {
    throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set");
  }

  if (clientEmail && privateKey) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
    return app;
  }

  throw new Error(
    "Firebase Admin credentials missing. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local (Firebase Console → Project settings → Service accounts)."
  );
}

export function getAdminAuth(): Auth {
  return getAuth(initAdmin());
}

export function getAdminDb(): Firestore {
  return getFirestore(initAdmin());
}

/** @deprecated use getAdminAuth() */
export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop, receiver) {
    return Reflect.get(getAdminAuth(), prop, receiver);
  },
});

/** @deprecated use getAdminDb() */
export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    return Reflect.get(getAdminDb(), prop, receiver);
  },
});
