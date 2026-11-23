import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore/lite';
import type { AuthTestConfiguration } from '../../application/configuration';
import { prepareInventoryReadConfiguration, requireRealInventoryReadRelease } from '../../application/inventory-read-configuration';
import type { InventoryReadPort } from '../../application/inventory-read';
import { createCandidateReader } from './inventory-candidate-reader';

// Prepared factory only. Not imported by main.tsx, routes or the existing Auth adapter.
export function createPreparedInventoryRead(authConfig: AuthTestConfiguration, env: Readonly<Record<string, unknown>>, origin: string): InventoryReadPort {
  const config = prepareInventoryReadConfiguration(authConfig, env, origin);
  requireRealInventoryReadRelease(); // Always throws in this phase, before obtaining any SDK service.
  const app = getApp(`mi-casa-auth-test:${config.projectId}`), auth = getAuth(app);
  if (app.options.projectId !== config.projectId || auth.emulatorConfig) throw new Error('MIXED_INVENTORY_ENVIRONMENT');
  return createCandidateReader(initializeFirestore(app, {}, config.databaseId), auth, config.ownerUid);
}
