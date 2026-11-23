export const PROJECT = 'demo-mi-casa-04c';
export const UID = 'demo-owner-04c';
export function requireLab(env = process.env) {
  if (env.GCLOUD_PROJECT !== PROJECT || env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8286' ||
      env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9199' || env.GOOGLE_APPLICATION_CREDENTIALS || env.FIREBASE_TOKEN) {
    throw new Error('LAB_ONLY: demo project, exact loopback emulators and no credentials required');
  }
  if (env.FIREBASE_CONFIG) {
    const config = JSON.parse(env.FIREBASE_CONFIG);
    if (config.projectId !== PROJECT || (config.storageBucket && config.storageBucket !== `${PROJECT}.appspot.com`) ||
      (config.databaseURL && config.databaseURL !== `https://${PROJECT}.firebaseio.com`)) throw new Error('LAB_ONLY_CONFIG');
  }
}
