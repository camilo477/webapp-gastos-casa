import { purchaseTotal } from './finance';
import { addProduct, adjustStock, existingProduct, getProduct, recordMovement, validateStatus } from './inventory';
import { confirmPurchase, getDraft, putLine } from './purchases';
import { ensure, safeInteger, text } from './validation';
import type { Command, DomainState } from './types';

// Toda operación se aplica sobre una copia. Un error nunca publica efectos parciales.
export function reduceDomain(state: DomainState, command: Command): DomainState {
  if (command.type === 'confirm' && state.purchases.some(p => p.id === command.id)) return state;
  const next = structuredClone(state);
  switch (command.type) {
    case 'startDraft': ensure(!next.draft, 'Ya tienes una compra en revisión. Continúa o descártala antes de empezar otra.'); ensure(!next.purchases.some(p => p.id === command.draft.id), 'Esta compra ya está registrada. Inicia una nueva.'); next.draft = structuredClone(command.draft); next.lastConfirmedId = null; break;
    case 'metadata': { const draft = getDraft(next); draft.store = command.store; draft.date = command.date; draft.dirty = true; break; }
    case 'touchDraft': getDraft(next).dirty = true; break;
    case 'putLine': putLine(next, command.line); break;
    case 'removeLine': { const draft = getDraft(next); ensure(draft.lines.some(l => l.id === command.id), 'No encontramos ese artículo.'); draft.lines = draft.lines.filter(l => l.id !== command.id); draft.dirty = true; delete draft.reviewedTotalCOP; break; }
    case 'resolveLine': { const draft = getDraft(next); const line = draft.lines.find(l => l.id === command.id); ensure(line, 'No encontramos ese artículo.'); delete line.reviewReason; putLine(next, line); break; }
    case 'acceptTotal': { const draft = getDraft(next); draft.reviewedTotalCOP = purchaseTotal(draft); draft.dirty = true; break; }
    case 'discardDraft': next.draft = null; break;
    case 'confirm': confirmPurchase(next, command.id); break;
    case 'createProduct': addProduct(next, command.id, command.input); break;
    case 'editProduct': {
      if (next.movements.some(m => m.id === command.operationId)) break;
      const product = getProduct(next, command.id); ensure(!existingProduct(next.products, command.name, product.id), 'Ya hay otro producto con ese nombre.');
      product.name = text(command.name, 'el nombre del producto'); product.category = text(command.category, 'la categoría');
      recordMovement(next, product, command.operationId, product.control === 'exact' ? product.quantityMilli : product.status, 'adjustment', 'Datos del producto actualizados'); break;
    }
    case 'adjust': adjustStock(next, command.id, command.productId, command.operation, command.quantityMilli); break;
    case 'stockStatus': {
      if (next.movements.some(m => m.id === command.id)) break;
      const product = getProduct(next, command.productId); ensure(product.control === 'simple', 'Este producto se controla con una cantidad.'); validateStatus(command.status);
      const before = product.status; product.status = command.status; recordMovement(next, product, command.id, before, 'adjustment', 'Estado actualizado'); break;
    }
    case 'createList': ensure(!next.list, 'Ya tienes una lista activa.'); next.list = { id: command.id, name: text(command.name, 'el nombre de la lista'), items: [] }; break;
    case 'putListItem': {
      ensure(next.list, 'Crea una lista antes de añadir productos.'); text(command.item.name, 'el nombre del artículo'); safeInteger(command.item.quantityMilli, 'la cantidad deseada', false);
      ensure(['unidad', 'kg', 'g', 'L', 'ml'].includes(command.item.unit), 'Selecciona una unidad válida.');
      const i = next.list.items.findIndex(item => item.id === command.item.id);
      if (i < 0) next.list.items.push(structuredClone(command.item)); else next.list.items[i] = structuredClone(command.item); break;
    }
    case 'toggleListItem': { ensure(next.list, 'No hay una lista activa.'); const item = next.list.items.find(i => i.id === command.id); ensure(item, 'No encontramos ese artículo.'); item.purchased = !item.purchased; break; }
    case 'removeListItem': ensure(next.list, 'No hay una lista activa.'); next.list.items = next.list.items.filter(i => i.id !== command.id); break;
    case 'finishList': next.list = null; break;
  }
  return next;
}
