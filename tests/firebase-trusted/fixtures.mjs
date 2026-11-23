export const product = (i = 0, overrides = {}) => ({ name: `Producto ficticio ${i}`, categoryId: 'food',
  control: 'exact', unit: 'unidad', quantityMilli: 2000, version: 0, updatedAt: null, ...overrides });
export const physical = (i = 0, productId = `p${i}`, p = product(i), overrides = {}) => ({
  id: `line-${i}`, kind: 'product', productId, newProduct: false, name: p.name, categoryId: p.categoryId,
  control: p.control, baseUnit: p.unit, quantityMilli: 1000, unit: p.unit, priceCOP: 4200,
  priceMode: 'unit', discountCOP: 0, stockStatus: 'available', ...overrides,
});
export const service = (i) => ({ id: `line-${i}`, kind: 'expense', name: 'Servicio ficticio', categoryId: 'service', priceCOP: 8000, discountCOP: 1000 });
export const purchase = (operationId = 'purchase-demo', count = 1) => ({ schemaVersion: 1, operationId, kind: 'purchase',
  date: '2026-11-22', store: 'Tienda ficticia', reviewedTotalCOP: 4200 * count,
  lines: Array.from({ length: count }, (_, i) => physical(i)) });
