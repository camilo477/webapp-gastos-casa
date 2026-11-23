import { ConfigurationError, requireTestAuthentication, type AuthTestConfiguration } from './configuration';
import { CONTRACT } from '@mi-casa/inventory-contract';

export const INVENTORY_READ_PROJECT = 'mi-casa-camilo-test';
export const INVENTORY_READ_CONTRACT = CONTRACT;
export type InventoryReadConfiguration = Readonly<{
  projectId: string; databaseId: '(default)'; ownerUid: string; contract: typeof INVENTORY_READ_CONTRACT;
}>;
// Offline preparation only. These values are never consumed by main.tsx in 05C-2.
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
export function requireRealInventoryReadRelease(): never {
  // Cannot be unlocked by .env, owner-approved Auth alone, a test flag or browser storage.
  // A later authorized phase must verify deployed rules/ACL and integrate a read-only UI first.
  throw new ConfigurationError('REAL_INVENTORY_READ_DISABLED_05C2');
}
