import { act,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { describe,expect,it,vi } from 'vitest';
import { App,createAppRoutes } from '../../app/App';
import type { SessionPort,SessionState } from '../../application/ports';
import { InventoryReadError,type InventoryReadPort } from '../../application/inventory-read';
import type { InventoryProduct } from '../../application/inventory';

const authenticated=(scope:number):SessionState=>({status:'authenticated',scope,session:{uid:'read-session-fixture'}});
function setup(reader:InventoryReadPort,initial:SessionState={status:'checking',scope:0}){
 let state=initial;const listeners=new Set<()=>void>();
 const emit=(next:SessionState)=>{state=next;for(const listener of listeners)listener();};
 const session:SessionPort={options:{mode:'auth-test',methods:['password']},current:()=>state,subscribe:listener=>{listeners.add(listener);return()=>{listeners.delete(listener);};},signIn:vi.fn(),signOut:vi.fn(async()=>emit({status:'anonymous',scope:state.scope+1})),recheck:vi.fn(),dispose:vi.fn()};
 const router=createMemoryRouter(createAppRoutes(true),{initialEntries:['/inventario']});
 render(<App router={router} session={session} inventory={reader}/>);
 return{emit,session,router};
}
const reader=():InventoryReadPort=>({page:vi.fn().mockResolvedValue({items:[],nextCursor:null}),byId:vi.fn(),dispose:vi.fn()});
describe('read-only inventory composed inside the existing private session',()=>{
 it('never reads while checking/anonymous, shows an empty account without writers, and protects after logout',async()=>{
  const service=reader(),{emit,router,session}=setup(service);
  expect(screen.getByRole('status')).toHaveTextContent('comprobando');expect(service.page).not.toHaveBeenCalled();
  act(()=>emit({status:'anonymous',scope:0}));await screen.findByRole('heading',{name:'Bienvenida a Mi Casa'});
  expect(screen.getByText(/permite consultar tu inventario/)).toBeVisible();expect(service.page).not.toHaveBeenCalled();
  act(()=>emit(authenticated(1)));await screen.findByRole('heading',{name:'Todavía no tienes productos registrados'});
  expect(screen.getByLabelText('Consulta de inventario autorizada')).not.toHaveTextContent('emulador');
  expect(screen.getByText('Inventario de tu cuenta',{exact:true})).toBeVisible();expect(screen.queryByText('Inventario del laboratorio local')).not.toBeInTheDocument();
  expect(document.querySelectorAll('.inventory-item')).toHaveLength(0);expect(screen.queryByRole('button',{name:'Añadir producto'})).not.toBeInTheDocument();expect('mutate'in service).toBe(false);
  fireEvent.click(screen.getByRole('button',{name:'Cerrar sesión'}));await screen.findByRole('heading',{name:'Bienvenida a Mi Casa'});expect(session.signOut).toHaveBeenCalledOnce();
  const calls=vi.mocked(service.page).mock.calls.length;
  await act(async()=>{await router.navigate('/inventario');});expect(router.state.location.pathname).toBe('/acceso');expect(service.page).toHaveBeenCalledTimes(calls);expect(screen.queryByRole('heading',{name:'Mi inventario'})).not.toBeInTheDocument();
 });
 it('discards a late result across logout and restoration of the same account',async()=>{
  let finish!:(value:{items:InventoryProduct[];nextCursor:null})=>void;
  const service=reader();vi.mocked(service.page).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
  const {emit}=setup(service,authenticated(1));await waitFor(()=>expect(service.page).toHaveBeenCalledOnce());
  act(()=>emit({status:'anonymous',scope:2}));await screen.findByRole('heading',{name:'Bienvenida a Mi Casa'});
  act(()=>emit(authenticated(3)));await screen.findByRole('heading',{name:'Todavía no tienes productos registrados'});
  await act(async()=>finish({items:[{id:'late',name:'Producto anterior ficticio',category:'Alimentos',control:'exact',unit:'kg',quantityMilli:1250,version:1,updatedAtMillis:1}],nextCursor:null}));
  expect(screen.queryByRole('heading',{name:'Producto anterior ficticio'})).not.toBeInTheDocument();expect(document.querySelectorAll('.inventory-item')).toHaveLength(0);
 });
 it('handles denied/network reads without seed fallback and removes private content on expiration',async()=>{
  const service=reader();vi.mocked(service.page).mockRejectedValueOnce(new InventoryReadError('access','Esta cuenta no tiene permiso para consultar el inventario.')).mockRejectedValueOnce(new InventoryReadError('connection','No pudimos cargar los productos. Comprueba la conexión y vuelve a intentarlo.'));
  const {emit}=setup(service,authenticated(1));await screen.findByRole('alert');expect(document.querySelectorAll('.inventory-item')).toHaveLength(0);
  fireEvent.click(screen.getByRole('button',{name:'Reintentar carga'}));await screen.findByText(/Comprueba la conexión/);
  fireEvent.click(screen.getByRole('button',{name:'Reintentar carga'}));await screen.findByRole('heading',{name:'Todavía no tienes productos registrados'});
  act(()=>emit({status:'error',scope:2,message:'Tu sesión terminó. Vuelve a ingresar.'}));await screen.findByRole('heading',{name:'Bienvenida a Mi Casa'});expect(screen.getByRole('alert')).toHaveTextContent('Tu sesión terminó');expect(screen.queryByRole('heading',{name:'Mi inventario'})).not.toBeInTheDocument();
 });
});
