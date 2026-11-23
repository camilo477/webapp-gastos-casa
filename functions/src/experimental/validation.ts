import type { AdjustmentIntent, Intent, Line, PhysicalLine, ProductMetadata, PurchaseIntent, StoredProduct } from './types.js';

export class ValidationError extends Error {}
export class ConflictError extends Error {}
export function ensure(condition: unknown, code = 'INVALID_CONTRACT'): asserts condition {
  if (!condition) throw new ValidationError(code);
}
export function keys(value: unknown, expected: string[]): asserts value is Record<string, unknown> {
  ensure(value !== null && typeof value === 'object' && !Array.isArray(value));
  ensure(Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  ensure(Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key)));
}
export function integer(value: unknown, min = 0, max = 1_000_000_000): number {
  ensure(typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max, 'INVALID_NUMBER');
  return value;
}
export function id(value: unknown): asserts value is string {
  ensure(typeof value === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value), 'INVALID_ID');
}
function text(value: unknown): asserts value is string {
  ensure(typeof value === 'string' && value.trim().length > 0 && value.length <= 100, 'INVALID_TEXT');
}
function oneOf(value: unknown, allowed: readonly string[]) { ensure(typeof value === 'string' && allowed.includes(value)); }
export function stable(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value !== null && typeof value === 'object') {
    const r = value as Record<string, unknown>;
    return '{' + Object.keys(r).sort().map(k => JSON.stringify(k) + ':' + stable(r[k])).join(',') + '}';
  }
  const result = JSON.stringify(value); ensure(result !== undefined); return result;
}
export function metadata(p: ProductMetadata): ProductMetadata {
  return { name: p.name, categoryId: p.categoryId, control: p.control, unit: p.unit };
}
export function lineMetadata(l: PhysicalLine): ProductMetadata {
  return { name: l.name, categoryId: l.categoryId, control: l.control, unit: l.baseUnit };
}
export function parseProduct(value: unknown): StoredProduct {
  ensure(value !== null && typeof value === 'object');
  const control = (value as Record<string, unknown>).control;
  keys(value, ['name', 'categoryId', 'control', 'unit', 'version', 'updatedAt', control === 'exact' ? 'quantityMilli' : 'status']);
  text(value.name); oneOf(value.categoryId, ['food', 'cleaning', 'service']);
  oneOf(value.unit, ['unidad', 'kg', 'L']); oneOf(control, ['exact', 'simple']); integer(value.version);
  const time = value.updatedAt as { toMillis?: unknown } | null;
  ensure(time && typeof time.toMillis === 'function', 'INVALID_PRODUCT_TIMESTAMP');
  if (control === 'exact') { const amount = integer(value.quantityMilli); ensure(value.unit !== 'unidad' || amount % 1000 === 0); }
  else oneOf(value.status, ['available', 'low', 'empty']);
  return value as unknown as StoredProduct;
}
export function delta(l: PhysicalLine, p: Pick<ProductMetadata, 'unit'>): number {
  ensure(l.unit === p.unit || (l.unit === 'g' && p.unit === 'kg') || (l.unit === 'ml' && p.unit === 'L'), 'INCOMPATIBLE_UNIT');
  const amount = l.unit === 'g' || l.unit === 'ml' ? l.quantityMilli / 1000 : l.quantityMilli;
  integer(amount, 1); ensure(p.unit !== 'unidad' || amount % 1000 === 0, 'FRACTIONAL_UNIT'); return amount;
}
export function net(l: Line): number {
  integer(l.priceCOP, 0, 1_000_000); integer(l.discountCOP);
  const gross = l.kind === 'expense' || l.priceMode === 'total' ? BigInt(l.priceCOP) :
    (BigInt(l.priceCOP) * BigInt(l.quantityMilli) + 500n) / 1000n;
  ensure(BigInt(l.discountCOP) <= gross, 'INVALID_DISCOUNT'); return integer(Number(gross - BigInt(l.discountCOP)));
}
function parseLine(value: unknown): Line {
  ensure(value !== null && typeof value === 'object');
  const kind = (value as Record<string, unknown>).kind; oneOf(kind, ['product', 'expense']);
  const base = ['id', 'kind', 'name', 'categoryId', 'priceCOP', 'discountCOP'];
  keys(value, kind === 'expense' ? base : [...base, 'productId', 'newProduct', 'control', 'baseUnit', 'quantityMilli', 'unit', 'priceMode', 'stockStatus']);
  id(value.id); text(value.name); oneOf(value.categoryId, ['food', 'cleaning', 'service']);
  if (kind === 'product') {
    id(value.productId); ensure(typeof value.newProduct === 'boolean'); oneOf(value.control, ['exact', 'simple']);
    oneOf(value.baseUnit, ['unidad', 'kg', 'L']); oneOf(value.unit, ['unidad', 'kg', 'L', 'g', 'ml']);
    oneOf(value.priceMode, ['unit', 'total']); oneOf(value.stockStatus, ['available', 'low', 'empty']); integer(value.quantityMilli, 1);
    const physical = value as unknown as PhysicalLine; delta(physical, { unit: physical.baseUnit });
  }
  const line = value as unknown as Line; net(line); return line;
}
export function parsePurchase(value: unknown): PurchaseIntent {
  keys(value, ['schemaVersion', 'operationId', 'kind', 'date', 'store', 'reviewedTotalCOP', 'lines']);
  ensure(value.schemaVersion === 1 && value.kind === 'purchase'); id(value.operationId); text(value.store);
  ensure(typeof value.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.date));
  const parsed = new Date(`${value.date}T00:00:00Z`);
  ensure(Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value.date, 'INVALID_DATE');
  ensure(Array.isArray(value.lines) && value.lines.length > 0 && value.lines.length <= 100, 'INVALID_LINE_COUNT');
  const lines = value.lines.map(parseLine); ensure(new Set(lines.map(l => l.id)).size === lines.length, 'DUPLICATE_LINE_ID');
  integer(value.reviewedTotalCOP);
  ensure(total(lines) === value.reviewedTotalCOP, 'TOTAL_MISMATCH');
  return value as unknown as PurchaseIntent;
}
export function parseAdjustment(value: unknown): AdjustmentIntent {
  keys(value, ['schemaVersion', 'operationId', 'kind', 'productId', 'expectedVersion', 'after']);
  ensure(value.schemaVersion === 1 && value.kind === 'stockAdjust'); id(value.operationId); id(value.productId); integer(value.expectedVersion);
  if (typeof value.after === 'number') integer(value.after); else oneOf(value.after, ['available', 'low', 'empty']);
  return value as unknown as AdjustmentIntent;
}
export function total(lines: Line[]): number { return lines.reduce((sum, l) => integer(sum + net(l)), 0); }
export function productIds(intent: Intent): string[] {
  return intent.kind === 'purchase' ? [...new Set(intent.lines.filter(l => l.kind === 'product').map(l => l.productId))] : [intent.productId];
}
// Same conservative document-size estimator as 04C, not a wire-size guarantee.
export function documentBytes(path: string, value: unknown): number {
  const stringBytes = (s: string) => Buffer.byteLength(s, 'utf8') + 1;
  function size(v: unknown): number {
    if (v === null || typeof v === 'boolean') return 1;
    if (typeof v === 'number' || v instanceof Date || (typeof v === 'object' && typeof (v as { toMillis?: unknown }).toMillis === 'function')) return 8;
    if (typeof v === 'string') return stringBytes(v);
    if (Array.isArray(v)) return v.reduce((sum: number, item: unknown) => sum + size(item), 0);
    ensure(v && typeof v === 'object');
    return 32 + Object.entries(v).reduce((sum, [key, item]) => sum + stringBytes(key) + size(item), 0);
  }
  return path.split('/').reduce((sum, p) => sum + stringBytes(p), 16) + size(value);
}
