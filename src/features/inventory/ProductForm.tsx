import { useState } from 'react';
import { Button } from '../../components/Button';
import { SelectField, TextField } from '../../components/Fields';
import { Card } from '../../components/Surface';
import { useValidatedForm } from '../../hooks/useValidatedForm';
import { newId, requireSuccess, useDemo } from '../../state/DemoContext';
import { CATEGORY_OPTIONS, STATUS_LABELS, UNIT_LABELS } from '../../domain/policy';
import { parseQuantity, text } from '../../domain/validation';
import type { BaseUnit, Product, StockStatus } from '../../domain/types';

export function ProductForm({ product, onDone, onSaved }: { product?: Product; onDone: () => void; onSaved?: (name:string) => void }) {
  const { run } = useDemo(); const form = useValidatedForm();
  const [operationId] = useState(newId), [id] = useState(newId);
  const [name,setName] = useState(product?.name ?? ''), [category,setCategory] = useState(product?.category ?? 'Alimentos');
  const [control,setControl] = useState<'exact'|'simple'>(product?.control ?? 'exact');
  const [unit,setUnit] = useState<BaseUnit>(product?.unit ?? 'unidad');
  const [quantity,setQuantity] = useState('0'), [status,setStatus] = useState<StockStatus>('available');
  return <section id="product-editor" className="editor-section" aria-labelledby="product-form-title"><Card>
    <h2 id="product-form-title">{product ? 'Editar producto' : 'Añadir producto al inventario'}</h2>
    <form className="editor-example" noValidate onSubmit={form.handle(() => {
      form.read('name',()=>text(name,'el nombre del producto'));
      requireSuccess(product ? run({ type:'editProduct', id:product.id, operationId, name, category }) : run({ type:'createProduct', id,
        input:{ name,category,control,unit,initialQuantityMilli:control==='exact'?form.read('quantity',()=>parseQuantity(quantity,true)):0,initialStatus:status } })); onSaved?.(name.trim()); onDone();
    })}>
      <TextField label="Nombre del producto" value={name} onChange={e=>setName(e.target.value)} error={form.errorFor('name')} autoFocus />
      <SelectField label="Categoría del producto" value={category} options={CATEGORY_OPTIONS.map(v=>({value:v,label:v}))} onChange={setCategory} />
      {!product && <>
        <SelectField label="Cómo controlar cuánto queda" value={control} options={[{value:'exact',label:'Con una cantidad'},{value:'simple',label:'Con un estado'}]} onChange={v=>setControl(v as 'exact'|'simple')} />
        <SelectField label="Unidad del inventario" value={unit} options={(['unidad','kg','L'] as const).map(v=>({value:v,label:UNIT_LABELS[v]}))} onChange={v=>setUnit(v as BaseUnit)} />
        {control==='exact' ? <TextField label="Cuánto hay ahora" value={quantity} inputMode="decimal" onChange={e=>setQuantity(e.target.value)} error={form.errorFor('quantity')} help={`Cantidad en ${UNIT_LABELS[unit]}. Indica 0 si no hay.`} />
          : <SelectField label="Estado inicial" value={status} options={Object.entries(STATUS_LABELS).map(([value,label])=>({value,label}))} onChange={v=>setStatus(v as StockStatus)} />}
      </>}
      {product && <p className="muted small">La unidad y la forma de control se conservan en este prototipo. Para cambiar cuánto hay, utiliza Actualizar.</p>}
      {form.errorNode}<Button type="submit">Guardar producto</Button><Button variant="secondary" onClick={onDone}>Volver sin cambiar</Button>
    </form>
  </Card></section>;
}
