import { ConfigurationError, requireTestAuthentication, type AuthTestConfiguration, type Configuration } from './configuration';
import { CONTRACT } from '@mi-casa/inventory-contract';

export const INVENTORY_READ_PROJECT = 'mi-casa-camilo-test';
export const INVENTORY_READ_CONTRACT = CONTRACT;
export type InventoryReadConfiguration = Readonly<{
  projectId: string; databaseId: '(default)'; ownerUid: string; contract: typeof INVENTORY_READ_CONTRACT;
}>;
// Auth-only approval does not grant inventory access. Server rules/ACL remain authoritative.
export function prepareInventoryReadConfiguration(auth: AuthTestConfiguration, env: Readonly<Record<string, unknown>>, origin: string): InventoryReadConfiguration {
  requireTestAuthentication(auth, origin);
  if (auth.projectId !== INVENTORY_READ_PROJECT || !/^http:\/\/(localhost|127\.0\.0\.1):5175$/.test(origin) ||
      env.VITE_FIRESTORE_READ_DATABASE !== '(default)' || env.VITE_FIRESTORE_READ_CONTRACT !== INVENTORY_READ_CONTRACT ||
      env.VITE_FIRESTORE_READ_APPROVAL !== `owner-approved-firestore-read-only:${auth.projectId}:(default)` ||
      ['VITE_AUTH_EMULATOR_HOST', 'VITE_FIRESTORE_EMULATOR_HOST', 'VITE_FUNCTIONS_EMULATOR_HOST', 'FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST'].some(key => Boolean(env[key]))) {
    throw new ConfigurationError('INVENTORY_READ_CONFIGURATION_NOT_AUTHORIZED');
  }
  return Object.freeze({ projectId: auth.projectId, databaseId: '(default)', ownerUid: auth.ownerUid, contract: INVENTORY_READ_CONTRACT });
}
export function requireRealInventoryReadRelease(env: Readonly<Record<string, unknown>> = {}): void {
  // 05C-6: owner confirmed published rules and ACL. Explicit local selection is still required.
  // This gate controls composition; it cannot substitute the server's authorization.
  if (env.VITE_FIRESTORE_READ_ENABLED !== 'true') throw new ConfigurationError('REAL_INVENTORY_READ_NOT_ENABLED');
}
export function inventoryReadRequested(configuration: Configuration, env: Readonly<Record<string, unknown>>, origin: string): boolean {
  const enabled = env.VITE_FIRESTORE_READ_ENABLED;
  if (enabled === undefined || enabled === 'false') return false;
  requireRealInventoryReadRelease(env);
  if (configuration.mode !== 'auth-test') throw new ConfigurationError('REAL_INVENTORY_READ_AUTH_TEST_ONLY');
  prepareInventoryReadConfiguration(configuration, env, origin);
  return true;
}
