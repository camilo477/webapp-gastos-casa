import { normalizeName } from './policy';
import { ensure, safeInteger, stockQuantity, text } from './validation';
import type { DomainState, Product, ProductInput, StockStatus, Movement } from './types';

export function existingProduct(products: Product[], name: string, exceptId?: string) { return products.find(p => p.id !== exceptId && normalizeName(p.name) === normalizeName(name)); }
export function buildProduct(id: string, input: ProductInput): Product {
  const name = text(input.name, 'el nombre del producto'), category = text(input.category, 'la categoría');
  ensure(['unidad', 'kg', 'L'].includes(input.unit), 'Elige una unidad válida para el producto.');
  ensure(['exact', 'simple'].includes(input.control), 'Elige cómo quieres controlar el producto.');
  const common = { id, name, category, unit: input.unit };
  if (input.control === 'exact') return { ...common, control: 'exact', quantityMilli: stockQuantity(input.initialQuantityMilli, input.unit, input.unit) };
  validateStatus(input.initialStatus);
  return { ...common, control: 'simple', status: input.initialStatus };
}
export function validateStatus(status: StockStatus) { ensure(['available', 'low', 'empty'].includes(status), 'Elige cuánto queda del producto.'); }
export function getProduct(state: DomainState, id: string) { const product = state.products.find(p => p.id === id); ensure(product, 'No encontramos este producto. Vuelve al inventario.'); return product; }
export function recordMovement(state: DomainState, product: Product, id: string, before: number | StockStatus, kind: Movement['kind'], description: string, purchaseId?: string) {
  ensure(!state.movements.some(m => m.id === id), 'Esta actualización ya está registrada.');
  state.movements.push({ id, productId: product.id, productName: product.name, before, after: product.control === 'exact' ? product.quantityMilli : product.status, unit: product.unit, kind, description, purchaseId });
}
export function addProduct(state: DomainState, id: string, input: ProductInput) {
  ensure(!existingProduct(state.products, input.name), 'Ya hay un producto con ese nombre. Selecciónalo o utiliza un nombre que distinga su presentación.');
  ensure(!state.products.some(p => p.id === id), 'Este producto ya fue creado.');
  const product = buildProduct(id, input); state.products.push(product);
  recordMovement(state, product, `opening:${id}`, product.control === 'exact' ? 0 : 'empty', 'adjustment', 'Existencia inicial indicada');
  return product;
}
export function adjustStock(state: DomainState, id: string, productId: string, operation: 'set' | 'add' | 'consume', quantityMilli: number) {
  if (state.movements.some(m => m.id === id)) return;
  const product = getProduct(state, productId); ensure(product.control === 'exact', 'Este producto se controla con un estado.');
  stockQuantity(quantityMilli, product.unit, product.unit);
  if (operation !== 'set') safeInteger(quantityMilli, 'la cantidad', false);
  const before = product.quantityMilli;
  const next = operation === 'set' ? quantityMilli : operation === 'add' ? before + quantityMilli : before - quantityMilli;
  ensure(next >= 0, 'No puedes consumir más de lo que hay. Revisa la cantidad.');
  product.quantityMilli = safeInteger(next, 'la existencia');
  recordMovement(state, product, id, before, operation === 'consume' ? 'consumption' : 'adjustment', operation === 'consume' ? 'Consumo manual' : 'Ajuste de existencia');
}
