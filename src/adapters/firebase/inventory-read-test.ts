import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, setLogLevel } from 'firebase/firestore/lite';
import type { AuthTestConfiguration } from '../../application/configuration';
import { prepareInventoryReadConfiguration, requireRealInventoryReadRelease } from '../../application/inventory-read-configuration';
import type { CandidateReadPort } from '../../application/inventory-candidate';
import { createCandidateReader } from './inventory-candidate-reader';

// 05C-6: reuses the existing Auth app; only an explicitly selected read mode composes this port.
export function createPreparedInventoryRead(authConfig: AuthTestConfiguration, env: Readonly<Record<string, unknown>>, origin: string): CandidateReadPort {
  const config = prepareInventoryReadConfiguration(authConfig, env, origin);
  requireRealInventoryReadRelease(env);
  const app = getApp(`mi-casa-auth-test:${config.projectId}`), auth = getAuth(app);
  if (app.options.projectId !== config.projectId || app.options.apiKey !== authConfig.apiKey || app.options.appId !== authConfig.appId || auth.app !== app || auth.emulatorConfig) throw new Error('MIXED_INVENTORY_ENVIRONMENT');
  // SDK warnings contain document paths (UID) and request details. UI errors are translated separately.
  setLogLevel('silent');
  return createCandidateReader(initializeFirestore(app, {}, config.databaseId), auth, config.ownerUid);
}
