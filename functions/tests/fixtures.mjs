export const time = { toMillis: () => 1000 };
export const product = (i = 0, overrides = {}) => ({ name: `Producto ficticio ${i}`, categoryId: 'food',
  control: 'exact', unit: 'unidad', quantityMilli: 2000, version: 0, updatedAt: time, ...overrides });
export const line = (i = 0, overrides = {}) => ({ id: `line-${i}`, kind: 'product', productId: `p${i}`, newProduct: false,
  name: `Producto ficticio ${i}`, categoryId: 'food', control: 'exact', baseUnit: 'unidad', quantityMilli: 1000,
  unit: 'unidad', priceCOP: 4200, priceMode: 'unit', discountCOP: 0, stockStatus: 'available', ...overrides });
export const purchase = (operationId = 'purchase-demo', count = 1) => ({ schemaVersion: 1, operationId,
  kind: 'purchase', date: '2026-11-22', store: 'Tienda ficticia', reviewedTotalCOP: 4200 * count,
  lines: Array.from({ length: count }, (_, i) => line(i)) });
