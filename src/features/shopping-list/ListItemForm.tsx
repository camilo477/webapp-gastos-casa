import { useState } from 'react';
import { Button } from '../../components/Button';
import { SelectField, TextField } from '../../components/Fields';
import { Card } from '../../components/Surface';
import { UNIT_LABELS, quantityText } from '../../domain/policy';
import type { ShoppingItem, Unit } from '../../domain/types';
import { parseQuantity, text } from '../../domain/validation';
import { newId, requireSuccess, useDemo } from '../../state/DemoContext';
import { useValidatedForm } from '../../hooks/useValidatedForm';

export function ListItemForm({item,onDone,onSaved}:{item?:ShoppingItem;onDone:()=>void;onSaved?:(name:string)=>void}){
  const {run}=useDemo();const form=useValidatedForm();const [id]=useState(()=>item?.id??newId());
  const [name,setName]=useState(item?.name??''),[quantity,setQuantity]=useState(item?quantityText(item.quantityMilli):'1'),[unit,setUnit]=useState<Unit>(item?.unit??'unidad');
  return <Card className="editor-section"><h2>{item?'Cambiar artículo de la lista':'Añadir a mi lista'}</h2><form className="editor-example" noValidate onSubmit={form.handle(()=>{
    form.read('name',()=>text(name,'el nombre del artículo'));requireSuccess(run({type:'putListItem',item:{id,name,quantityMilli:form.read('quantity',()=>parseQuantity(quantity)),unit,purchased:item?.purchased??false}}));onSaved?.(name.trim());onDone();
  })}>
    <TextField label="Producto de la lista" value={name} onChange={e=>setName(e.target.value)} error={form.errorFor('name')} autoFocus/>
    <TextField label="Cantidad deseada" value={quantity} inputMode="decimal" onChange={e=>setQuantity(e.target.value)} error={form.errorFor('quantity')}/>
    <SelectField label="Unidad deseada" value={unit} options={Object.entries(UNIT_LABELS).map(([value,label])=>({value,label}))} onChange={v=>setUnit(v as Unit)}/>
    {form.errorNode}<Button type="submit">Guardar artículo de la lista</Button><Button variant="secondary" onClick={onDone}>Volver a mi lista</Button>
  </form></Card>;
}
