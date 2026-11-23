import { useState } from 'react';
import { Button } from '../../components/Button';
import { SelectField, TextField } from '../../components/Fields';
import { Card } from '../../components/Surface';
import { useValidatedForm } from '../../hooks/useValidatedForm';
import { newId, requireSuccess, useDemo } from '../../state/DemoContext';
import { quantityText, STATUS_LABELS, UNIT_LABELS } from '../../domain/policy';
import { parseQuantity } from '../../domain/validation';
import type { Product, StockStatus } from '../../domain/types';
import { formatQuantity } from '../../lib/format';
import { useInventorySave } from '../../hooks/useInventorySave';

export function StockForm({ product, onDone, onSaved, save }: { product: Product; onDone:()=>void; onSaved?:()=>void;
  save?: (operationId: string, action: 'set'|'add'|'consume', value: number | StockStatus) => Promise<void> }) {
  const { run }=useDemo(); const form=useValidatedForm(); const [id]=useState(newId);
  const remote = useInventorySave();
  const [operation,setOperation]=useState<'set'|'add'|'consume'>('set');
  const [quantity,setQuantity]=useState(product.control==='exact'?quantityText(product.quantityMilli):'');
  const [status,setStatus]=useState<StockStatus>(product.control==='simple'?product.status:'available');
  return <section id="stock-editor" className="editor-section" aria-labelledby="stock-title"><Card><h2 id="stock-title">Actualizar {product.name}</h2>
    <form className="editor-example" noValidate onSubmit={form.handle(()=>{
      if(save){
        if(remote.retry){remote.run(async()=>{},()=>{onSaved?.();onDone();});return;}
        const value=product.control==='exact'?form.read('quantity',()=>parseQuantity(quantity,operation==='set')):status;
        remote.run(()=>save(id,product.control==='exact'?operation:'set',value),()=>{onSaved?.();onDone();});return;
      }
      if(product.control==='exact')form.read('quantity',()=>requireSuccess(run({type:'adjust',id,productId:product.id,operation,quantityMilli:parseQuantity(quantity,operation==='set')})));
      else requireSuccess(run({type:'stockStatus',id,productId:product.id,status}));onSaved?.();onDone();
    })}>
      <fieldset className="inventory-fields" disabled={remote.locked}><legend className="sr-only">Existencias del producto</legend>
      {product.control==='exact'?<>
        <p>Ahora hay {formatQuantity(product.quantityMilli,product.unit)}.</p>
        <SelectField label="Qué quieres hacer" value={operation} options={[{value:'set',label:'Establecer cuánto hay'},{value:'add',label:'Añadir cantidad'},{value:'consume',label:'Registrar consumo'}]} onChange={v=>{setOperation(v as typeof operation);setQuantity(v==='set'?quantityText(product.quantityMilli):'');}} />
        <TextField label={operation==='set'?'Cuánto hay ahora':'Cantidad'} value={quantity} inputMode="decimal" onChange={e=>setQuantity(e.target.value)} error={form.errorFor('quantity')} help={`En ${UNIT_LABELS[product.unit]}. Hasta tres decimales.`} autoFocus />
      </>:<SelectField label="Cuánto queda" value={status} options={Object.entries(STATUS_LABELS).map(([value,label])=>({value,label}))} onChange={v=>setStatus(v as StockStatus)} />}
      </fieldset><p className="muted small">Esta actualización no registra ningún gasto.</p>{form.errorNode}{remote.errorNode}{remote.busy&&<p role="status">Guardando cambios…</p>}
      <Button type="submit" disabled={remote.busy}>{remote.retry?'Reintentar guardado':'Guardar existencias'}</Button><Button variant="secondary" disabled={remote.locked} onClick={onDone}>Volver sin cambiar</Button>
    </form></Card></section>;
}
