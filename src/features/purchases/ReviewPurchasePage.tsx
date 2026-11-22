import { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '../../components/Button';
import { EmptyState, LoadingIndicator } from '../../components/Feedback';
import { PageHeading } from '../../components/Surface';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { createDraft } from '../../data/seed';
import { newId, useDemo } from '../../state/DemoContext';
import { PurchaseLineItem } from './PurchaseLineItem';
import { PurchaseOverview } from './PurchaseOverview';
import { PurchaseSummary } from './PurchaseSummary';
import { PurchaseLineEditor } from './PurchaseLineEditor';
import { PurchaseMetadataForm } from './PurchaseMetadataForm';
import { useStatusMessage } from '../../hooks/useStatusMessage';
import { InPageLink } from '../../components/InPageLink';

export function ReviewPurchasePage(){
  const {state,run,getState}=useDemo();const [params,setParams]=useSearchParams();const navigate=useNavigate();
  const [id]=useState(newId);const [ready,setReady]=useState(false);const [editor,setEditor]=useState<string|null>(null),[metadata,setMetadata]=useState(false),[remove,setRemove]=useState<string|null>(null),[error,setError]=useState('');
  const filter=useRef<HTMLButtonElement>(null);const restoreFocus=useRef<HTMLElement|null>(null);const errorRef=useRef<HTMLParagraphElement>(null);
  const {announce,statusNode}=useStatusMessage();
  const scenario=params.get('ejemplo')==='grande'?'large':'small';
  useEffect(()=>{const current=getState();if(!current.draft&&!current.lastConfirmedId)run({type:'startDraft',draft:createDraft(current,id,scenario)});setReady(true);},[getState,run,id,scenario]);
  const draft=state.draft,pendingOnly=params.get('vista')==='pendientes';
  if(!draft)return <><PageHeading title="Revisar compra"/>{!ready?<LoadingIndicator/>:<EmptyState title={state.lastConfirmedId?'La compra ya está registrada':'No hay una compra en preparación'} action={<Button onClick={()=>navigate(state.lastConfirmedId?'/gastos':'/compras/nueva')}>{state.lastConfirmedId?'Ver mis gastos':'Registrar compra'}</Button>}>Los datos existen solo durante esta sesión.</EmptyState>}</>;
  const pendingCount=draft.lines.filter(l=>l.reviewReason).length;
  const lines=pendingOnly?draft.lines.filter(l=>l.reviewReason):draft.lines;
  function changeView(pending:boolean){const next=new URLSearchParams(params);if(pending)next.set('vista','pendientes');else next.delete('vista');setParams(next,{replace:true});}
  function focusEditor(){requestAnimationFrame(()=>{const section=document.getElementById(editor?'line-editor':'purchase-metadata');section?.scrollIntoView({block:'start'});section?.querySelector<HTMLElement>('input,select,button')?.focus();});}
  function canOpenEditor(){if(editor){showError('Termina el artículo abierto: guárdalo o vuelve sin cambiarlo. Tus datos siguen en el formulario.');focusEditor();return false;}return true;}
  function openEditor(lineId:string){if(!canOpenEditor())return;restoreFocus.current=document.activeElement as HTMLElement;setError('');setEditor(lineId);setMetadata(false);requestAnimationFrame(()=>{const section=document.getElementById('line-editor');section?.scrollIntoView({block:'start'});section?.querySelector<HTMLElement>('input,select,button')?.focus();});}
  function showError(message:string){setError(message);requestAnimationFrame(()=>{errorRef.current?.focus();errorRef.current?.scrollIntoView({block:'center'});});}
  function closeEditor(){setEditor(null);setError('');requestAnimationFrame(()=>{if(restoreFocus.current?.isConnected)restoreFocus.current.focus();else filter.current?.focus();});}
  function resolve(lineId:string){if(!canOpenEditor())return;const result=run({type:'resolveLine',id:lineId});if(!result.ok)showError(result.error);else{setError('');if(pendingOnly)requestAnimationFrame(()=>filter.current?.focus());}}
  function confirm(){if(editor||metadata){focusEditor();return;}const result=run({type:'confirm',id:draft!.id});if(result.ok)navigate('/gastos?compra='+encodeURIComponent(draft!.id));else showError(result.error);}
  return <>
    <PageHeading title="Revisar compra" eyebrow={draft.source==='simulation'?'Recibo simulado · Sin confirmar':'Compra manual · Sin confirmar'}>Comprueba que todo esté bien y añade lo que falte.</PageHeading>
    {statusNode}
    <PurchaseOverview purchase={draft} pendingCount={pendingCount} onAdd={()=>openEditor('new')} onMetadata={()=>{if(canOpenEditor())setMetadata(!metadata);}}/>
    {metadata&&<PurchaseMetadataForm onDone={()=>setMetadata(false)}/>}
    {editor&&<PurchaseLineEditor key={editor} line={draft.lines.find(l=>l.id===editor)} onDone={closeEditor} onSaved={name=>announce(name+': artículo '+(editor==='new'?'añadido':'actualizado')+' en la compra. Falta guardar la compra completa.')}/>}
    <div className="review-filter" role="group" aria-label="Productos que quieres ver">
      <button type="button" aria-pressed={!pendingOnly} onClick={()=>changeView(false)}>Todos ({draft.lines.length})</button>
      <button type="button" ref={filter} aria-pressed={pendingOnly} onClick={()=>changeView(true)}>Por revisar ({pendingCount})</button>
    </div>
    <p className="review-view-note" role="status" aria-live="polite">{pendingOnly?'Mostrando '+pendingCount+(pendingCount===1?' pendiente.':' pendientes.')+' Los demás siguen en la compra.':'Viendo '+draft.lines.length+(draft.lines.length===1?' artículo.':' artículos.')}</p>
    {error&&<p className="field-error" role="alert" ref={errorRef} tabIndex={-1}>{error}</p>}
    <section aria-label="Productos de esta compra">{lines.length?<ul className="compact-review-list">{lines.map((line,index)=><Fragment key={line.id}>
      <PurchaseLineItem line={line} onEdit={()=>openEditor(line.id)} onRemove={()=>{if(canOpenEditor())setRemove(line.id);}} onResolve={()=>resolve(line.id)}/>
      {!pendingOnly&&(index+1)%10===0&&index+1<lines.length&&<li className="review-waypoint">Producto {index+1} de {lines.length}. <InPageLink target="confirmar-compra">Ir al total y guardar</InPageLink></li>}
    </Fragment>)}</ul>:<EmptyState title={pendingOnly?'No quedan artículos pendientes':'Añade lo que compraste'} action={<Button variant="secondary" onClick={()=>pendingOnly?changeView(false):openEditor('new')}>{pendingOnly?'Ver todos los artículos':'Añadir producto'}</Button>}>{pendingOnly?'Puedes revisar el total y confirmar la compra.':'El inventario no cambia hasta confirmar.'}</EmptyState>}</section>
    <PurchaseSummary purchase={draft} pendingCount={pendingCount} editing={Boolean(editor||metadata)} onReturnToEditor={focusEditor} onAdd={()=>openEditor('new')} onConfirm={confirm} onAcceptTotal={()=>run({type:'acceptTotal'})} onViewPending={()=>{changeView(true);filter.current?.focus();filter.current?.scrollIntoView({block:'center'});}}/>
    <ConfirmationDialog open={Boolean(remove)} title="¿Quitar este artículo?" description="Solo se retirará del borrador. No cambia el inventario ni los gastos." confirmLabel="Quitar de esta compra" cancelLabel="Conservar artículo" onCancel={()=>setRemove(null)} onConfirm={()=>{if(remove){const name=draft.lines.find(l=>l.id===remove)?.name;run({type:'removeLine',id:remove});announce(name+': retirado de esta compra. El inventario y los gastos no cambian hasta confirmar.');}setRemove(null);requestAnimationFrame(()=>filter.current?.focus());}}/>
  </>;
}
