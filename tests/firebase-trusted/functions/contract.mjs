// Provisional laboratory parameters, not approval of DP-02/03/04/05/06/13.
export class ValidationError extends Error {}
export function ensure(ok, message = 'INVALID_CONTRACT') { if (!ok) throw new ValidationError(message); }
export function keys(value, expected) {
  ensure(value && typeof value === 'object' && !Array.isArray(value));
  ensure(Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key)));
}
export function integer(value, min = 0, max = 1_000_000_000) {
  ensure(Number.isSafeInteger(value) && value >= min && value <= max, 'INVALID_NUMBER'); return value;
}
export function id(value) { ensure(typeof value === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value), 'INVALID_ID'); }
function text(value) { ensure(typeof value === 'string' && value.trim().length > 0 && value.length <= 100, 'INVALID_TEXT'); }
export const statuses = ['available', 'low', 'empty'];
function category(value) { ensure(['food', 'cleaning', 'service'].includes(value), 'INVALID_CATEGORY'); }
export function stable(value) {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
export function metadata(p) { return { name: p.name, categoryId: p.categoryId, control: p.control, unit: p.unit }; }
export function lineMetadata(l) { return { name: l.name, categoryId: l.categoryId, control: l.control, unit: l.baseUnit }; }
export function product(p) {
  keys(p, ['name', 'categoryId', 'control', 'unit', 'version', 'updatedAt', p.control === 'exact' ? 'quantityMilli' : 'status']);
  text(p.name); category(p.categoryId); ensure(['unidad', 'kg', 'L'].includes(p.unit));
  ensure(['exact', 'simple'].includes(p.control)); integer(p.version);
  ensure(p.updatedAt && typeof p.updatedAt.toMillis === 'function', 'INVALID_PRODUCT_TIMESTAMP');
  if (p.control === 'exact') { integer(p.quantityMilli); ensure(p.unit !== 'unidad' || p.quantityMilli % 1000 === 0); }
  else ensure(statuses.includes(p.status));
}
export function delta(l, p) {
  ensure(l.unit === p.unit || (l.unit === 'g' && p.unit === 'kg') || (l.unit === 'ml' && p.unit === 'L'), 'INCOMPATIBLE_UNIT');
  const amount = ['g', 'ml'].includes(l.unit) ? l.quantityMilli / 1000 : l.quantityMilli;
  integer(amount, 1); ensure(p.unit !== 'unidad' || amount % 1000 === 0, 'FRACTIONAL_UNIT'); return amount;
}
export function net(l) {
  integer(l.priceCOP, 0, 1_000_000); integer(l.discountCOP);
  const gross = l.kind === 'expense' || l.priceMode === 'total' ? BigInt(l.priceCOP) :
    (BigInt(l.priceCOP) * BigInt(l.quantityMilli) + 500n) / 1000n;
  ensure(BigInt(l.discountCOP) <= gross, 'INVALID_DISCOUNT'); return integer(Number(gross - BigInt(l.discountCOP)));
}
export function validatePurchase(input) {
  keys(input, ['schemaVersion', 'operationId', 'kind', 'date', 'store', 'reviewedTotalCOP', 'lines']);
  ensure(input.schemaVersion === 1 && input.kind === 'purchase'); id(input.operationId); text(input.store);
  ensure(typeof input.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.date));
  const parsed = new Date(`${input.date}T00:00:00Z`);
  ensure(Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === input.date, 'INVALID_DATE');
  ensure(Array.isArray(input.lines) && input.lines.length > 0 && input.lines.length <= 100, 'INVALID_LINE_COUNT');
  integer(input.reviewedTotalCOP);
  const ids = new Set(); let total = 0;
  for (const l of input.lines) {
    ensure(l && ['product', 'expense'].includes(l.kind));
    const base = ['id', 'kind', 'name', 'categoryId', 'priceCOP', 'discountCOP'];
    keys(l, l.kind === 'expense' ? base : [...base, 'productId', 'newProduct', 'control', 'baseUnit', 'quantityMilli', 'unit', 'priceMode', 'stockStatus']);
    id(l.id); ensure(!ids.has(l.id), 'DUPLICATE_LINE_ID'); ids.add(l.id); text(l.name); category(l.categoryId);
    if (l.kind === 'product') {
      id(l.productId); ensure(typeof l.newProduct === 'boolean'); ensure(['exact', 'simple'].includes(l.control));
      ensure(['unidad', 'kg', 'L'].includes(l.baseUnit)); ensure(['unit', 'total'].includes(l.priceMode));
      integer(l.quantityMilli, 1); ensure(statuses.includes(l.stockStatus)); delta(l, { unit: l.baseUnit });
    }
    total = integer(total + net(l));
  }
  ensure(total === input.reviewedTotalCOP, 'TOTAL_MISMATCH'); return total;
}
export function validateAdjustment(input) {
  keys(input, ['schemaVersion', 'operationId', 'kind', 'productId', 'expectedVersion', 'after']);
  ensure(input.schemaVersion === 1 && input.kind === 'stockAdjust'); id(input.operationId); id(input.productId); integer(input.expectedVersion);
  ensure(typeof input.after === 'number' || statuses.includes(input.after));
  if (typeof input.after === 'number') integer(input.after);
}
export function documentBytes(path, value) {
  const stringBytes = s => Buffer.byteLength(s, 'utf8') + 1;
  function size(v) {
    if (v === null || typeof v === 'boolean') return 1;
    if (typeof v === 'number' || v instanceof Date || typeof v?.toMillis === 'function') return 8;
    if (typeof v === 'string') return stringBytes(v);
    if (Array.isArray(v)) return v.reduce((sum, item) => sum + size(item), 0);
    return 32 + Object.entries(v).reduce((sum, [k, item]) => sum + stringBytes(k) + size(item), 0);
  }
  return path.split('/').reduce((sum, p) => sum + stringBytes(p), 16) + size(value);
}
