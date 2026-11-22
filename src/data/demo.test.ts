import { describe, expect, it } from 'vitest';
import { demoMonth, previousPurchases, spendingCategories, smallReviewPurchase, largeReviewPurchase, shoppingList } from './demo';
import type { DemoReviewPurchase } from '../types/demo';

describe('Coherencia de los datos ficticios aprobados', () => {
  it('concilia Inicio, compras históricas y categorías', () => {
    expect(previousPurchases.reduce((total, purchase) => total + purchase.totalCOP, 0)).toBe(demoMonth.totalCOP);
    expect(spendingCategories.reduce((total, category) => total + category.amountCOP, 0)).toBe(demoMonth.totalCOP);
    expect(previousPurchases).toHaveLength(demoMonth.purchaseCount);
  });

  it.each<[DemoReviewPurchase, number, number, number]>([
    [smallReviewPurchase, 5, 1, 4], [largeReviewPurchase, 50, 6, 47],
  ])('conserva líneas, procedencia, dudas y total de la muestra $id', (purchase, count, pending, recognized) => {
    expect(purchase.lines).toHaveLength(count);
    expect(purchase.lines.filter(line => line.reviewReason)).toHaveLength(pending);
    expect(purchase.lines.filter(line => line.source === 'receipt')).toHaveLength(recognized);
    expect(new Set(purchase.lines.map(line => line.id)).size).toBe(count);
    expect(purchase.lines.reduce((total, line) => total + line.amountCOP, 0)).toBe(purchase.totalCOP);
    expect(previousPurchases.some(history => history.id === purchase.id)).toBe(false);
  });

  it('mantiene separados los productos pendientes y comprados de la lista', () => {
    expect(shoppingList.items.filter(item => item.purchased)).toHaveLength(2);
    expect(shoppingList.items.filter(item => !item.purchased)).toHaveLength(3);
  });
});
