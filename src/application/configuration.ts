export class ConfigurationError extends Error {}
export const EMULATOR_CONFIG = Object.freeze({
  mode: 'emulator' as const, projectId: 'demo-mi-casa-05a',
  authHost: '127.0.0.1:9299', firestoreHost: '127.0.0.1:8386', functionsHost: '127.0.0.1:5205',
});
export const LOCAL_AUTH_UID = 'demo-owner-05a';
export type AuthMethod = 'password' | 'google';
export type AuthTestConfiguration = Readonly<{
  mode: 'auth-test'; projectId: string; apiKey: string; authDomain: string; appId: string;
  ownerUid: string; methods: readonly AuthMethod[]; googleFlow: 'popup' | 'redirect';
  authorizedOrigin: string; approval: string;
}>;
export type Configuration = { mode: 'demo' } | typeof EMULATOR_CONFIG | AuthTestConfiguration;
const emulatorKeys = ['VITE_AUTH_EMULATOR_HOST', 'VITE_FIRESTORE_EMULATOR_HOST', 'VITE_FUNCTIONS_EMULATOR_HOST',
  'FIREBASE_AUTH_EMULATOR_HOST', 'FIRESTORE_EMULATOR_HOST'];
export function requireTestAuthentication(config: AuthTestConfiguration, origin: string): void {
  const keys = ['mode', 'projectId', 'apiKey', 'authDomain', 'appId', 'ownerUid', 'methods', 'googleFlow', 'authorizedOrigin', 'approval'];
  const validProject = /^[a-z][a-z0-9-]{4,24}-test$/.test(config.projectId) && !/^(demo|example|prod)/.test(config.projectId);
  const localOrigin = /^http:\/\/(localhost|127\.0\.0\.1):5175$/.test(config.authorizedOrigin);
  const sameOriginHelper = config.authorizedOrigin === `https://${config.authDomain}`;
  if (Object.keys(config).length !== keys.length || Object.keys(config).some(key => !keys.includes(key)) ||
      config.mode !== 'auth-test' || !validProject || config.approval !== `owner-approved-auth-only:${config.projectId}` ||
      config.authDomain !== `${config.projectId}.firebaseapp.com` ||
      !/^[A-Za-z0-9_-]{20,200}$/.test(config.apiKey) || !/^1:\d+:web:[a-f0-9]+$/.test(config.appId) ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(config.ownerUid) || /^(demo|example|replace|pending)/i.test(config.ownerUid) ||
      !Array.isArray(config.methods) || config.methods.length < 1 || config.methods.length > 2 ||
      config.methods.some(method => !['password', 'google'].includes(method)) || new Set(config.methods).size !== config.methods.length ||
      !['popup', 'redirect'].includes(config.googleFlow) || (!localOrigin && !sameOriginHelper) ||
      origin !== config.authorizedOrigin || (config.googleFlow === 'redirect' && !sameOriginHelper)) {
    throw new ConfigurationError('AUTH_TEST_NOT_AUTHORIZED_OR_INVALID');
  }
}
export function readConfiguration(env: Readonly<Record<string, unknown>>): Configuration {
  const mode = env.VITE_APP_MODE ?? 'demo';
  if (mode === 'demo') return { mode };
  if (mode === 'auth-test') {
    if (emulatorKeys.some(key => Boolean(env[key]))) throw new ConfigurationError('MIXED_AUTH_ENVIRONMENTS');
    const config: AuthTestConfiguration = {
      mode, projectId: String(env.VITE_FIREBASE_PROJECT_ID ?? ''), apiKey: String(env.VITE_FIREBASE_API_KEY ?? ''),
      authDomain: String(env.VITE_FIREBASE_AUTH_DOMAIN ?? ''), appId: String(env.VITE_FIREBASE_APP_ID ?? ''),
      ownerUid: String(env.VITE_AUTH_TEST_OWNER_UID ?? ''), methods: String(env.VITE_AUTH_TEST_PROVIDERS ?? '').split(',') as AuthMethod[],
      googleFlow: String(env.VITE_AUTH_TEST_GOOGLE_FLOW ?? '') as 'popup' | 'redirect',
      authorizedOrigin: String(env.VITE_AUTH_TEST_ORIGIN ?? ''), approval: String(env.VITE_AUTH_TEST_APPROVAL ?? ''),
    };
    requireTestAuthentication(config, config.authorizedOrigin);
    return Object.freeze({ ...config, methods: Object.freeze([...config.methods]) });
  }
  if (mode !== 'emulator') throw new ConfigurationError('REMOTE_ENVIRONMENT_DISABLED_05A');
  if (env.VITE_AUTH_TEST_APPROVAL) throw new ConfigurationError('MIXED_AUTH_ENVIRONMENTS');
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
