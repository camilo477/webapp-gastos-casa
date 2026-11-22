import { useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { TextField } from '../../components/Fields';
import { Card, PageHeading } from '../../components/Surface';
import { EmptyState } from '../../components/Feedback';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { newId, requireSuccess, useDemo } from '../../state/DemoContext';
import { useValidatedForm } from '../../hooks/useValidatedForm';
import { formatQuantity } from '../../lib/format';
import { ListItemForm } from './ListItemForm';
import { useStatusMessage } from '../../hooks/useStatusMessage';
import { text } from '../../domain/validation';

export function ShoppingListPage(){
  const {state,run}=useDemo();const [name,setName]=useState('Mi próxima compra'),[editor,setEditor]=useState<string|null>(null),[finish,setFinish]=useState(false);
  const form=useValidatedForm();const list=state.list;
  const {announce,statusNode}=useStatusMessage();
  const returnFocus=useRef<HTMLElement|null>(null),addButton=useRef<HTMLButtonElement>(null);
  function openEditor(id:string){if(editor){announce('Termina el artículo abierto o vuelve a la lista antes de editar otro.');requestAnimationFrame(()=>document.querySelector<HTMLElement>('.editor-section input')?.focus());return;}returnFocus.current=document.activeElement as HTMLElement;setEditor(id);}
  function closeEditor(){setEditor(null);requestAnimationFrame(()=>{if(returnFocus.current?.isConnected)returnFocus.current.focus();else addButton.current?.focus();});}
  function toggle(id:string){run({type:'toggleListItem',id});requestAnimationFrame(()=>document.getElementById('list-'+id)?.focus());}
  return <>
    <PageHeading title="Mi lista">Apunta lo que necesitas para tu próxima compra.</PageHeading>
    {statusNode}
    {!list?<><EmptyState title="No tienes una lista activa">Crea una lista temporal para tu próxima compra.</EmptyState>
      <form className="editor-example editor-section" noValidate onSubmit={form.handle(()=>{form.read('name',()=>text(name,'el nombre de la lista'));requireSuccess(run({type:'createList',id:newId(),name}));announce('Lista creada para esta sesión. Ya puedes añadir productos.');requestAnimationFrame(()=>addButton.current?.focus());})}><TextField label="Nombre de la lista" value={name} onChange={e=>setName(e.target.value)} error={form.errorFor('name')} autoFocus/>{form.errorNode}<Button type="submit">Crear mi lista</Button></form></>:
    <Card><div className="section-heading"><div className="stack-tight"><p className="eyebrow">Lista activa</p><h2>{list.name}</h2></div></div><p className="muted">Marcar aquí no cambia el inventario ni los gastos.</p>
      <Button ref={addButton} variant="secondary" icon="plus" onClick={()=>openEditor('new')}>Añadir producto a la lista</Button>
      {editor&&<ListItemForm key={editor} item={list.items.find(i=>i.id===editor)} onDone={closeEditor} onSaved={name=>announce(name+': '+(editor==='new'?'añadido a la lista.':'cantidad actualizada.'))}/>}
      {[false,true].map(purchased=>{const items=list.items.filter(i=>i.purchased===purchased);return <section className="list-group" key={String(purchased)}><h3>{purchased?'Ya lo compraste':'Por comprar'} · {items.length}</h3>{items.map(item=><div className={'list-entry '+(purchased?'completed':'')} key={item.id}>
        <div className="list-row"><input id={'list-'+item.id} type="checkbox" checked={item.purchased} onChange={()=>toggle(item.id)}/><label htmlFor={'list-'+item.id}>{item.name}<span className="small muted">{formatQuantity(item.quantityMilli,item.unit)} · {purchased?'Comprado':'Pendiente'}</span></label></div>
        <div className="item-actions"><button className="text-btn" type="button" onClick={()=>openEditor(item.id)} aria-label={'Cambiar cantidad de '+item.name}>Cambiar cantidad</button><button className="text-btn danger" type="button" onClick={()=>{run({type:'removeListItem',id:item.id});announce(item.name+': retirado de la lista.');if(editor===item.id)setEditor(null);requestAnimationFrame(()=>addButton.current?.focus());}} aria-label={'Quitar '+item.name+' de la lista'}>Quitar</button></div>
      </div>)}</section>;})}
      <div className="stack list-actions"><Button variant="soft" onClick={()=>setFinish(true)}>Finalizar y descartar lista</Button><p className="muted small">Al finalizar se descartan también los artículos pendientes. No se crea un historial de listas.</p></div>
    </Card>}
    <ConfirmationDialog open={finish} title="¿Finalizar esta lista?" description={'Se descartarán sus '+(list?.items.length??0)+' artículos, incluidos los pendientes. No cambiarán el inventario ni los gastos.'} confirmLabel="Finalizar y descartar" cancelLabel="Seguir con mi lista" onCancel={()=>setFinish(false)} onConfirm={()=>{run({type:'finishList'});announce('Lista finalizada y descartada. El inventario y los gastos no cambiaron.');setFinish(false);setEditor(null);}}/>
  </>;
}
