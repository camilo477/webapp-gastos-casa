export type BaseUnit = 'unidad' | 'kg' | 'L';
export type Unit = BaseUnit | 'g' | 'ml';
export type StockStatus = 'available' | 'low' | 'empty';
export type ProductInput = {
  name: string; category: string; control: 'exact' | 'simple'; unit: BaseUnit;
  initialQuantityMilli: number; initialStatus: StockStatus;
};
export type Product = { id: string; name: string; category: string; unit: BaseUnit } & (
  { control: 'exact'; quantityMilli: number } | { control: 'simple'; status: StockStatus }
);
export type PurchaseLine = {
  id: string; kind: 'product' | 'expense'; name: string; category: string;
  productId?: string; newProduct?: ProductInput;
  quantityMilli: number; unit: Unit; priceCOP: number; priceMode: 'unit' | 'total'; discountCOP: number;
  source: 'receipt' | 'manual'; reviewReason?: string; stockStatus: StockStatus;
};
export type Purchase = {
  id: string; store: string; date: string; lines: PurchaseLine[]; source: 'manual' | 'simulation' | 'seed';
};
export type Draft = Purchase & {
  dirty: boolean; referenceTotalCOP?: number; reviewedTotalCOP?: number;
};
export type Movement = {
  id: string; productId: string; productName: string; kind: 'purchase' | 'consumption' | 'adjustment';
  before: number | StockStatus; after: number | StockStatus; unit: BaseUnit;
  description: string; purchaseId?: string;
};
export type ShoppingItem = { id: string; name: string; quantityMilli: number; unit: Unit; purchased: boolean };
export type ShoppingList = { id: string; name: string; items: ShoppingItem[] };
export type DomainState = {
  products: Product[]; purchases: Purchase[]; movements: Movement[];
  draft: Draft | null; list: ShoppingList | null; lastConfirmedId: string | null;
};
export type Command =
  | { type: 'startDraft'; draft: Draft }
  | { type: 'metadata'; store: string; date: string }
  | { type: 'touchDraft' }
  | { type: 'putLine'; line: PurchaseLine }
  | { type: 'removeLine'; id: string }
  | { type: 'resolveLine'; id: string }
  | { type: 'acceptTotal' }
  | { type: 'discardDraft' }
  | { type: 'confirm'; id: string }
  | { type: 'createProduct'; id: string; input: ProductInput }
  | { type: 'editProduct'; id: string; operationId: string; name: string; category: string }
  | { type: 'adjust'; id: string; productId: string; operation: 'set' | 'add' | 'consume'; quantityMilli: number }
  | { type: 'stockStatus'; id: string; productId: string; status: StockStatus }
  | { type: 'createList'; id: string; name: string }
  | { type: 'putListItem'; item: ShoppingItem }
  | { type: 'toggleListItem'; id: string }
  | { type: 'removeListItem'; id: string }
  | { type: 'finishList' };
