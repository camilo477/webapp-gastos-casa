import type { Auth } from 'firebase/auth';
import { collection, doc, documentId, getDoc, getDocs, limit, orderBy, query, startAfter, terminate, where, type Firestore } from 'firebase/firestore/lite';
import { categoryId, type InventoryProduct } from '../../application/inventory';
import { decodeInventoryProduct } from '../../application/inventory-product';
import { InventoryReadError, inventoryReadError, type InventoryReadPort } from '../../application/inventory-read';
import { normalizeName } from '../../domain/policy';

// Inject an already-configured SDK connection. This module initializes no app or network service.
// Tests use emulators/mocks; the real connection factory remains hard-blocked in 05C-2.
export function createFirestoreInventoryReader(db: Firestore, auth: Auth, ownerUid: string): InventoryReadPort {
  if (db.app !== auth.app || !ownerUid || !db.app.options.projectId) throw new Error('MIXED_INVENTORY_READER_CONTEXT');
  let disposed = false;
  function identity() {
    if (disposed || !auth.currentUser || auth.currentUser.uid !== ownerUid) throw new InventoryReadError('access', 'Tu sesión terminó o no tiene acceso al inventario.');
    return auth.currentUser;
  }
  function decode(id: string, data: Record<string, unknown>) {
    try { return decodeInventoryProduct(id, data); }
    catch { throw new InventoryReadError('contract', 'Hay productos con un formato que todavía no podemos abrir. Pide ayuda para revisar esos datos antes de continuar.'); }
  }
  return {
    async page({ cursor, category, search }) {
      try {
        const user = identity();
        if ((cursor !== null && (typeof cursor !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(cursor))) || typeof search !== 'string' || search.length > 100) throw new InventoryReadError('query', 'Revisa el nombre que quieres buscar y vuelve a consultar.');
        let filter;
        try { filter = category === 'all' ? [] : [where('categoryId', '==', categoryId(category))]; }
        catch { throw new InventoryReadError('query', 'Elige una categoría compatible con el inventario.'); }
        const snapshot = await getDocs(query(collection(db, 'users', user.uid, 'products'), ...filter, orderBy(documentId()), ...(cursor ? [startAfter(cursor)] : []), limit(100)));
        if (identity() !== user) throw new InventoryReadError('access', 'La sesión cambió. Vuelve a consultar el inventario.');
        const items: InventoryProduct[] = snapshot.docs.map(p=>decode(p.id,p.data())).filter(p=>normalizeName(p.name).includes(normalizeName(search)));
        return { items, nextCursor: snapshot.size === 100 ? snapshot.docs.at(-1)!.id : null };
      } catch (error) { throw inventoryReadError(error); }
    },
    async byId(id) {
      try {
        const user = identity();
        if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(id)) throw new InventoryReadError('query', 'No pudimos identificar ese producto.');
        const snapshot = await getDoc(doc(db, 'users', user.uid, 'products', id));
        if (identity() !== user) throw new InventoryReadError('access', 'La sesión cambió. Vuelve a consultar el inventario.');
        return snapshot.exists() ? decode(snapshot.id, snapshot.data()) : null;
      } catch (error) { throw inventoryReadError(error); }
    },
    async dispose() { disposed = true; await terminate(db); },
  };
}
