import { Outlet, useBeforeUnload, useBlocker, useMatch } from 'react-router';
import { DemoNotice } from '../components/Feedback';
import { Header } from '../components/Header';
import { BottomNavigation, ContextNavigation } from '../components/Navigation';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useRouteFocus } from '../hooks/useRouteFocus';
import { useDemo } from '../state/DemoContext';
import { InPageLink } from '../components/InPageLink';

export function AppShell(){
  const {getState,run}=useDemo();
  const reviewing=Boolean(useMatch('/compras/revisar')),registering=Boolean(useMatch('/compras/nueva'));
  const contextual=reviewing||registering;
  useRouteFocus();
  const blocker=useBlocker(({currentLocation,nextLocation})=>{
    if(!getState().draft?.dirty)return false;
    const current=currentLocation.pathname.replace(/\/+$/,''),next=nextLocation.pathname.replace(/\/+$/,'');
    if(!current.startsWith('/compras')||current===next)return false;
    return !(current==='/compras/nueva'&&next==='/compras/revisar');
  });
  useBeforeUnload(event=>{if(getState().draft?.dirty){event.preventDefault();event.returnValue='';}});
  return <>
    <InPageLink className="skip-link" target="contenido">Ir al contenido</InPageLink>
    <div className={'app-shell '+(contextual?'task-shell':'')}><Header contextual={contextual}/>
      {contextual?<ContextNavigation reviewing={reviewing}/>:<BottomNavigation/>}
      <main className="app-main" id="contenido" tabIndex={-1}><DemoNotice/><Outlet/></main>
    </div>
    <ConfirmationDialog open={blocker.state==='blocked'} title="¿Descartar esta compra?" description="Hay cambios sin confirmar. Si sales, se descartará este borrador. El inventario y los gastos no han cambiado."
      confirmLabel="Descartar y salir" onCancel={()=>blocker.reset?.()} onConfirm={()=>{run({type:'discardDraft'});blocker.proceed?.();}}/>
  </>;
}
