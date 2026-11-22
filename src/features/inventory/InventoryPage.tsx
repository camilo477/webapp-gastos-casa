import { useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { SelectField, TextField } from '../../components/Fields';
import { EmptyState } from '../../components/Feedback';
import { PageHeading } from '../../components/Surface';
import { normalizeName, STATUS_LABELS, UNIT_LABELS } from '../../domain/policy';
import { formatQuantity } from '../../lib/format';
import { useDemo } from '../../state/DemoContext';
import { InventoryProductRow } from './InventoryProductRow';
import { ProductForm } from './ProductForm';
import { StockForm } from './StockForm';
import { useStatusMessage } from '../../hooks/useStatusMessage';

export function InventoryPage() {
  const {state}=useDemo();const [query,setQuery]=useState(''),[category,setCategory]=useState('all');
  const {announce,statusNode}=useStatusMessage();
  const [editor,setEditor]=useState<{kind:'new'|'edit'|'stock';id?:string}|null>(null);
  const returnFocus=useRef<HTMLElement|null>(null);
  const product=state.products.find(p=>p.id===editor?.id);
  const products=state.products.filter(p=>normalizeName(p.name).includes(normalizeName(query))&&(category==='all'||p.category===category));
  const categories=[...new Set(state.products.map(p=>p.category))];
  const focusEditor=(kind:'new'|'edit'|'stock')=>requestAnimationFrame(()=>{const section=document.getElementById(kind==='stock'?'stock-editor':'product-editor');section?.scrollIntoView({block:'start'});section?.querySelector<HTMLElement>('input,select,button')?.focus();});
  const open=(value:NonNullable<typeof editor>)=>{
    if(editor){announce('Hay un formulario abierto. Guárdalo o vuelve sin cambiar antes de editar otro producto.');focusEditor(editor.kind);return;}
    returnFocus.current=document.activeElement as HTMLElement;setEditor(value);
    focusEditor(value.kind);
  };
  const close=()=>{setEditor(null);requestAnimationFrame(()=>returnFocus.current?.isConnected&&returnFocus.current.focus());};
  const revealProduct=(name:string)=>{setQuery('');setCategory('all');announce(name+': '+(editor?.kind==='new'?'producto creado':'datos actualizados')+' en esta sesión.');};
  const value=(v:number|string,unit:keyof typeof UNIT_LABELS)=>typeof v==='number'?formatQuantity(v,unit):STATUS_LABELS[v as keyof typeof STATUS_LABELS];
  return <>
    <PageHeading title="Mi inventario">Mira cuánto queda y actualízalo cuando lo necesites.</PageHeading>
    {statusNode}
    <div className="filter-row"><TextField label="Buscar un producto" type="search" leadingIcon="search" placeholder="Por ejemplo, arroz" value={query} onChange={e=>setQuery(e.target.value)} />
      <SelectField label="Categoría" value={category} options={[{value:'all',label:'Todos los productos'},...categories.map(v=>({value:v,label:v}))]} onChange={setCategory} /></div>
    <div className="section-heading"><h2>Lo que hay en casa</h2><Button variant="secondary" icon="plus" onClick={()=>open({kind:'new'})}>Añadir producto</Button></div>
    {editor?.kind==='new'&&<ProductForm key="new" onDone={close} onSaved={revealProduct} />}
    {editor?.kind==='edit'&&product&&<ProductForm key={'edit-'+product.id} product={product} onDone={close} onSaved={revealProduct} />}
    {editor?.kind==='stock'&&product&&<StockForm key={'stock-'+product.id} product={product} onDone={close} onSaved={()=>announce(product.name+': existencias actualizadas en esta sesión. Tus gastos no cambian.')} />}
    {products.length?<ul className="inventory-list">{products.map(p=><InventoryProductRow key={p.id} product={p} onEdit={()=>open({kind:'edit',id:p.id})} onUpdate={()=>open({kind:'stock',id:p.id})} />)}</ul>:<EmptyState title="No encontramos productos con ese nombre">Prueba otro nombre o añade un producto.</EmptyState>}
    <details className="movement-inspector"><summary>Movimientos de esta sesión ({state.movements.length})</summary><ul data-testid="inventory-movements">{[...state.movements].reverse().map(m=><li key={m.id}><strong>{m.productName}</strong> · {m.description}<p>{value(m.before,m.unit)} → {value(m.after,m.unit)}</p><small>Referencia: {m.id}</small></li>)}</ul></details>
  </>;
}
