export class ConfigurationError extends Error {}
export const EMULATOR_CONFIG = Object.freeze({
  mode: 'emulator' as const, projectId: 'demo-mi-casa-05a',
  authHost: '127.0.0.1:9299', firestoreHost: '127.0.0.1:8386', functionsHost: '127.0.0.1:5205',
});
export const LOCAL_AUTH_UID = 'demo-owner-05a';
export type Configuration = { mode: 'demo' } | typeof EMULATOR_CONFIG;
export function readConfiguration(env: Readonly<Record<string, unknown>>): Configuration {
  const mode = env.VITE_APP_MODE ?? 'demo';
  if (mode === 'demo') return { mode };
  if (mode !== 'emulator') throw new ConfigurationError('REMOTE_ENVIRONMENT_DISABLED_05A');
  for (const [key, value] of Object.entries({
    VITE_FIREBASE_PROJECT_ID: EMULATOR_CONFIG.projectId,
    VITE_AUTH_EMULATOR_HOST: EMULATOR_CONFIG.authHost,
    VITE_FIRESTORE_EMULATOR_HOST: EMULATOR_CONFIG.firestoreHost,
    VITE_FUNCTIONS_EMULATOR_HOST: EMULATOR_CONFIG.functionsHost,
  })) if (env[key] !== value) throw new ConfigurationError(`INVALID_LOCAL_CONFIGURATION:${key}`);
  return EMULATOR_CONFIG;
}
export function requireLocalAuthentication(configuration: Configuration, hostname: string): void {
  if (!['127.0.0.1', 'localhost'].includes(hostname) ||
      Object.keys(configuration).length !== Object.keys(EMULATOR_CONFIG).length ||
      Object.entries(EMULATOR_CONFIG).some(([key, value]) => configuration[key as keyof Configuration] !== value)) {
    throw new ConfigurationError('LOCAL_AUTHENTICATION_ONLY');
  }
}
