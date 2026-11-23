import { getApp } from 'firebase/app';
import { getAuth, signOut } from 'firebase/auth';
import { collection, connectFirestoreEmulator, documentId, getDocs, initializeFirestore, limit, orderBy, query, startAfter, terminate, where } from 'firebase/firestore/lite';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { LOCAL_AUTH_UID, requireLocalAuthentication, type Configuration } from '../../application/configuration';
import { categoryId, inventoryError, InventoryError, LOCAL_CATEGORIES, type InventoryProduct, type LocalInventoryPort } from '../../application/inventory';
import { normalizeName } from '../../domain/policy';

export function decodeInventoryProduct(id: string, data: Record<string, unknown>): InventoryProduct {
  const cat = data.categoryId as keyof typeof LOCAL_CATEGORIES;
  const time = data.updatedAt as { toMillis?: () => number } | undefined;
  const expected = ['name', 'categoryId', 'unit', 'control', 'version', 'updatedAt', data.control === 'exact' ? 'quantityMilli' : 'status'];
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id) || Object.keys(data).length !== expected.length || expected.some(k => !Object.hasOwn(data, k)) ||
      typeof data.name !== 'string' || !data.name.trim() || data.name.length > 100 || !Object.hasOwn(LOCAL_CATEGORIES, cat) ||
      !['unidad', 'kg', 'L'].includes(String(data.unit)) || !Number.isSafeInteger(data.version) || Number(data.version) < 0 || Number(data.version) > 1e9 ||
      !time?.toMillis || !Number.isFinite(time.toMillis())) throw new InventoryError('Hay un producto que no podemos leer. Revisa los datos del laboratorio.');
  const metadata = { id, name: data.name, category: LOCAL_CATEGORIES[cat], unit: data.unit as InventoryProduct['unit'], version: Number(data.version), updatedAtMillis: time.toMillis() };
  if (data.control === 'exact' && Number.isSafeInteger(data.quantityMilli) && Number(data.quantityMilli) >= 0 && Number(data.quantityMilli) <= 1e9 && (data.unit !== 'unidad' || Number(data.quantityMilli) % 1000 === 0)) return { ...metadata, control: 'exact', quantityMilli: Number(data.quantityMilli) };
  if (data.control === 'simple' && ['available', 'low', 'empty'].includes(String(data.status))) return { ...metadata, control: 'simple', status: data.status as 'available' | 'low' | 'empty' };
  throw new InventoryError('Hay una cantidad que no podemos leer. Revisa los datos del laboratorio.');
}
export function createEmulatorInventory(config: Configuration, hostname: string): LocalInventoryPort {
  requireLocalAuthentication(config, hostname);
  if (config.mode !== 'emulator') throw new Error('EMULATOR_INVENTORY_ONLY');
  const app = getApp('mi-casa-auth-local-05b-1'); // Never use the default app or the auth-test app.
  if (app.options.projectId !== config.projectId) throw new Error('MIXED_INVENTORY_PROJECT');
  const auth = getAuth(app);
  if (auth.emulatorConfig?.host !== '127.0.0.1' || auth.emulatorConfig.port !== 9299) throw new Error('LOCAL_AUTH_REQUIRED');
  // Lite uses server-only reads with no offline cache, write queue or WebChannel connectivity probes.
  const db = initializeFirestore(app, {});
  connectFirestoreEmulator(db, '127.0.0.1', 8386);
  const functions = getFunctions(app, 'us-central1');
  connectFunctionsEmulator(functions, '127.0.0.1', 5205);
  const mutate = httpsCallable(functions, 'mutateInventoryExperimental', { timeout: 15000 });
  let disposed = false;
  const authorize = () => {
    if (disposed || auth.currentUser?.uid !== LOCAL_AUTH_UID) throw { code: 'permission-denied' };
  };
  const invalidate = async (error: unknown) => {
    if (/unauthenticated|permission-denied/.test(String((error as { code?: unknown } | null)?.code ?? ''))) await signOut(auth);
  };
  return {
    async page({ cursor, category, search }) {
      try {
        authorize();
        // Bounded scans preserve the existing accent-insensitive substring search without a new schema.
        // At most 100 product docs per request. An unfinished search always returns a continuation.
        const items: InventoryProduct[] = [];
        const filter = category === 'all' ? [] : [where('categoryId', '==', categoryId(category))];
        const snapshot = await getDocs(query(collection(db, 'users', LOCAL_AUTH_UID, 'products'), ...filter,
          orderBy(documentId()), ...(cursor ? [startAfter(cursor)] : []), limit(100)));
        authorize();
        for (const doc of snapshot.docs) {
          const p = decodeInventoryProduct(doc.id, doc.data());
          if (normalizeName(p.name).includes(normalizeName(search))) items.push(p);
        }
        return { items, nextCursor: snapshot.size === 100 ? snapshot.docs.at(-1)!.id : null };
      } catch (error) { await invalidate(error); throw error instanceof InventoryError ? error : inventoryError(error); }
    },
    async mutate(command) {
      try {
        authorize();
        const result = await mutate(command);
        authorize();
        const receipt = result.data as { status?: string; operationId?: string; productId?: string } | null;
        if (!receipt || !['confirmed', 'already-confirmed'].includes(receipt.status ?? '') || receipt.operationId !== command.operationId || receipt.productId !== command.productId) throw new Error('INVALID_RECEIPT');
      } catch (error) { await invalidate(error); throw inventoryError(error, true); }
    },
    async dispose() { disposed = true; await terminate(db); },
  };
}
