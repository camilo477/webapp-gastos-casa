import type { BaseUnit, Unit, StockStatus } from './types';

// Supuestos del prototipo, no políticas definitivas de producción (DP-02/03).
export const QUANTITY_SCALE = 1000;
export const DEMO_TODAY = '2026-11-21';
export const DEMO_MONTH = '2026-11';
export const CATEGORY_OPTIONS = ['Alimentos', 'Limpieza', 'Cuidado personal', 'Sin clasificar'];
export const STATUS_LABELS: Record<StockStatus, string> = { available: 'Hay suficiente', low: 'Queda poco', empty: 'Agotado' };
export const UNIT_LABELS: Record<Unit, string> = { unidad: 'unidades', kg: 'kg', g: 'g', L: 'litros', ml: 'ml' };
export function baseUnit(unit: Unit): BaseUnit { return unit === 'g' ? 'kg' : unit === 'ml' ? 'L' : unit; }
export function compatibleUnits(unit: BaseUnit): Unit[] { return unit === 'kg' ? ['kg', 'g'] : unit === 'L' ? ['L', 'ml'] : ['unidad']; }
export function quantityText(milli: number) { return `${Math.trunc(milli / 1000)}${milli % 1000 ? ',' + String(milli % 1000).padStart(3, '0').replace(/0+$/, '') : ''}`; }
export function normalizeName(name: string) { return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es'); }
