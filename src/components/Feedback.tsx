import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Icon, type IconName } from './Icon';
import { Button } from './Button';
import { ConfirmationDialog } from './ConfirmationDialog';
import { useDemo } from '../state/DemoContext';
import { useStatusMessage } from '../hooks/useStatusMessage';

export function Notice({title,children,tone='info',icon='info'}:{title:string;children?:ReactNode;tone?:'info'|'warning'|'error'|'neutral';icon?:IconName}){
  return <div className={'notice '+(tone==='info'?'':'notice-'+tone)}><Icon name={icon}/><div><p><strong>{title}</strong></p>{children&&<p>{children}</p>}</div></div>;
}
export function EmptyState({title,children,action,icon='inventory'}:{title:string;children:ReactNode;action?:ReactNode;icon?:IconName}){
  return <section className="panel empty-state"><Icon name={icon}/><h2>{title}</h2><p className="muted">{children}</p>{action}</section>;
}
export function LoadingIndicator({label='Estamos preparando la información.'}:{label?:string}){return <div role="status" aria-live="polite" className="notice"><Icon name="clock"/><p>{label}</p></div>;}
export function DemoNotice(){
  const [open,setOpen]=useState(false);const {reset}=useDemo();const navigate=useNavigate();
  const {announce,statusNode}=useStatusMessage();
  return <aside className="demo-mode" aria-label="Modo demostración"><p id="demo-availability"><strong>Modo demostración.</strong> Los cambios viven solo en esta sesión y se pierden al recargar. No hay respaldo en la nube.</p>
    <Button variant="secondary" className="btn-small" onClick={()=>setOpen(true)}>Restablecer datos de ejemplo</Button>
    {statusNode}
    <ConfirmationDialog open={open} title="¿Restablecer los ejemplos?" description="Se perderán las compras y cambios de esta sesión. Volverás a los datos iniciales." confirmLabel="Restablecer ejemplos" cancelLabel="Conservar mis cambios" onCancel={()=>setOpen(false)} onConfirm={()=>{reset();announce('Datos de ejemplo restablecidos. Los cambios anteriores se han descartado.');setOpen(false);navigate('/');}}/>
  </aside>;
}
