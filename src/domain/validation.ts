import { baseUnit } from './policy';
import type { BaseUnit, Unit } from './types';

export class DomainError extends Error {}
export function ensure(condition: unknown, message: string): asserts condition { if (!condition) throw new DomainError(message); }
export function text(value: string, label: string) { ensure(value.trim().length > 0, `Escribe ${label}.`); return value.trim(); }
export function safeInteger(value: number, label: string, allowZero = true) {
  ensure(Number.isSafeInteger(value) && value >= (allowZero ? 0 : 1), `Revisa ${label}; debe ser ${allowZero ? 'cero o un número positivo' : 'un número positivo'} y no demasiado grande.`);
  return value;
}
export function parseQuantity(value: string, allowZero = false) {
  const match = /^(\d+)(?:[.,](\d{1,3}))?$/.exec(value.trim());
  ensure(match, 'Escribe una cantidad válida, con hasta tres decimales, por ejemplo 1,5.');
  return safeInteger(Number(match[1]) * 1000 + Number((match[2] ?? '').padEnd(3, '0')), 'la cantidad', allowZero);
}
export function parseMoney(value: string, label = 'precio') {
  ensure(/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(value.trim()), `Escribe el ${label} en pesos enteros, por ejemplo 4200. Si es cero, indica 0.`);
  return safeInteger(Number(value.replace(/\./g, '')), 'el '+label);
}
export function validDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  ensure(/^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value, 'Indica una fecha válida para la compra.');
}
export function stockQuantity(quantityMilli: number, unit: Unit, target: BaseUnit) {
  safeInteger(quantityMilli, 'la cantidad');
  ensure(baseUnit(unit) === target, 'La unidad no corresponde a este producto. Elige una unidad compatible.');
  const value = unit === 'g' || unit === 'ml' ? quantityMilli / 1000 : quantityMilli;
  ensure(Number.isSafeInteger(value), 'En esta demostración, usa gramos o mililitros enteros.');
  safeInteger(value, 'la cantidad convertida');
  if (target === 'unidad') ensure(value % 1000 === 0, 'Para unidades, escribe una cantidad entera.');
  return value;
}
