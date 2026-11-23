export const LOCAL = Object.freeze({
  projectId: 'demo-mi-casa-05a', uid: 'demo-owner-05a', region: 'us-central1',
  authHost: '127.0.0.1:9299', firestoreHost: '127.0.0.1:8386', functionsHost: '127.0.0.1:5205',
});
export function requireRuntime(version = process.versions.node) {
  const [major, minor] = version.split('.').map(Number);
  if (major !== 24 || minor === undefined || !Number.isInteger(minor) || minor < 12) throw new Error('NODE_24_12_OR_NEWER_24_REQUIRED');
}
export function requireLocal(env: NodeJS.ProcessEnv = process.env) {
  // CLI discovery forwards its own emulator flag, not arbitrary parent-shell variables.
  if (env.FUNCTIONS_EMULATOR !== 'true' || (env.MI_CASA_ENV && env.MI_CASA_ENV !== 'emulator') || env.GCLOUD_PROJECT !== LOCAL.projectId ||
      (env.GOOGLE_CLOUD_PROJECT && env.GOOGLE_CLOUD_PROJECT !== LOCAL.projectId) ||
      env.FIRESTORE_EMULATOR_HOST !== LOCAL.firestoreHost || env.FIREBASE_AUTH_EMULATOR_HOST !== LOCAL.authHost ||
      env.GOOGLE_APPLICATION_CREDENTIALS || env.FIREBASE_TOKEN || env.GOOGLE_OAUTH_ACCESS_TOKEN || env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('LOCAL_ONLY_CONFIG_REQUIRED');
  }
  if (env.FIREBASE_CONFIG) {
    let config: Record<string, unknown>;
    try { config = JSON.parse(env.FIREBASE_CONFIG) as Record<string, unknown>; } catch { throw new Error('LOCAL_ONLY_FIREBASE_CONFIG'); }
    if (!config || config.projectId !== LOCAL.projectId ||
        (config.storageBucket && config.storageBucket !== `${LOCAL.projectId}.appspot.com`) ||
        (config.databaseURL && config.databaseURL !== `https://${LOCAL.projectId}.firebaseio.com`)) throw new Error('LOCAL_ONLY_FIREBASE_CONFIG');
  }
}
