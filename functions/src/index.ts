import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { createExecutor } from './application/executor.js';
import { firestoreRepository } from './adapters/firestore.js';
import { callableResult } from './adapters/callable-errors.js';
import { LOCAL, requireLocal, requireRuntime } from './config/local.js';
import { createInventoryExecutor } from './application/inventory.js';
import { createCandidateExecutor } from './application/inventory-candidate.js';

// Not a deployable production executor. Guards run before any Admin initialization.
requireRuntime(); requireLocal();
const app = initializeApp({ projectId: LOCAL.projectId });
const db = getFirestore(app);
const executor = createExecutor(uid => firestoreRepository(db, uid), LOCAL.uid);
const inventory = createInventoryExecutor(uid => firestoreRepository(db, uid), LOCAL.uid);
const candidate = createCandidateExecutor(uid => firestoreRepository(db, uid), LOCAL.uid);
const options = { region: LOCAL.region, minInstances: 0, maxInstances: 2, concurrency: 8,
  memory: '256MiB' as const, cpu: 1, timeoutSeconds: 60, enforceAppCheck: false };
export const confirmPurchaseExperimental = onCall(options, req => callableResult(() => executor.confirmPurchase(req.auth, req.data)));
export const adjustStockExperimental = onCall(options, req => callableResult(() => executor.adjustStock(req.auth, req.data)));
export const lookupOperationExperimental = onCall(options, req => callableResult(() => executor.lookupOperation(req.auth, req.data)));
export const mutateInventoryExperimental = onCall(options, req => callableResult(() => inventory(req.auth, req.data)));
export const mutateInventoryCandidate = onCall(options, req => callableResult(() => candidate(req.auth, req.data)));
