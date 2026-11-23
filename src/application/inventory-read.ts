import type { InventoryProduct, LocalInventoryPort } from './inventory';
import { DomainError } from '../domain/validation';

export type InventoryReadRequest = Parameters<LocalInventoryPort['page']>[0];
// Intentionally no mutation capability and no dependency on Functions.
export interface InventoryReadPort {
  page(request: InventoryReadRequest): ReturnType<LocalInventoryPort['page']>;
  byId(id: string): Promise<InventoryProduct | null>;
  dispose(): Promise<void>;
}
export class InventoryReadError extends DomainError {
  constructor(readonly reason: 'access' | 'connection' | 'contract' | 'query', message: string) { super(message); }
}
export function inventoryReadError(error: unknown): InventoryReadError {
  if (error instanceof InventoryReadError) return error;
  const code = String((error as { code?: unknown } | null)?.code ?? '');
  if (code.includes('permission-denied')) return new InventoryReadError('access', 'Esta cuenta no tiene permiso para consultar el inventario. Pide ayuda para revisar el acceso.');
  if (code.includes('unauthenticated')) return new InventoryReadError('access', 'Tu sesión terminó. Vuelve a ingresar antes de consultar los productos.');
  return new InventoryReadError('connection', 'No pudimos cargar los productos. Comprueba la conexión y vuelve a intentarlo.');
}
