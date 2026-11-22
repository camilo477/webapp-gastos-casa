import { quantityText, UNIT_LABELS } from '../domain/policy';
import type { Unit } from '../domain/types';

const amountFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
});

// Solo presentación de las muestras enteras en COP; DP-02 sigue sin definir cálculos reales.
export function formatDemoAmount(amountCOP: number) {
  return amountFormatter.format(amountCOP);
}

export function formatQuantity(quantityMilli:number,unit:Unit) {
  const label=quantityMilli===1000?(unit==='unidad'?'unidad':unit==='L'?'litro':UNIT_LABELS[unit]):UNIT_LABELS[unit];
  return quantityText(quantityMilli)+' '+label;
}

export function formatDemoDate(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== isoDate) return 'Fecha por revisar';
  return dateFormatter.format(date);
}
