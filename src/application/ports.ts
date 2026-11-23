// Application boundaries only. DTO generics await functional DP approval.
// No Firebase SDK or React imports. Production providers and data persistence await approval.
export type Session = { uid: string } | null;
export type SessionOptions = Readonly<{ mode: 'emulator' | 'auth-test'; methods: readonly ('password' | 'google')[] }>;
export type SessionState = { scope: number } & (
  { status: 'checking' } | { status: 'anonymous'; message?: string } |
  { status: 'authenticated'; session: NonNullable<Session> } | { status: 'error'; message: string }
);
export type SignInRequest = { method: 'password'; email: string; password: string } | { method: 'google' };
export interface SessionPort {
  readonly options: SessionOptions;
  current(): SessionState;
  subscribe(listener: () => void): () => void;
  signIn(request: SignInRequest): Promise<void>;
  signOut(): Promise<void>;
  recheck(): Promise<void>;
  dispose(): Promise<void>;
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
