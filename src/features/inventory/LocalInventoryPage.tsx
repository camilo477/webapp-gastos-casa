import { useCallback, useEffect, useRef, useState } from 'react';
import { categoryId, createProductCommand, LOCAL_CATEGORIES, type InventoryProduct } from '../../application/inventory';
import { Button } from '../../components/Button';
import { SelectField, TextField } from '../../components/Fields';
import { EmptyState, LoadingIndicator } from '../../components/Feedback';
import { PageHeading } from '../../components/Surface';
import { InventoryProductRow } from './InventoryProductRow';
import { ProductForm } from './ProductForm';
import { StockForm } from './StockForm';
import { useStatusMessage } from '../../hooks/useStatusMessage';
import type { InventoryReadPort } from '../../application/inventory-read';
import { CATEGORIES } from '@mi-casa/inventory-contract';
import { candidateCategory, isCandidate, isCandidateWriter, type InventoryService, type CandidateFormDetails } from '../../application/inventory-candidate';
import type { ProductInput, StockStatus } from '../../domain/types';

export function LocalInventoryPage({ service }: { service: InventoryService | InventoryReadPort }) {
  const writer = 'mutate' in service ? service : null;
  const candidate=isCandidate(service)?service:undefined;
  const categories=candidate?Object.values(CATEGORIES):Object.values(LOCAL_CATEGORIES);
  const [query, setQuery] = useState(''), [category, setCategory] = useState('all');
  const [items, setItems] = useState<InventoryProduct[]>([]), [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [editor, setEditor] = useState<{ kind: 'new' } | { kind: 'edit' | 'stock'; product: InventoryProduct } | null>(null);
  const { announce, statusNode } = useStatusMessage();
  const generation = useRef(0), returnFocus = useRef<HTMLElement | null>(null);
  const load = useCallback(async (after: string | null = null) => {
    const request = ++generation.current;
    setLoading(true); setError('');
    try {
      const page = await service.page({ cursor: after, category, search: query });
      if (request !== generation.current) return;
      setItems(previous => after ? [...new Map([...previous, ...page.items].map(p => [p.id, p])).values()] : page.items);
      setCursor(page.nextCursor);
    } catch (cause) { if (request === generation.current) {
      if (!writer || candidate) { setItems([]); setCursor(null); }
      setError(cause instanceof Error ? cause.message : 'No pudimos cargar los productos.');
    } }
    finally { if (request === generation.current) setLoading(false); }
  }, [category, query, service, writer, candidate]);
  useEffect(() => {
    setItems([]); setCursor(null); setLoading(true);
    const timer = setTimeout(() => { void load(); }, 200);
    return () => { clearTimeout(timer); generation.current++; };
  }, [load]);
  useEffect(() => {
    const refresh = () => { if (!editor) void load(); };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [load, editor]);
  const open = (next: NonNullable<typeof editor>) => {
    if (editor) { announce('Guarda el formulario abierto o vuelve sin cambiar antes de abrir otro.'); return; }
    returnFocus.current = document.activeElement as HTMLElement;
    setEditor(next);
    requestAnimationFrame(() => document.querySelector<HTMLElement>('.editor-section input, .editor-section select')?.focus());
  };
  const close = () => { setEditor(null); requestAnimationFrame(() => returnFocus.current?.isConnected && returnFocus.current.focus()); };
  const saved = () => { announce('Producto guardado en el laboratorio local. Tus gastos no cambian.'); void load(); };
  function saveProduct(operationId:string,productId:string,input:ProductInput,details?:CandidateFormDetails){
    if(!writer)throw Error('READ_ONLY_INVENTORY');
    if(isCandidateWriter(writer)){
      if(!details)throw Error('PRODUCT_DETAILS_REQUIRED');
      const common={schemaVersion:2 as const,operationId,productId};
      return writer.mutate(editor?.kind==='edit'?{...common,kind:'edit',expectedVersion:editor.product.version,name:input.name,presentation:details.presentation,categoryId:candidateCategory(input.category)}:
        {...common,kind:'create',definition:{name:input.name,presentation:details.presentation,categoryId:candidateCategory(input.category),control:input.control,baseUnit:input.unit},opening:input.control==='exact'?{quantity:details.quantity}:{status:input.initialStatus},duplicateDecision:'reviewed-new'});
    }
    return writer.mutate(editor?.kind==='edit'?{schemaVersion:1,kind:'inventoryEdit',operationId,productId,expectedVersion:editor.product.version,name:input.name,categoryId:categoryId(input.category)}:createProductCommand(operationId,productId,input));
  }
  function saveStock(operationId:string,action:'set'|'add'|'consume',value:number|StockStatus,details?:CandidateFormDetails){
    if(!writer||editor?.kind!=='stock')throw Error('STOCK_FORM_REQUIRED');
    if(isCandidateWriter(writer)){
      if(!details)throw Error('PRODUCT_DETAILS_REQUIRED');
      return writer.mutate({schemaVersion:2,kind:'adjust',operationId,productId:editor.product.id,expectedVersion:editor.product.version,action,change:editor.product.control==='exact'?{quantity:details.quantity}:{status:value as StockStatus}});
    }
    return writer.mutate({schemaVersion:1,kind:'inventoryAdjust',operationId,productId:editor.product.id,expectedVersion:editor.product.version,action,value});
  }
  return <>
    <PageHeading title="Mi inventario">{writer?'Mira cuánto queda y actualízalo cuando lo necesites.':'Consulta los productos y cuánto queda en casa.'}</PageHeading>{statusNode}
    <div className="filter-row"><TextField label="Buscar un producto" type="search" leadingIcon="search" placeholder="Por ejemplo, arroz" value={query} onChange={e=>setQuery(e.target.value)}/>
      <SelectField label="Categoría" value={category} options={[{ value:'all',label:'Todos los productos' }, ...categories.map(v=>({value:v,label:v}))]} onChange={setCategory}/></div>
    <div className="section-heading"><h2>Lo que hay en casa</h2>{writer&&<Button variant="secondary" icon="plus" disabled={Boolean(candidate)&&(loading||Boolean(error))} onClick={()=>open({kind:'new'})}>Añadir producto</Button>}</div>
    <Button variant="secondary" disabled={loading || Boolean(editor)} onClick={()=>void load()}>Actualizar productos</Button>
    {writer && editor?.kind==='new' && <ProductForm key="new" categories={categories} candidate={candidate} onExisting={product=>{setEditor({kind:'stock',product});requestAnimationFrame(()=>document.querySelector<HTMLElement>('#stock-editor input, #stock-editor select')?.focus());}} onDone={close} onSaved={saved} save={saveProduct}/>}
    {writer && editor?.kind==='edit' && <ProductForm key={'edit-'+editor.product.id} product={editor.product} categories={categories} candidate={candidate} onDone={close} onSaved={saved} save={saveProduct}/>}
    {writer && editor?.kind==='stock' && <StockForm key={'stock-'+editor.product.id} product={editor.product} candidate={Boolean(candidate)} onDone={close} onSaved={saved} save={saveStock}/>}
    {loading && <LoadingIndicator label="Cargando productos…"/>}
    {error && <div role="alert"><p className="field-error">{error}</p><Button variant="secondary" onClick={()=>void load()}>Reintentar carga</Button></div>}
    {!loading && !error && !items.length && <EmptyState title={cursor?'La búsqueda continúa':'No hay productos para mostrar'}>{cursor?'Pulsa Ver más productos para seguir buscando.':writer?'Prueba otro nombre o añade un producto. El inventario local comienza vacío.':'Todavía no hay productos que puedas consultar con este filtro. Prueba otro nombre o vuelve a actualizar.'}</EmptyState>}
    {items.length>0 && <ul className="inventory-list">{items.map(product=><InventoryProductRow key={product.id} product={product} onEdit={writer?()=>open({kind:'edit',product}):undefined} onUpdate={writer?()=>open({kind:'stock',product}):undefined}/>)}</ul>}
    {cursor && !loading && <Button variant="secondary" onClick={()=>void load(cursor)}>Ver más productos</Button>}
  </>;
}
