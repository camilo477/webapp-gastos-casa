import { inventoryProducts, previousPurchases, shoppingList, smallReviewPurchase, largeReviewPurchase } from './demo';
import { DEMO_TODAY } from '../domain/policy';
import { addProduct, existingProduct } from '../domain/inventory';
import type { BaseUnit, DomainState, Draft, PurchaseLine } from '../domain/types';
import type { DemoReviewPurchase } from '../types/demo';

export function createInitialState(): DomainState {
  const state: DomainState = { products: [], purchases: [], movements: [], draft: null, list: null, lastConfirmedId: null };
  for (const product of inventoryProducts) {
    const unit: BaseUnit = product.id === 'rice' ? 'kg' : product.id === 'detergent' ? 'L' : 'unidad';
    addProduct(state, product.id, { name: product.name, category: product.category, unit, control: product.control,
      initialQuantityMilli: product.control === 'exact' ? product.quantity * 1000 : 0,
      initialStatus: product.control === 'simple' ? product.state : 'empty' });
  }
  // Historia estructurada de apertura: no se vuelve a aplicar al saldo inicial.
  const allocations: [string, number, number][][] = [
    [['rice',1000,7800],['milk',3000,12600],['eggs',30000,18900],['detergent',1000,14800]],
    [['rice',2000,15600],['milk',6000,25200],['eggs',30000,18900],['coffee',1000,10300],['paper',2000,15600]],
    [['detergent',3000,49200],['paper',2000,14000]],
    [['rice',3000,23400],['milk',6000,25200],['eggs',30000,18900],['coffee',1000,5600],['paper',1000,10400]],
  ];
  state.purchases = previousPurchases.map((purchase, index) => ({ id: purchase.id, store: purchase.store, date: purchase.date, source: 'seed', lines: allocations[index].map(([productId, quantityMilli, priceCOP], lineIndex) => {
    const product = state.products.find(p => p.id === productId)!;
    return { id: `${purchase.id}:${lineIndex}`, kind: 'product', productId, name: product.name, category: product.category, unit: product.unit,
      quantityMilli, priceCOP, priceMode: 'total', discountCOP: 0, source: 'manual', stockStatus: 'available' };
  }) }));
  state.list = { id: 'initial-list', name: shoppingList.name, items: shoppingList.items.map(item => ({ ...item, quantityMilli: 1000, unit: 'unidad' })) };
  return state;
}

// Datos estructurados de simulación, no lectura ni interpretación de imágenes.
const quantities: [number, BaseUnit][] = [
  [1000,'kg'],[3000,'unidad'],[30000,'unidad'],[2000,'unidad'],[1000,'L'],[1000,'kg'],[500,'kg'],[1000,'kg'],[500,'kg'],[500,'kg'],
  [500,'kg'],[500,'kg'],[2000,'unidad'],[1000,'unidad'],[1000,'unidad'],[1000,'unidad'],[500,'kg'],[4000,'unidad'],[250,'kg'],[1000,'unidad'],
  [500,'kg'],[1000,'unidad'],[1000,'unidad'],[1000,'unidad'],[1000,'unidad'],[1000,'kg'],[1000,'kg'],[2000,'kg'],[1000,'kg'],[1000,'kg'],
  [1000,'kg'],[1000,'kg'],[2000,'kg'],[1000,'unidad'],[1000,'unidad'],[1000,'kg'],[1000,'kg'],[1000,'kg'],[2000,'unidad'],[400,'L'],
  [1000,'unidad'],[1000,'unidad'],[1000,'L'],[500,'L'],[1000,'L'],[1000,'unidad'],[1000,'unidad'],[1000,'kg'],[2000,'unidad'],[1000,'unidad'],
];
// Asociaciones conocidas del escenario ficticio, no un algoritmo de OCR ni alias aprendidos.
const scenarioProducts: Record<number,string> = {0:'rice',1:'milk',2:'eggs',3:'coffee',41:'paper',42:'detergent'};
export function createDraft(state: DomainState, id: string, scenario: 'manual' | 'small' | 'large'): Draft {
  const draft: Draft = { id, store: '', date: DEMO_TODAY, lines: [], source: scenario === 'manual' ? 'manual' : 'simulation', dirty: scenario !== 'manual' };
  if (scenario === 'manual') return draft;
  const sample: DemoReviewPurchase = scenario === 'large' ? largeReviewPurchase : smallReviewPurchase;
  draft.store = sample.store; draft.referenceTotalCOP = sample.totalCOP;
  draft.lines = sample.lines.map((sampleLine, index): PurchaseLine => {
    const recipeIndex = scenario === 'large' ? index : [0,1,2,42,47][index];
    const [quantityMilli, unit] = quantities[recipeIndex];
    const match = state.products.find(p=>p.id===scenarioProducts[recipeIndex]) ?? existingProduct(state.products, sampleLine.name);
    const category = recipeIndex >= 38 && recipeIndex <= 41 ? 'Cuidado personal' : recipeIndex >= 42 && recipeIndex <= 46 ? 'Limpieza' : 'Alimentos';
    const original: { reviewReason?: string } = sampleLine;
    return { id: `${id}:line:${index}`, kind: 'product', name: sampleLine.name, category: match?.category ?? category, productId: match?.id,
      newProduct: match ? undefined : { name: sampleLine.name, category, control: 'exact', unit, initialQuantityMilli: 0, initialStatus: 'empty' },
      quantityMilli, unit, priceMode: 'total', priceCOP: sampleLine.amountCOP, discountCOP: 0,
      source: sampleLine.source, reviewReason: original.reviewReason ?? (match && match.unit !== unit ? 'La unidad del catálogo es distinta. Revisa el producto y la cantidad.' : undefined), stockStatus: 'available' };
  });
  return draft;
}
