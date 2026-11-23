import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { PROJECT, requireLab } from './guard.mjs';
import { makeExecutor } from './executor.mjs';

// Deliberate kill switch: this experimental module cannot start against production.
requireLab();
initializeApp({ projectId: PROJECT });
const executor = makeExecutor(getFirestore());
const options = { region: 'us-central1', minInstances: 0, maxInstances: 2, concurrency: 8,
  memory: '256MiB', cpu: 1, timeoutSeconds: 60, enforceAppCheck: false };
export const confirmPurchase = onCall(options, req => executor.confirmPurchase(req.auth, req.data));
export const adjustStock = onCall(options, req => executor.adjustStock(req.auth, req.data));
export const lookupOperation = onCall(options, req => executor.lookupOperation(req.auth, req.data));
