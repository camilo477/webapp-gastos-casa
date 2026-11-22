import { ensure, safeInteger } from './validation';
import type { DomainState, PurchaseLine, Purchase } from './types';

export function lineGross(line: PurchaseLine) {
  safeInteger(line.priceCOP, 'el precio'); safeInteger(line.quantityMilli, 'la cantidad', false);
  // DP-02 provisional: redondeo positivo al peso más cercano, sin coma flotante.
  const gross = line.priceMode === 'total' ? BigInt(line.priceCOP) : (BigInt(line.priceCOP) * BigInt(line.quantityMilli) + 500n) / 1000n;
  return safeInteger(Number(gross), 'el importe');
}
export function lineTotal(line: PurchaseLine) {
  const gross = lineGross(line);
  safeInteger(line.discountCOP, 'el descuento');
  ensure(line.discountCOP <= gross, 'El descuento no puede superar el precio del artículo.');
  return gross - line.discountCOP;
}
export function purchaseTotal(purchase: Pick<Purchase, 'lines'>) {
  return safeInteger(purchase.lines.reduce((sum, line) => safeInteger(sum + lineTotal(line), 'el total de la compra'), 0), 'el total');
}
export type SpendingFilter = { month?: string; store?: string; category?: string; from?: string; to?: string };
export function spending(state: DomainState, filter: SpendingFilter = {}) {
  const purchases = state.purchases.filter(p => (!filter.month || p.date.startsWith(filter.month)) && (!filter.store || p.store === filter.store) && (!filter.from || p.date >= filter.from) && (!filter.to || p.date <= filter.to));
  const categories: Record<string, number> = Object.create(null), stores: Record<string, number> = Object.create(null);
  const rows = purchases.map(purchase => {
    const lines = purchase.lines.filter(line => !filter.category || line.category === filter.category);
    const amountCOP = purchaseTotal({ lines });
    for (const line of lines) categories[line.category] = safeInteger((categories[line.category] ?? 0) + lineTotal(line), 'el gasto por categoría');
    if (lines.length) stores[purchase.store] = safeInteger((stores[purchase.store] ?? 0) + amountCOP, 'el gasto por establecimiento');
    return { purchase, amountCOP, matches: lines.length > 0 };
  }).filter(row => row.matches);
  return { totalCOP: safeInteger(rows.reduce((sum, row) => sum + row.amountCOP, 0), 'el gasto'), categories, stores, rows };
}
