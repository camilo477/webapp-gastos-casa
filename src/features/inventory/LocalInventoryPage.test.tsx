import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LocalInventoryPage } from './LocalInventoryPage';
import { InventoryProvider } from '../../state/InventoryContext';
import { DemoProvider } from '../../state/DemoContext';
import { InventoryError, type InventoryProduct, type LocalInventoryPort } from '../../application/inventory';

const product:InventoryProduct={id:'p',name:'Arroz local ficticio',category:'Alimentos',control:'exact',unit:'unidad',quantityMilli:2000,version:0,updatedAtMillis:1};
function setup(service:LocalInventoryPort) {
  return render(<DemoProvider><InventoryProvider service={service}><LocalInventoryPage service={service}/></InventoryProvider></DemoProvider>);
}
describe('local inventory screen',()=>{
  it('waits for the server and never substitutes demo seed for an empty local inventory',async()=>{
    let resolve!:(value:{items:InventoryProduct[];nextCursor:null})=>void;
    const service={page:vi.fn(()=>new Promise<{items:InventoryProduct[];nextCursor:null}>(r=>{resolve=r;})),mutate:vi.fn(),dispose:vi.fn()};
    setup(service); expect(screen.getByText('Cargando productos…')).toBeVisible();
    expect(screen.queryByText('Arroz local ficticio')).not.toBeInTheDocument();
    await waitFor(()=>expect(service.page).toHaveBeenCalled()); resolve({items:[],nextCursor:null});
    await screen.findByRole('heading',{name:'No hay productos para mostrar'});
  });
  it('freezes uncertain attempts and retries the identical command; success follows acknowledgment only',async()=>{
    const service:LocalInventoryPort={page:vi.fn().mockResolvedValue({items:[product],nextCursor:null}),
      mutate:vi.fn().mockRejectedValueOnce(new InventoryError('Respuesta no comprobada',true)).mockResolvedValueOnce(undefined),dispose:vi.fn()};
    setup(service); await screen.findByRole('heading',{name:product.name});
    fireEvent.click(screen.getByRole('button',{name:'Actualizar cuánto queda de '+product.name}));
    fireEvent.submit(screen.getByRole('button',{name:'Guardar existencias'}).closest('form')!);
    await screen.findByText('Respuesta no comprobada');
    expect(screen.getByLabelText('Cuánto hay ahora')).toBeDisabled();
    expect(screen.queryByText(/Producto guardado en el laboratorio/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Reintentar guardado'}));
    await screen.findByText('Producto guardado en el laboratorio local. Tus gastos no cambian.');
    const calls=vi.mocked(service.mutate).mock.calls;
    expect(calls).toHaveLength(2); expect(calls[1][0]).toEqual(calls[0][0]);
  });
  it('discards a late read when its private scope unmounts',async()=>{
    let resolve!:(value:{items:InventoryProduct[];nextCursor:null})=>void;
    const service:LocalInventoryPort={page:vi.fn(()=>new Promise<{items:InventoryProduct[];nextCursor:null}>(r=>{resolve=r;})),mutate:vi.fn(),dispose:vi.fn()};
    const view=setup(service); await waitFor(()=>expect(service.page).toHaveBeenCalled());
    view.unmount(); resolve({items:[product],nextCursor:null});
    expect(screen.queryByText(product.name)).not.toBeInTheDocument();
  });
});
