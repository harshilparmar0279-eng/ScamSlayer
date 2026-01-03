'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';

/**
 * Gets the initialized Firebase services.
 * This function is for internal use by initializeFirebase().
 */
function getSdks(firebaseApp: FirebaseApp): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  
  // In development, connect to emulators. This check and connection
  // should happen right after getting the service instances.
  if (process.env.NODE_ENV === "development") {
    // Check if emulators are already connected to avoid re-connecting
    // This simple global flag is sufficient for the client-side context.
    if (!(global as any)._firebaseEmulatorsConnected) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(firestore, 'localhost', 8080);
      (global as any)._firebaseEmulatorsConnected = true;
    }
  }

  return { firebaseApp, auth, firestore };
}

/**
 * Initializes and returns the Firebase app and its services.
 * Ensures that initialization only happens once.
 */
export function initializeFirebase() {
  if (getApps().length > 0) {
    // If already initialized, get the existing app and its services.
    const app = getApp();
    return getSdks(app);
  }

  // If not initialized, create the app.
  const firebaseApp = initializeApp(firebaseConfig);
  // getSdks will handle connecting to emulators if in development.
  return getSdks(firebaseApp);
}

// Export hooks and providers
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';