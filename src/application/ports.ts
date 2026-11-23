// Application boundaries only. DTO generics await functional DP approval.
// No Firebase SDK, provider choice, persistence policy or React imports here.
export type Session = { uid: string } | null;
export interface SessionPort {
  current(): Promise<Session>;
  subscribe(listener: (session: Session) => void): () => void;
  signOut(): Promise<void>;
}
export type Page<T> = { items: readonly T[]; nextCursor: string | null };
export type PageRequest = { limit: number; cursor: string | null };
export interface InventoryPort<TProduct> {
  page(request: PageRequest): Promise<Page<TProduct>>;
  byId(id: string): Promise<TProduct | null>;
}
export interface PurchasePort<TIntent, TResult> { confirm(intent: TIntent): Promise<TResult> }
export interface OperationResultPort<TResult> { byId(operationId: string): Promise<TResult> }
export interface HistoryPort<TPurchase, TFilter> { page(filter: TFilter, request: PageRequest): Promise<Page<TPurchase>> }
export type PendingKey = { environment: string; projectId: string; uid: string; operationId: string };
export interface PendingOperationsPort<TPending> {
  get(key: PendingKey): Promise<TPending | null>;
  put(key: PendingKey, operation: TPending): Promise<void>;
  remove(key: PendingKey): Promise<void>;
}
export type ApplicationPorts<TProduct, TIntent, TResult, TPurchase, TFilter, TPending> = {
  session: SessionPort; inventory: InventoryPort<TProduct>; purchases: PurchasePort<TIntent, TResult>;
  results: OperationResultPort<TResult>; history: HistoryPort<TPurchase, TFilter>;
  pending: PendingOperationsPort<TPending>;
};
