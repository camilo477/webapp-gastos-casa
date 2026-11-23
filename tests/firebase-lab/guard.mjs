export const PROJECT = 'demo-mi-casa-04b';
export const UID = 'demo-owner-04b';
export const FIRESTORE_HOST = '127.0.0.1:8186';
export const AUTH_HOST = '127.0.0.1:9099';

function demoCliConfig(raw) {
  if (!raw) return true;
  try {
    const config = JSON.parse(raw);
    return config && Object.keys(config).sort().join(',') === 'databaseURL,projectId,storageBucket' &&
      config.projectId === PROJECT && config.storageBucket === `${PROJECT}.appspot.com` &&
      config.databaseURL === `https://${PROJECT}.firebaseio.com`;
  } catch { return false; }
}

// No fallback to real services, even when someone supplies production env vars.
export function requireEmulators(env = globalThis.process?.env ?? globalThis.__FIREBASE_LAB_ENV__ ?? {}) {
  if (env.FIRESTORE_EMULATOR_HOST !== FIRESTORE_HOST ||
      env.FIREBASE_AUTH_EMULATOR_HOST !== AUTH_HOST ||
      (env.GCLOUD_PROJECT && env.GCLOUD_PROJECT !== PROJECT) ||
      (env.GOOGLE_CLOUD_PROJECT && env.GOOGLE_CLOUD_PROJECT !== PROJECT) ||
      env.GOOGLE_APPLICATION_CREDENTIALS || !demoCliConfig(env.FIREBASE_CONFIG) || env.FIREBASE_TOKEN) {
    throw new Error('LAB_ONLY: use demo-mi-casa-04b and the exact loopback emulator endpoints; no credentials');
  }
}
