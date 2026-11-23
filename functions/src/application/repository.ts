import type { StoredOperation, StoredProduct, TimeValue } from '../experimental/types.js';
import type { Product } from '@mi-casa/inventory-contract';

export interface OperationTransaction {
  findOperation(operationId: string): Promise<StoredOperation | null>;
  readProducts(ids: string[]): Promise<ReadonlyMap<string, unknown | null>>;
  createOperation(operation: StoredOperation): void;
  writeProduct(id: string, product: StoredProduct | Product<TimeValue>, exists: boolean): void;
  now(): TimeValue;
}
export interface OperationRepository {
  transaction<T>(work: (tx: OperationTransaction) => Promise<T>): Promise<T>;
  findOperation(operationId: string): Promise<StoredOperation | null>;
}
