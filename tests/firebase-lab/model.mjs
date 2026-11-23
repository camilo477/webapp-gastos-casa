// Pure experimental contract. No imports from or writes to the React application.
export const LIMIT = 1_000_000_000;
export const emptyState = () => ({ schemaVersion: 1, revision: 0, lastOperationId: '', updatedAt: null, products: {} });
export const product = (i, overrides = {}) => ({ name: `Producto ficticio ${i}`, categoryId: 'food',
  control: 'exact', unit: 'unidad', quantityMilli: 2000, ...overrides });
export function fixtureState(count = 1, longNames = false) {
  const s = emptyState();
  for (let i = 0; i < count; i++) s.products[`p${i}`] = product(i, longNames ? { name: 'Á'.repeat(100) } : {});
  return s;
}
export function physicalLine(i, productId = `p${i}`, p = product(i), overrides = {}) {
  return { id: `line-${i}`, kind: 'product', productId, newProduct: false, name: p.name,
    categoryId: p.categoryId, control: p.control, baseUnit: p.unit,
    quantityMilli: 1000, unit: p.unit, priceCOP: 4200, priceMode: 'unit', discountCOP: 0,
    stockStatus: 'available', ...overrides };
}
export const serviceLine = (i) => ({ id: `line-${i}`, kind: 'expense', name: 'Servicio ficticio',
  categoryId: 'service', priceCOP: 8000, discountCOP: 1000 });
export const intent = (id = 'purchase-demo', count = 1) => ({ operationId: id, kind: 'purchase',
  purchaseDate: '2026-11-22', store: 'Tienda ficticia', lines: Array.from({ length: count }, (_, i) => physicalLine(i)) });

function ensure(value, message) { if (!value) throw new Error(message); }
function natural(value, max = LIMIT) { ensure(Number.isSafeInteger(value) && value >= 0 && value <= max, 'invalid number'); return value; }
function net(line) {
  natural(line.priceCOP, 1_000_000); natural(line.discountCOP);
  if (line.kind === 'product') { natural(line.quantityMilli); ensure(line.quantityMilli > 0, 'zero quantity'); }
  const gross = line.kind === 'expense' || line.priceMode === 'total' ? line.priceCOP :
    Number((BigInt(line.priceCOP) * BigInt(line.quantityMilli) + 500n) / 1000n);
  return natural(gross - line.discountCOP);
}
function stockDelta(l, p) {
  const compatible = l.unit === p.unit || (p.unit === 'kg' && l.unit === 'g') || (p.unit === 'L' && l.unit === 'ml');
  ensure(compatible, 'incompatible unit');
  const delta = ['g', 'ml'].includes(l.unit) ? l.quantityMilli / 1000 : l.quantityMilli;
  natural(delta); ensure(p.unit !== 'unidad' || delta % 1000 === 0, 'fractional units'); return delta;
}
function snapshot(p) { return { name: p.name, categoryId: p.categoryId, control: p.control, baseUnit: p.unit }; }
export function transition(old, input) {
  const next = structuredClone(old);
  const common = { schemaVersion: 1, operationId: input.operationId, kind: input.kind,
    beforeRevision: old.revision, afterRevision: old.revision + 1, createdAt: null };
  next.revision++; next.lastOperationId = input.operationId; next.updatedAt = null;
  if (input.kind === 'stockAdjust') {
    ensure(input.expectedRevision === old.revision, 'STALE_ADJUSTMENT');
    const p = next.products[input.productId]; ensure(p, 'missing product');
    const before = p.control === 'exact' ? p.quantityMilli : p.status;
    if (p.control === 'exact') { natural(input.after); ensure(p.unit !== 'unidad' || input.after % 1000 === 0, 'fractional units'); p.quantityMilli = input.after; }
    else { ensure(['available', 'low', 'empty'].includes(input.after), 'invalid status'); p.status = input.after; }
    return { next, operation: { ...common, productId: input.productId, expectedRevision: input.expectedRevision, before, after: input.after } };
  }
  ensure(input.kind === 'purchase' && input.lines.length > 0 && input.lines.length <= 100, 'invalid purchase');
  ensure(/^\d{4}-\d{2}-\d{2}$/.test(input.purchaseDate) && new Date(`${input.purchaseDate}T00:00:00Z`).toISOString().slice(0, 10) === input.purchaseDate, 'invalid date');
  const frames = [structuredClone(old.products)], prefixCOP = [0], movements = {}, physicalCounts = [0];
  const lines = input.lines.map((original, i) => {
    const l = { ...original, netCOP: net(original) };
    ensure(l.id === `line-${i}`, 'invalid line id');
    prefixCOP.push(natural(prefixCOP.at(-1) + l.netCOP));
    if (l.kind === 'product') {
      ensure(l.newProduct === !Object.hasOwn(old.products, l.productId), 'new product mismatch');
      let p = next.products[l.productId];
      if (!p) {
        p = { name: l.name, categoryId: l.categoryId, control: l.control, unit: l.baseUnit,
          ...(l.control === 'exact' ? { quantityMilli: 0 } : { status: 'empty' }) };
        next.products[l.productId] = p;
      }
      ensure(JSON.stringify(snapshot(p)) === JSON.stringify({ name: l.name, categoryId: l.categoryId, control: l.control, baseUnit: l.baseUnit }), 'identity changed');
      const before = p.control === 'exact' ? p.quantityMilli : p.status;
      const delta = stockDelta(l, p);
      if (p.control === 'exact') p.quantityMilli = natural(p.quantityMilli + delta);
      else { ensure(['available', 'low', 'empty'].includes(l.stockStatus), 'invalid status'); p.status = l.stockStatus; }
      movements[l.id] = { id: `purchase:${input.operationId}:${l.id}`, lineId: l.id,
        productId: l.productId, kind: 'purchase', before, after: p.control === 'exact' ? p.quantityMilli : p.status, unit: p.unit };

    } else ensure(l.kind === 'expense', 'invalid kind');
    physicalCounts.push(physicalCounts.at(-1) + (l.kind === 'product' ? 1 : 0));
    frames.push(structuredClone(next.products)); return l;
  });
  return { next, operation: { ...common, purchaseDate: input.purchaseDate, store: input.store, lines,
    frames, movements, prefixCOP, physicalCounts, totalPaidCOP: prefixCOP.at(-1) } };
}

// Stable comparison excludes server time, revisions and stock witnesses, never excludes financial intent.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
export const stable = value => JSON.stringify(canonical(value));
export function storedIntent(operation) {
  if (operation.kind === 'stockAdjust') return Object.fromEntries(['operationId','kind','productId','expectedRevision','after'].map(k => [k, operation[k]]));
  return { operationId: operation.operationId, kind: operation.kind,
    purchaseDate: typeof operation.purchaseDate === 'string' ? operation.purchaseDate : operation.purchaseDate.toDate().toISOString().slice(0, 10),
    store: operation.store, lines: operation.lines.map(({ netCOP: _net, ...line }) => line) };
}
