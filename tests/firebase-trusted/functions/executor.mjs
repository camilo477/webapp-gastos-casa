import { createHash } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { UID } from './guard.mjs';
import { ValidationError, ensure, stable, validatePurchase, validateAdjustment, product, metadata, lineMetadata, delta, integer, net, documentBytes, keys, id } from './contract.mjs';

function authorized(auth) {
  if (!auth) throw new HttpsError('unauthenticated', 'AUTH_REQUIRED');
  if (auth.uid !== UID) throw new HttpsError('permission-denied', 'UID_NOT_ALLOWED');
  return auth.uid;
}
const hash = value => createHash('sha256').update(stable(value)).digest('hex');
export function makeExecutor(db) {
  const ref = (uid, collection, key) => db.doc(`users/${uid}/${collection}/${key}`);
  async function execute(auth, input, kind) {
    const uid = authorized(auth), start = performance.now();
    try {
      const requestBytes = Buffer.byteLength(JSON.stringify({ data: input }));
      ensure(requestBytes <= 262144, 'REQUEST_TOO_LARGE');
      const total = kind === 'purchase' ? validatePurchase(input) : (validateAdjustment(input), 0);
      const intentHash = hash(input), operationRef = ref(uid, 'operations', input.operationId);
      let attempts = 0, reads = 0, submittedWrites = 0;
      const result = await db.runTransaction(async tx => {
        attempts++;
        reads++; const existing = await tx.get(operationRef);
        if (existing.exists) {
          if (existing.data().intentHash !== intentHash) throw new HttpsError('already-exists', 'IDEMPOTENCY_CONFLICT');
          return { status: 'already-confirmed', operationId: input.operationId, intentHash, totalPaidCOP: existing.data().totalPaidCOP ?? 0, committedWrites: 0, operationBytes: documentBytes(operationRef.path, existing.data()), productBytes: 0 };
        }
        const productIds = kind === 'purchase' ? [...new Set(input.lines.filter(l => l.kind === 'product').map(l => l.productId))] : [input.productId];
        const refs = productIds.map(key => ref(uid, 'products', key));
        // Every read precedes every write, including missing/new products.
        const snapshots = refs.length ? await tx.getAll(...refs) : []; reads += snapshots.length;
        const original = new Map(snapshots.map(s => [s.id, s.exists ? s.data() : null]));
        const changed = new Map(); const movements = []; const lines = [];
        const now = Timestamp.now();
        if (kind === 'purchase') {
          for (const l of input.lines) {
            lines.push({ ...l, netCOP: net(l) });
            if (l.kind === 'expense') continue;
            const prior = original.get(l.productId);
            if (l.newProduct !== !prior) throw new HttpsError('failed-precondition', 'PRODUCT_EXISTENCE_CHANGED');
            let p = changed.get(l.productId);
            if (!p) {
              p = prior ? { ...prior } : { ...lineMetadata(l), version: 0, updatedAt: now,
                ...(l.control === 'exact' ? { quantityMilli: 0 } : { status: 'empty' }) };
              product(p); changed.set(l.productId, p);
            }
            if (stable(metadata(p)) !== stable(lineMetadata(l))) throw new HttpsError('failed-precondition', 'PRODUCT_IDENTITY_CHANGED');
            const before = p.control === 'exact' ? p.quantityMilli : p.status;
            const quantity = delta(l, p);
            if (p.control === 'exact') p.quantityMilli = integer(p.quantityMilli + quantity);
            else p.status = l.stockStatus;
            movements.push({ id: `purchase:${input.operationId}:${l.id}`, lineId: l.id, productId: l.productId,
              kind: 'purchase', before, after: p.control === 'exact' ? p.quantityMilli : p.status, unit: p.unit });
          }
        } else {
          const p = original.get(input.productId);
          if (!p || p.version !== input.expectedVersion) throw new HttpsError('failed-precondition', 'STALE_ADJUSTMENT');
          product(p);
          const n = { ...p, ...(p.control === 'exact' ? { quantityMilli: input.after } : { status: input.after }) };
          product(n); changed.set(input.productId, n);
          movements.push({ id: `adjust:${input.operationId}`, productId: input.productId, kind: 'adjustment',
            before: p.control === 'exact' ? p.quantityMilli : p.status, after: input.after, unit: p.unit });
        }
        const operation = { schemaVersion: 1, operationId: input.operationId, kind, intentHash, createdAt: now, productIds, movements,
          ...(kind === 'purchase' ? { date: input.date, store: input.store, lines, totalPaidCOP: total } :
            { productId: input.productId, expectedVersion: input.expectedVersion, after: input.after }) };
        const operationBytes = documentBytes(operationRef.path, operation);
        ensure(operationBytes <= 900000, 'DOCUMENT_TOO_LARGE');
        let productBytes = 0;
        for (const [key, p] of changed) {
          p.version = integer((original.get(key)?.version ?? -1) + 1); p.updatedAt = now;
          product(p); const bytes = documentBytes(ref(uid, 'products', key).path, p);
          ensure(bytes <= 1048576, 'PRODUCT_TOO_LARGE'); productBytes += bytes;
        }
        ensure(changed.size + 1 <= 101, 'TOO_MANY_WRITES');
        // No external effects, log payloads or generated identities in this callback.
        for (const [key, p] of changed) {
          if (original.get(key)) tx.set(ref(uid, 'products', key), p);
          else tx.create(ref(uid, 'products', key), p);
        }
        tx.create(operationRef, operation); submittedWrites += changed.size + 1;
        return { status: 'confirmed', operationId: input.operationId, intentHash, totalPaidCOP: total,
          committedWrites: changed.size + 1, operationBytes, productBytes };
      }, { maxAttempts: 5 });
      return { ...result, metrics: { attempts, retries: attempts - 1, documentReads: reads, submittedWrites,
        committedWrites: result.committedWrites, requestBytes, operationBytes: result.operationBytes,
        changedProductBytes: result.productBytes, elapsedMs: Math.round((performance.now() - start) * 100) / 100 } };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      if (error instanceof ValidationError) throw new HttpsError('invalid-argument', error.message);
      // Never echo database errors or the caller's financial payload to logs/errors.
      throw new HttpsError('aborted', 'TRANSACTION_NOT_CONFIRMED');
    }
  }
  return {
    confirmPurchase: (auth, input) => execute(auth, input, 'purchase'),
    adjustStock: (auth, input) => execute(auth, input, 'stockAdjust'),
    async lookupOperation(auth, input) {
      const uid = authorized(auth);
      try { keys(input, ['operationId']); id(input.operationId); }
      catch { throw new HttpsError('invalid-argument', 'INVALID_LOOKUP'); }
      const s = await ref(uid, 'operations', input.operationId).get();
      return s.exists ? { status: 'confirmed', operationId: s.id, intentHash: s.data().intentHash, totalPaidCOP: s.data().totalPaidCOP ?? 0 } : { status: 'absent-at-server', operationId: input.operationId };
    },
  };
}
