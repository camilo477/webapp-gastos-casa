import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import type { OperationRepository, OperationTransaction } from '../application/repository.js';
import type { StoredOperation } from '../experimental/types.js';

// Only this adapter knows Admin/Firestore. Business validation remains outside it.
export function firestoreRepository(db: Firestore, uid: string): OperationRepository {
  const product = (id: string) => db.doc(`users/${uid}/products/${id}`);
  const operation = (id: string) => db.doc(`users/${uid}/operations/${id}`);
  return {
    async findOperation(id) {
      const snapshot = await operation(id).get();
      return snapshot.exists ? snapshot.data() as StoredOperation : null;
    },
    transaction<T>(work: (tx: OperationTransaction) => Promise<T>) {
      return db.runTransaction(async tx => work({
        async findOperation(id) {
          const snapshot = await tx.get(operation(id));
          return snapshot.exists ? snapshot.data() as StoredOperation : null;
        },
        async readProducts(ids) {
          const snapshots = ids.length ? await tx.getAll(...ids.map(product)) : [];
          return new Map(snapshots.map(s => [s.id, s.exists ? s.data() : null]));
        },
        createOperation: value => { tx.create(operation(value.operationId), value); },
        writeProduct: (id, value, exists) => { if (exists) tx.set(product(id), value); else tx.create(product(id), value); },
        now: () => Timestamp.now(),
      }), { maxAttempts: 5 });
    },
  };
}
