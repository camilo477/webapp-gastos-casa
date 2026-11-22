import { lineTotal, purchaseTotal, spending } from './finance';
import { addProduct, buildProduct, existingProduct, getProduct, recordMovement, validateStatus } from './inventory';
import { normalizeName } from './policy';
import { ensure, safeInteger, stockQuantity, text, validDate } from './validation';
import type { DomainState, Draft, PurchaseLine, Product } from './types';

export function getDraft(state: DomainState): Draft { ensure(state.draft, 'Inicia una compra para añadir productos.'); return state.draft; }
export function validateLine(state: DomainState, line: PurchaseLine) {
  text(line.name, 'el nombre del artículo'); text(line.category, 'la categoría');
  ensure(['unit', 'total'].includes(line.priceMode), 'Indica a qué corresponde el precio.');
  ensure(['unidad', 'kg', 'g', 'L', 'ml'].includes(line.unit), 'Selecciona una unidad válida.');
  lineTotal(line);
  if (line.kind === 'expense') { ensure(!line.productId && !line.newProduct, 'Un gasto sin inventario no debe tener un producto asociado.'); return; }
  ensure(line.kind === 'product', 'Indica si el artículo lleva inventario.');
  ensure(Boolean(line.productId) !== Boolean(line.newProduct), 'Selecciona un producto existente o prepara uno nuevo.');
  const product = line.productId ? getProduct(state, line.productId) : buildProduct('pending', line.newProduct!);
  stockQuantity(line.quantityMilli, line.unit, product.unit); validateStatus(line.stockStatus);
  if (line.newProduct) ensure(!existingProduct(state.products, line.newProduct.name), 'Ya existe ese producto. Búscalo y selecciónalo para evitar duplicarlo.');
}
export function putLine(state: DomainState, line: PurchaseLine) {
  const draft = getDraft(state); validateLine(state, line);
  const index = draft.lines.findIndex(item => item.id === line.id);
  if (index === -1) draft.lines.push(structuredClone(line)); else draft.lines[index] = structuredClone(line);
  draft.dirty = true; delete draft.reviewedTotalCOP;
}
export function confirmPurchase(state: DomainState, id: string) {
  // Un reintento conserva la identidad, incluso después de retirar el borrador.
  if (state.purchases.some(p => p.id === id)) return;
  const draft = getDraft(state); ensure(draft.id === id, 'Esta confirmación no corresponde a la compra en revisión.');
  text(draft.store, 'el establecimiento'); validDate(draft.date);
  ensure(draft.lines.length > 0, 'Añade al menos un artículo antes de guardar.');
  ensure(new Set(draft.lines.map(line => line.id)).size === draft.lines.length, 'Hay artículos repetidos por error en este registro. Revísalos.');
  const definitions = new Map<string, string>();
  for (const line of draft.lines) if (line.newProduct) {
    const key = normalizeName(line.newProduct.name);
    const definition = JSON.stringify({ ...line.newProduct, name: key });
    ensure(!definitions.has(key) || definitions.get(key) === definition, 'Dos artículos nuevos con el mismo nombre tienen datos distintos. Revísalos.');
    definitions.set(key, definition);
  }
  for (const line of draft.lines) { ensure(!line.reviewReason, 'Todavía hay artículos por revisar. Resuélvelos antes de guardar.'); validateLine(state, line); }
  const total = purchaseTotal(draft);
  ensure(draft.referenceTotalCOP === undefined || draft.referenceTotalCOP === total || draft.reviewedTotalCOP === total, 'El total cambió respecto al recibo simulado. Revisa y confirma el nuevo total.');
  const created = new Map<string, Product>();
  const lines: PurchaseLine[] = [];
  for (const line of draft.lines) {
    const snapshot = structuredClone(line);
    if (line.kind === 'product') {
      let product: Product;
      if (line.productId) product = getProduct(state, line.productId);
      else {
        const key = normalizeName(line.newProduct!.name);
        const prior = created.get(key);
        if (prior) {
          ensure(prior.unit === line.newProduct!.unit && prior.control === line.newProduct!.control, 'Dos artículos nuevos con el mismo nombre tienen controles diferentes. Revísalos.');
          product = prior;
        } else {
          product = addProduct(state, `product:${id}:${line.id}`, line.newProduct!); created.set(key, product);
        }
      }
      const before = product.control === 'exact' ? product.quantityMilli : product.status;
      if (product.control === 'exact') product.quantityMilli = safeInteger(product.quantityMilli + stockQuantity(line.quantityMilli, line.unit, product.unit), 'la existencia final');
      else product.status = line.stockStatus;
      recordMovement(state, product, `purchase:${id}:${line.id}`, before, 'purchase', 'Entrada por compra', id);
      snapshot.productId = product.id; delete snapshot.newProduct;
    }
    delete snapshot.reviewReason; lines.push(snapshot);
  }
  state.purchases.unshift({ id, store: draft.store.trim(), date: draft.date, source: draft.source, lines });
  // También los informes agregados deben caber en pesos enteros seguros.
  spending(state);
  state.lastConfirmedId = id; state.draft = null;
}
