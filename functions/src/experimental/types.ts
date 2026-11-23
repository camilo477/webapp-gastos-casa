// 04C parameters, NOT approval of DP-02/03/04/05/06/08/09/10/12/13.
// Deliberately separate from both React's demo types and the unapproved 04D proposal.
export type BaseUnit = 'unidad' | 'kg' | 'L';
export type Unit = BaseUnit | 'g' | 'ml';
export type Status = 'available' | 'low' | 'empty';
export type Category = 'food' | 'cleaning' | 'service';
export type TimeValue = { toMillis(): number };
export type ProductMetadata = { name: string; categoryId: Category; control: 'exact' | 'simple'; unit: BaseUnit };
export type StoredProduct = ProductMetadata & { version: number; updatedAt: TimeValue } & (
  { control: 'exact'; quantityMilli: number } | { control: 'simple'; status: Status }
);
type MoneyLine = { id: string; name: string; categoryId: Category; priceCOP: number; discountCOP: number };
export type PhysicalLine = MoneyLine & {
  kind: 'product'; productId: string; newProduct: boolean; control: 'exact' | 'simple';
  baseUnit: BaseUnit; quantityMilli: number; unit: Unit; priceMode: 'unit' | 'total'; stockStatus: Status;
};
export type ExpenseLine = MoneyLine & { kind: 'expense' };
export type Line = PhysicalLine | ExpenseLine;
export type PurchaseIntent = {
  schemaVersion: 1; operationId: string; kind: 'purchase'; date: string; store: string;
  reviewedTotalCOP: number; lines: Line[];
};
export type AdjustmentIntent = {
  schemaVersion: 1; operationId: string; kind: 'stockAdjust'; productId: string; expectedVersion: number; after: number | Status;
};
export type Intent = PurchaseIntent | AdjustmentIntent;
export type Movement = {
  id: string; productId: string; lineId?: string; kind: 'purchase' | 'adjustment';
  before: number | Status; after: number | Status; unit: BaseUnit;
};
export type StoredOperation = {
  schemaVersion: 1; operationId: string; kind: Intent['kind']; intentHash: string;
  createdAt: TimeValue; productIds: string[]; movements: Movement[];
} & (
  { kind: 'purchase'; date: string; store: string; lines: (Line & { netCOP: number })[]; totalPaidCOP: number }
  | { kind: 'stockAdjust'; productId: string; expectedVersion: number; after: number | Status }
);
export type OperationReceipt = {
  status: 'confirmed' | 'already-confirmed'; operationId: string; intentHash: string; totalPaidCOP: number;
};
