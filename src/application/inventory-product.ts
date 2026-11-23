import { InventoryError, LOCAL_CATEGORIES, type InventoryProduct } from './inventory';

// The experimental flat 05C-1 schema only. Proposed 04D/category changes are not migrations.
export function decodeInventoryProduct(id: string, data: Record<string, unknown>): InventoryProduct {
  const cat = data.categoryId as keyof typeof LOCAL_CATEGORIES;
  const time = data.updatedAt as { toMillis?: () => number } | undefined;
  const expected = ['name', 'categoryId', 'unit', 'control', 'version', 'updatedAt', data.control === 'exact' ? 'quantityMilli' : 'status'];
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id) || Object.keys(data).length !== expected.length || expected.some(k => !Object.hasOwn(data, k)) ||
      typeof data.name !== 'string' || !data.name.trim() || data.name.length > 100 || typeof cat !== 'string' || !Object.hasOwn(LOCAL_CATEGORIES, cat) ||
      typeof data.unit !== 'string' || !['unidad', 'kg', 'L'].includes(data.unit) || !Number.isSafeInteger(data.version) || Number(data.version) < 0 || Number(data.version) > 1e9 ||
      typeof time?.toMillis !== 'function' || !Number.isFinite(time.toMillis())) throw new InventoryError('Hay un producto que no podemos leer. Revisa los datos del inventario.');
  const metadata = { id, name: data.name, category: LOCAL_CATEGORIES[cat], unit: data.unit as InventoryProduct['unit'], version: Number(data.version), updatedAtMillis: time.toMillis() };
  if (data.control === 'exact' && Number.isSafeInteger(data.quantityMilli) && Number(data.quantityMilli) >= 0 && Number(data.quantityMilli) <= 1e9 && (data.unit !== 'unidad' || Number(data.quantityMilli) % 1000 === 0)) return { ...metadata, control: 'exact', quantityMilli: Number(data.quantityMilli) };
  if (data.control === 'simple' && typeof data.status === 'string' && ['available', 'low', 'empty'].includes(data.status)) return { ...metadata, control: 'simple', status: data.status as 'available' | 'low' | 'empty' };
  throw new InventoryError('Hay una cantidad que no podemos leer. Revisa los datos del inventario.');
}
