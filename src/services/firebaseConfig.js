// src/services/firebaseConfig.js (stubbed / optional)
// NOTE: Firebase has been intentionally deferred. This stub allows the rest of
// the application (and tests) to run without the firebase packages installed.
// When you are ready to enable Firebase again, replace this file with the
// original initialization logic or a dynamic loader.

// Public API kept stable so future code changes are minimal.
export const db = null;
export const auth = null;
const app = null;

// Utility to detect if firebase is configured (all essential env vars present)
export function isFirebaseConfigured() {
  let env = {};
  try {
    env = import.meta?.env || {};
  } catch (_e) {
    env = {};
  }
  return !!(
    env.VITE_FIREBASE_API_KEY &&
    env.VITE_FIREBASE_PROJECT_ID &&
    env.VITE_FIREBASE_APP_ID
  );
}

export default app;
