import { Outlet, useBeforeUnload, useBlocker, useMatch } from 'react-router';
import { DemoNotice, Notice } from '../components/Feedback';
import { Header } from '../components/Header';
import { BottomNavigation, ContextNavigation } from '../components/Navigation';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useRouteFocus } from '../hooks/useRouteFocus';
import { useDemo } from '../state/DemoContext';
import { InPageLink } from '../components/InPageLink';
import { SessionActions } from '../features/authentication/SessionPages';
import { useSession } from '../state/SessionContext';
import { useLocalInventory } from '../state/InventoryContext';

export function AppShell(){
  const session=useSession();
  const inventory=useLocalInventory();
  const readOnlyInventory=inventory !== null && !('mutate' in inventory.service);
  const inventoryRoute=Boolean(useMatch('/inventario'));
  const {getState,run}=useDemo();
  const reviewing=Boolean(useMatch('/compras/revisar')),registering=Boolean(useMatch('/compras/nueva'));
  const contextual=reviewing||registering;
  useRouteFocus();
  const blocker=useBlocker(({currentLocation,nextLocation})=>{
    if (inventory?.pending && currentLocation.pathname !== nextLocation.pathname) return true;
    if(!getState().draft?.dirty)return false;
    const current=currentLocation.pathname.replace(/\/+$/,''),next=nextLocation.pathname.replace(/\/+$/,'');
    if(!current.startsWith('/compras')||current===next)return false;
    return !(current==='/compras/nueva'&&next==='/compras/revisar');
  });
  useBeforeUnload(event=>{if(getState().draft?.dirty || inventory?.pending){event.preventDefault();event.returnValue='';}});
  return <>
    <InPageLink className="skip-link" target="contenido">Ir al contenido</InPageLink>
    <div className={'app-shell '+(contextual?'task-shell':'')}><Header contextual={contextual}/>
      {contextual?<ContextNavigation reviewing={reviewing}/>:<BottomNavigation/>}
      <main className="app-main" id="contenido" tabIndex={-1}><SessionActions/>{inventory && inventoryRoute ? readOnlyInventory?<Notice title="Inventario de tu cuenta">Puedes consultar los productos registrados. Añadir o cambiar productos todavía no está disponible. Compras y gastos siguen siendo ejemplos independientes.</Notice>:<Notice title="Inventario del laboratorio local">Estos productos ficticios se guardan en el emulador de este computador. No son datos de una cuenta real. Compras y gastos siguen siendo ejemplos independientes.</Notice> : <DemoNotice authenticatedExamples={Boolean(session)}/>}<Outlet/></main>
    </div>
    <ConfirmationDialog open={blocker.state==='blocked'} title={inventory?.pending?'Hay un guardado pendiente':'¿Descartar esta compra?'} description={inventory?.pending?'Vuelve al formulario y reintenta el guardado antes de salir. Si sales, perderás la referencia del reintento y no podremos comprobarlo automáticamente.':'Hay cambios sin confirmar. Si sales, se descartará este borrador. El inventario y los gastos no han cambiado.'}
      confirmLabel="Descartar y salir" onCancel={()=>blocker.reset?.()} onConfirm={()=>{inventory?.setPending(false);run({type:'discardDraft'});blocker.proceed?.();}}/>
  </>;
}
