import { doc, getDocFromServer, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { requireEmulators, UID } from './guard.mjs';
import { transition, storedIntent, stable } from './model.mjs';

export const refs = (db, id, uid = UID) => ({ state: doc(db, `users/${uid}/state/current`),
  operation: doc(db, `users/${uid}/operations/${id}`) });
export function wire(result) {
  const next = { ...result.next, updatedAt: serverTimestamp() };
  const operation = { ...result.operation, createdAt: serverTimestamp() };
  if (operation.kind === 'purchase') operation.purchaseDate = Timestamp.fromDate(new Date(`${operation.purchaseDate}T00:00:00Z`));
  return { next, operation };
}
export async function confirm(db, input, hooks = {}) {
  requireEmulators();
  const r = refs(db, input.operationId);
  return runTransaction(db, async tx => {
    const op = await tx.get(r.operation);
    if (op.exists()) {
      if (stable(storedIntent(op.data())) !== stable(input)) throw new Error('IDEMPOTENCY_CONFLICT');
      return 'already-confirmed';
    }
    const state = await tx.get(r.state);
    if (!state.exists()) throw new Error('MISSING_STATE');
    const result = wire(transition(state.data(), input));
    await hooks.beforeWrite?.();
    tx.set(r.operation, result.operation); tx.set(r.state, result.next);
    return 'confirmed';
  });
}
export async function reconcile(db, receipt) {
  requireEmulators();
  if (receipt.uid !== UID || receipt.operationId !== receipt.intent.operationId) throw new Error('RECEIPT_IDENTITY');
  const snapshot = await getDocFromServer(refs(db, receipt.operationId).operation);
  if (!snapshot.exists()) return 'absent-at-server'; // A pending sender may still commit: absence is not a final cancellation.
  if (stable(storedIntent(snapshot.data())) !== stable(receipt.intent)) throw new Error('IDEMPOTENCY_CONFLICT');
  return 'confirmed-at-server';
}
