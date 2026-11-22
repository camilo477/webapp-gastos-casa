import { useState } from 'react';
import { Button } from '../../components/Button';
import { SelectField, TextField } from '../../components/Fields';
import { Card } from '../../components/Surface';
import { baseUnit, CATEGORY_OPTIONS, compatibleUnits, normalizeName, quantityText, STATUS_LABELS, UNIT_LABELS } from '../../domain/policy';
import { parseMoney, parseQuantity, ensure, text } from '../../domain/validation';
import type { PurchaseLine, StockStatus, Unit } from '../../domain/types';
import { useValidatedForm } from '../../hooks/useValidatedForm';
import { newId, requireSuccess, useDemo } from '../../state/DemoContext';

export function PurchaseLineEditor({ line, onDone, onSaved }: { line?: PurchaseLine; onDone:()=>void; onSaved?:(name:string)=>void }) {
  const {state,run}=useDemo();const form=useValidatedForm();const [id]=useState(()=>line?.id??newId());
  const [kind,setKind]=useState<PurchaseLine['kind']>(line?.kind??'product');
  const [query,setQuery]=useState(''),[productId,setProductId]=useState(line?.productId??''),[creating,setCreating]=useState(Boolean(line?.newProduct));
  const [name,setName]=useState(line?.name??''),[category,setCategory]=useState(line?.category??'Alimentos');
  const [quantity,setQuantity]=useState(line?quantityText(line.quantityMilli):'1'),[unit,setUnit]=useState<Unit>(line?.unit??'unidad');
  const [price,setPrice]=useState(line?String(line.priceCOP):''),[priceMode,setPriceMode]=useState<PurchaseLine['priceMode']>(line?.priceMode??'unit');
  const [discount,setDiscount]=useState(String(line?.discountCOP??0));
  const [control,setControl]=useState<'exact'|'simple'>(line?.newProduct?.control??'exact');
  const [initialQuantity,setInitialQuantity]=useState(quantityText(line?.newProduct?.initialQuantityMilli??0));
  const [status,setStatus]=useState<StockStatus>(line?.stockStatus??'available');
  const product=state.products.find(p=>p.id===productId);
  const candidates=state.products.filter(p=>normalizeName(p.name).includes(normalizeName(query))).slice(0,8);
  const units=product?compatibleUnits(product.unit):(['unidad','kg','g','L','ml'] as Unit[]);
  function touch(){run({type:'touchDraft'});}
  return <section id="line-editor" className="editor-section" aria-labelledby="line-editor-title"><Card>
    <h2 id="line-editor-title">{line?'Editar artículo':'Añadir producto a la compra'}</h2>
    <form className="editor-example" noValidate onChange={touch} onSubmit={form.handle(()=>{
      ensure(kind==='expense'||productId||creating,'Busca un producto existente o elige Crear producto nuevo.');
      form.read('name',()=>text(name,kind==='expense'?'el concepto del gasto':'el nombre del artículo'));
      requireSuccess(run({type:'putLine',line:{id,kind,name,category,productId:kind==='product'&&productId?productId:undefined,
        newProduct:kind==='product'&&creating?{name,category,control,unit:baseUnit(unit),initialQuantityMilli:control==='exact'?form.read('initialQuantity',()=>parseQuantity(initialQuantity,true)):0,initialStatus:'empty'}:undefined,
        quantityMilli:kind==='expense'?1000:form.read('quantity',()=>parseQuantity(quantity)),unit:kind==='expense'?'unidad':unit,
        priceCOP:form.read('price',()=>parseMoney(price)),priceMode:kind==='expense'?'total':priceMode,discountCOP:form.read('discount',()=>parseMoney(discount.trim()||'0','descuento')),source:line?.source??'manual',stockStatus:status}}));onSaved?.(name.trim());onDone();
    })}>
      <SelectField label="Tipo de artículo" value={kind} options={[{value:'product',label:'Producto para el inventario'},{value:'expense',label:'Gasto sin inventario (por ejemplo, un servicio)'}]} onChange={v=>{touch();setKind(v as typeof kind);}} />
      {kind==='product'&&<>
        <TextField label="Buscar un producto existente" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Por ejemplo, leche" autoFocus />
        <div className="product-options" role="group" aria-label="Productos existentes">{candidates.map(p=><Button variant="secondary" key={p.id} onClick={()=>{touch();setProductId(p.id);setCreating(false);setName(p.name);setCategory(p.category);setUnit(p.unit);}}>{p.name}</Button>)}</div>
        {product&&<p>Seleccionado: <strong>{product.name}</strong>. Se llevará en {UNIT_LABELS[product.unit]}.</p>}
        <Button variant="secondary" onClick={()=>{touch();setCreating(true);setProductId('');setName(query||name);}}>Crear producto nuevo</Button>
      </>}
      {(kind==='expense'||product||creating)&&<>
        <TextField label={kind==='expense'?'Concepto del gasto':'Nombre en esta compra'} value={name} onChange={e=>setName(e.target.value)} error={form.errorFor('name')} help={product?'Este nombre no cambia el catálogo del inventario.':undefined} />
        {(creating||kind==='expense')&&<SelectField label="Categoría del artículo" value={category} options={CATEGORY_OPTIONS.map(v=>({value:v,label:v}))} onChange={v=>{touch();setCategory(v);}} />}
        {creating&&kind==='product'&&<>
          <SelectField label="Cómo controlar el producto nuevo" value={control} options={[{value:'exact',label:'Con una cantidad'},{value:'simple',label:'Con un estado'}]} onChange={v=>{touch();setControl(v as typeof control);}} />
          {control==='exact'&&<TextField label="Cuánto había antes de esta compra" value={initialQuantity} onChange={e=>setInitialQuantity(e.target.value)} error={form.errorFor('initialQuantity')} inputMode="decimal" help={'En '+UNIT_LABELS[baseUnit(unit)]+'. Indica 0 si no había.'} />}
        </>}
        {kind==='product'&&<>
          <TextField label="Cantidad comprada" value={quantity} onChange={e=>setQuantity(e.target.value)} error={form.errorFor('quantity')} inputMode="decimal" help="Hasta tres decimales; por ejemplo 1,5. Sin separadores de miles." />
          <SelectField label="Unidad de compra" value={unit} options={units.map(v=>({value:v,label:UNIT_LABELS[v]}))} onChange={v=>{touch();setUnit(v as Unit);}} />
          <SelectField label="El precio corresponde a" value={priceMode} options={[{value:'unit',label:'Cada unidad de la cantidad indicada'},{value:'total',label:'El total de esta cantidad'}]} onChange={v=>{touch();setPriceMode(v as typeof priceMode);}} />
        </>}
        <TextField label={kind==='expense'?'Importe del gasto (COP)':priceMode==='total'?'Precio total de esta cantidad (COP)':'Precio por '+(unit==='unidad'?'unidad':UNIT_LABELS[unit])+' (COP)'} value={price} onChange={e=>setPrice(e.target.value)} error={form.errorFor('price')} inputMode="numeric" help="Pesos enteros, por ejemplo 4200. Si fue gratis, indica 0." />
        <details className="new-product"><summary>Descuento de este artículo (opcional)</summary><TextField label="Descuento del artículo (COP)" value={discount} onChange={e=>setDiscount(e.target.value)} error={form.errorFor('discount')} inputMode="numeric" /></details>
        {kind==='product'&&(product?.control==='simple'||creating&&control==='simple')&&<SelectField label="Estado después de la compra" value={status} options={Object.entries(STATUS_LABELS).map(([value,label])=>({value,label}))} onChange={v=>{touch();setStatus(v as StockStatus);}} />}
        {kind==='product'&&priceMode==='unit'&&<p className="muted small">En esta demostración, las fracciones de peso del importe se redondean al peso más cercano.</p>}
        <p className="muted small">Esto añade o corrige el artículo del borrador. El inventario solo cambia al guardar la compra completa.</p>
      </>}
      {form.errorNode}<Button type="submit">Guardar artículo en la compra</Button><Button variant="secondary" onClick={onDone}>Volver sin cambiar el artículo</Button>
    </form>
  </Card></section>;
}
