import { createHash } from 'node:crypto';
import type { Intent, OperationReceipt, StoredOperation } from '../experimental/types.js';
import { plan } from '../experimental/plan.js';
import { ConflictError, documentBytes, ensure, id, keys, parseAdjustment, parsePurchase, productIds, stable, total } from '../experimental/validation.js';
import type { OperationRepository } from './repository.js';

export class AccessError extends Error {
  constructor(public readonly code: 'unauthenticated' | 'permission-denied') { super(code === 'unauthenticated' ? 'AUTH_REQUIRED' : 'UID_NOT_ALLOWED'); }
}
export type Identity = { uid: string } | null | undefined;
export function authorize(auth: Identity, allowedUid: string): string {
  if (!auth) throw new AccessError('unauthenticated');
  if (auth.uid !== allowedUid) throw new AccessError('permission-denied');
  return auth.uid;
}
export function intentHash(intent: Intent): string { return createHash('sha256').update(stable(intent)).digest('hex'); }
export function createExecutor(repositoryFor: (uid: string) => OperationRepository, allowedUid: string) {
  async function execute(auth: Identity, input: unknown, kind: Intent['kind']): Promise<OperationReceipt> {
    const uid = authorize(auth, allowedUid);
    // Clone only after the wire-size bound. A caller cannot mutate input during await/retries.
    const serialized = JSON.stringify({ data: input });
    ensure(Buffer.byteLength(serialized) <= 262144, 'REQUEST_TOO_LARGE');
    const frozenInput: unknown = structuredClone(input);
    const intent = kind === 'purchase' ? parsePurchase(frozenInput) : parseAdjustment(frozenInput);
    const hash = intentHash(intent), paid = intent.kind === 'purchase' ? total(intent.lines) : 0;
    const repo = repositoryFor(uid);
    return repo.transaction(async tx => {
      const existing = await tx.findOperation(intent.operationId);
      if (existing) {
        if (existing.intentHash !== hash) throw new ConflictError('IDEMPOTENCY_CONFLICT');
        return { status: 'already-confirmed', operationId: intent.operationId, intentHash: hash,
          totalPaidCOP: existing.kind === 'purchase' ? existing.totalPaidCOP : 0 };
      }
      const ids = productIds(intent);
      const originals = await tx.readProducts(ids); // All reads precede every write.
      const now = tx.now();
      const { changed, movements, lines } = plan(intent, originals, now);
      const common = { schemaVersion: 1 as const, operationId: intent.operationId, intentHash: hash, createdAt: now, productIds: ids, movements };
      const operation: StoredOperation = intent.kind === 'purchase' ?
        { ...common, kind: 'purchase', date: intent.date, store: intent.store, lines, totalPaidCOP: paid } :
        { ...common, kind: 'stockAdjust', productId: intent.productId, expectedVersion: intent.expectedVersion, after: intent.after };
      ensure(documentBytes(`users/${uid}/operations/${intent.operationId}`, operation) <= 900000, 'DOCUMENT_TOO_LARGE');
      ensure(changed.size + 1 <= 101, 'TOO_MANY_WRITES');
      for (const [key, p] of changed) ensure(documentBytes(`users/${uid}/products/${key}`, p) <= 1048576, 'PRODUCT_TOO_LARGE');
      // No external effects, IDs, or logs in a callback that Firestore may retry.
      for (const [key, p] of changed) tx.writeProduct(key, p, originals.get(key) != null);
      tx.createOperation(operation);
      return { status: 'confirmed', operationId: intent.operationId, intentHash: hash, totalPaidCOP: paid };
    });
  }
  return {
    confirmPurchase: (auth: Identity, input: unknown) => execute(auth, input, 'purchase'),
    adjustStock: (auth: Identity, input: unknown) => execute(auth, input, 'stockAdjust'),
    async lookupOperation(auth: Identity, input: unknown) {
      const uid = authorize(auth, allowedUid); keys(input, ['operationId']); id(input.operationId);
      const existing = await repositoryFor(uid).findOperation(input.operationId);
      return existing ? { status: 'confirmed' as const, operationId: input.operationId, intentHash: existing.intentHash,
        totalPaidCOP: existing.kind === 'purchase' ? existing.totalPaidCOP : 0 } :
        { status: 'absent-at-server' as const, operationId: input.operationId };
    },
  };
}
