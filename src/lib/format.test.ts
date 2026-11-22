import { expect, it } from 'vitest';
import { formatQuantity } from './format';

it.each([
  [1000,'unidad','1 unidad'],[2000,'unidad','2 unidades'],
  [1000,'L','1 litro'],[1500,'L','1,5 litros'],[500,'kg','0,5 kg'],
] as const)('presenta cantidades con singular o plural comprensible', (quantity,unit,expected)=>{
  expect(formatQuantity(quantity,unit)).toBe(expected);
});
