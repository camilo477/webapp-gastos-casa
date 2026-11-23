import { fireEvent,render,screen,waitFor } from '@testing-library/react';
import { describe,expect,it,vi } from 'vitest';
import { CATEGORIES,CONTRACT } from '@mi-casa/inventory-contract';
import { DemoProvider } from '../../state/DemoContext';
import { ProductForm } from './ProductForm';
import { StockForm } from './StockForm';
import type { CandidateReadPort } from '../../application/inventory-candidate';
const service=():CandidateReadPort=>({contract:CONTRACT,page:vi.fn(),byId:vi.fn(),dispose:vi.fn(),suggest:vi.fn().mockResolvedValue({items:[],incomplete:false})});
const product={id:'p',name:'Arroz ficticio',presentation:'Bolsa 500 g',category:'Alimentos',control:'exact' as const,unit:'kg' as const,quantityMilli:1250,version:1,updatedAtMillis:1};
describe('candidate fields inside the approved forms',()=>{
 it('converts an explicitly entered unit and keeps presentation independent of stock',async()=>{
  const save=vi.fn().mockResolvedValue(undefined),candidate=service();render(<DemoProvider><ProductForm candidate={candidate} categories={Object.values(CATEGORIES)} save={save} onDone={()=>{}}/></DemoProvider>);
  fireEvent.change(screen.getByLabelText('Nombre del producto'),{target:{value:'Arroz ficticio'}});fireEvent.change(screen.getByLabelText('Presentación (opcional)'),{target:{value:'Bolsa 500 g'}});
  fireEvent.change(screen.getByLabelText('Unidad del inventario'),{target:{value:'kg'}});fireEvent.change(screen.getByLabelText('Unidad de la cantidad'),{target:{value:'g'}});fireEvent.change(screen.getByLabelText('Cuánto hay ahora'),{target:{value:'250'}});
  await waitFor(()=>expect(screen.queryByText('Buscando productos parecidos…')).not.toBeInTheDocument());fireEvent.click(screen.getByRole('button',{name:'Guardar producto'}));
  await waitFor(()=>expect(save).toHaveBeenCalledOnce());expect(save.mock.calls[0][3]).toEqual({presentation:'Bolsa 500 g',quantity:{unit:'g',amountMilli:250000}});
 });
 it('requires an explicit distinct-product decision and offers an existing product without merging',async()=>{
  const save=vi.fn().mockResolvedValue(undefined),candidate=service(),onExisting=vi.fn();vi.mocked(candidate.suggest).mockResolvedValue({items:[{product,reason:'presentation'}],incomplete:false});
  render(<DemoProvider><ProductForm candidate={candidate} categories={Object.values(CATEGORIES)} save={save} onExisting={onExisting} onDone={()=>{}}/></DemoProvider>);
  fireEvent.change(screen.getByLabelText('Nombre del producto'),{target:{value:'Arroz ficticio'}});await screen.findByText('Puede que este producto ya esté en casa.');
  fireEvent.click(screen.getByRole('button',{name:'Guardar producto'}));await screen.findByText('Revisa los productos parecidos o confirma que es un producto distinto.');expect(save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Usar Arroz ficticio'}));expect(onExisting).toHaveBeenCalledWith(product);
  fireEvent.click(screen.getByLabelText('Es un producto distinto; quiero añadirlo'));fireEvent.click(screen.getByRole('button',{name:'Guardar producto'}));await waitFor(()=>expect(save).toHaveBeenCalledOnce());
 });
 it('resetting an operation restores the base unit instead of interpreting the current stock as grams',async()=>{
  const save=vi.fn().mockResolvedValue(undefined);render(<DemoProvider><StockForm candidate product={product} save={save} onDone={()=>{}}/></DemoProvider>);
  fireEvent.change(screen.getByLabelText('Unidad de la cantidad'),{target:{value:'g'}});fireEvent.change(screen.getByLabelText('Cuánto hay ahora'),{target:{value:'250'}});
  fireEvent.change(screen.getByLabelText('Qué quieres hacer'),{target:{value:'add'}});fireEvent.change(screen.getByLabelText('Qué quieres hacer'),{target:{value:'set'}});
  expect(screen.getByLabelText('Unidad de la cantidad')).toHaveValue('kg');expect(screen.getByLabelText('Cuánto hay ahora')).toHaveValue('1,25');
  fireEvent.click(screen.getByRole('button',{name:'Guardar existencias'}));await waitFor(()=>expect(save).toHaveBeenCalledOnce());expect(save.mock.calls[0][3].quantity).toEqual({unit:'kg',amountMilli:1250});
 });
 it('approximate stock never displays a quantity input and presentation remains editable',()=>{
  render(<DemoProvider><ProductForm candidate={service()} categories={Object.values(CATEGORIES)} product={{...product,control:'simple',status:'low'}} save={vi.fn()} onDone={()=>{}}/></DemoProvider>);
  expect(screen.getByLabelText('Presentación (opcional)')).toHaveValue('Bolsa 500 g');expect(screen.queryByLabelText('Cuánto hay ahora')).not.toBeInTheDocument();expect(screen.queryByLabelText('Unidad del inventario')).not.toBeInTheDocument();
 });
});
