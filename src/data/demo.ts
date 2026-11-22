import type { DemoCategory, DemoListItem, DemoProduct, DemoPurchase } from '../types/demo';

export { largeReviewPurchase, smallReviewPurchase } from './review-purchases';

export const inventoryProducts = [
  { id: 'rice', name: 'Arroz', category: 'Alimentos', control: 'exact', quantity: 2, unit: 'kg' },
  { id: 'milk', name: 'Leche entera', category: 'Alimentos', control: 'exact', quantity: 3, unit: 'L' },
  { id: 'eggs', name: 'Huevos', category: 'Alimentos', control: 'exact', quantity: 12, unit: 'unidades' },
  { id: 'coffee', name: 'Café molido', category: 'Alimentos', control: 'simple', state: 'low' },
  { id: 'paper', name: 'Papel higiénico', category: 'Cuidado personal', control: 'simple', state: 'available' },
  { id: 'detergent', name: 'Detergente líquido', category: 'Limpieza', control: 'simple', state: 'empty' },
] as const satisfies readonly DemoProduct[];

export const previousPurchases = [
  { id: 'p-1', store: 'Tienda del barrio', date: '2026-11-18', totalCOP: 54100 },
  { id: 'p-2', store: 'Mercado Central', date: '2026-11-12', totalCOP: 85600 },
  { id: 'p-3', store: 'Almacén del hogar', date: '2026-11-07', totalCOP: 63200 },
  { id: 'p-4', store: 'Mercado Central', date: '2026-11-02', totalCOP: 83500 },
] as const satisfies readonly DemoPurchase[];

export const spendingCategories = [
  { name: 'Alimentos', amountCOP: 182400, displayPercentage: 64 },
  { name: 'Limpieza', amountCOP: 64000, displayPercentage: 22 },
  { name: 'Cuidado personal', amountCOP: 40000, displayPercentage: 14 },
] as const satisfies readonly { name: DemoCategory; amountCOP: number; displayPercentage: number }[];

// Estos totales son muestras coherentes, no cálculos financieros de la aplicación.
export const demoMonth = { label: 'Noviembre de 2026', totalCOP: 286400, purchaseCount: 4 } as const;

export const shoppingList = {
  name: 'Mi próxima compra',
  items: [
    { id: 'coffee', name: 'Café molido', purchased: false },
    { id: 'tomato', name: 'Tomate', purchased: false },
    { id: 'paper', name: 'Papel higiénico', purchased: false },
    { id: 'rice', name: 'Arroz', purchased: true },
    { id: 'milk', name: 'Leche entera', purchased: true },
  ] satisfies readonly DemoListItem[],
} as const;
