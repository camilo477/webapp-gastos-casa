import type { Product, ProductInput, StockStatus } from '../domain/types';
import { DomainError } from '../domain/validation';

export const LOCAL_CATEGORIES = { food: 'Alimentos', cleaning: 'Limpieza', service: 'Servicios' } as const;
export type CategoryId = keyof typeof LOCAL_CATEGORIES;
export type InventoryProduct = Product & { version: number; updatedAtMillis: number; presentation?:string|null };
type Common = { schemaVersion: 1; operationId: string; productId: string };
export type InventoryCommand = Common & (
  { kind: 'inventoryCreate'; product: { name: string; categoryId: CategoryId; unit: Product['unit'] } &
    ({ control: 'exact'; quantityMilli: number } | { control: 'simple'; status: StockStatus }) }
  | { kind: 'inventoryEdit'; expectedVersion: number; name: string; categoryId: CategoryId }
  | { kind: 'inventoryAdjust'; expectedVersion: number; action: 'add' | 'consume' | 'set'; value: number | StockStatus }
);
export interface LocalInventoryPort {
  page(request: { cursor: string | null; category: string; search: string }): Promise<{ items: InventoryProduct[]; nextCursor: string | null }>;
  mutate(command: InventoryCommand): Promise<void>;
  dispose(): Promise<void>;
}
export class InventoryError extends DomainError {
  constructor(message: string, readonly uncertain = false) { super(message); }
}
export function inventoryError(error: unknown, writing = false): InventoryError {
  const code = String((error as { code?: unknown } | null)?.code ?? '');
  if (/unauthenticated|permission-denied/.test(code)) return new InventoryError('Tu sesión terminó o no tiene acceso. Cierra la sesión y vuelve a ingresar.');
  if (/failed-precondition|already-exists/.test(code)) return new InventoryError('Este producto cambió en otra ventana. Vuelve sin cambiar y pulsa Actualizar productos antes de intentarlo otra vez.');
  if (/invalid-argument/.test(code)) return new InventoryError('Revisa los datos y las cantidades. No pueden quedar existencias negativas ni fracciones de una unidad.');
  return new InventoryError(writing ? 'No pudimos comprobar si se guardó. Pulsa Reintentar guardado; no volveremos a aplicar el mismo cambio dos veces.' : 'No pudimos cargar los productos. Comprueba la conexión local y vuelve a intentarlo.', writing);
}
export function categoryId(label: string): CategoryId {
  const found = (Object.keys(LOCAL_CATEGORIES) as CategoryId[]).find(key => LOCAL_CATEGORIES[key] === label);
  if (!found) throw new InventoryError('Elige una categoría del laboratorio.');
  return found;
}
export function createProductCommand(operationId: string, productId: string, input: ProductInput): InventoryCommand {
  const metadata = { name: input.name, categoryId: categoryId(input.category), unit: input.unit };
  return { schemaVersion: 1, operationId, productId, kind: 'inventoryCreate', product: input.control === 'exact' ?
    { ...metadata, control: 'exact', quantityMilli: input.initialQuantityMilli } : { ...metadata, control: 'simple', status: input.initialStatus } };
}
