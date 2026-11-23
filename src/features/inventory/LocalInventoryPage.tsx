import { useCallback, useEffect, useRef, useState } from 'react';
import { categoryId, createProductCommand, LOCAL_CATEGORIES, type InventoryProduct, type LocalInventoryPort } from '../../application/inventory';
import { Button } from '../../components/Button';
import { SelectField, TextField } from '../../components/Fields';
import { EmptyState, LoadingIndicator } from '../../components/Feedback';
import { PageHeading } from '../../components/Surface';
import { InventoryProductRow } from './InventoryProductRow';
import { ProductForm } from './ProductForm';
import { StockForm } from './StockForm';
import { useStatusMessage } from '../../hooks/useStatusMessage';

export function LocalInventoryPage({ service }: { service: LocalInventoryPort }) {
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
    } catch (cause) { if (request === generation.current) setError(cause instanceof Error ? cause.message : 'No pudimos cargar los productos.'); }
    finally { if (request === generation.current) setLoading(false); }
  }, [category, query, service]);
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
  return <>
    <PageHeading title="Mi inventario">Mira cuánto queda y actualízalo cuando lo necesites.</PageHeading>{statusNode}
    <div className="filter-row"><TextField label="Buscar un producto" type="search" leadingIcon="search" placeholder="Por ejemplo, arroz" value={query} onChange={e=>setQuery(e.target.value)}/>
      <SelectField label="Categoría" value={category} options={[{ value:'all',label:'Todos los productos' }, ...Object.values(LOCAL_CATEGORIES).map(v=>({value:v,label:v}))]} onChange={setCategory}/></div>
    <div className="section-heading"><h2>Lo que hay en casa</h2><Button variant="secondary" icon="plus" onClick={()=>open({kind:'new'})}>Añadir producto</Button></div>
    <Button variant="secondary" disabled={loading || Boolean(editor)} onClick={()=>void load()}>Actualizar productos</Button>
    {editor?.kind==='new' && <ProductForm key="new" categories={Object.values(LOCAL_CATEGORIES)} onDone={close} onSaved={saved} save={(operationId,productId,input)=>service.mutate(createProductCommand(operationId,productId,input))}/>}
    {editor?.kind==='edit' && <ProductForm key={'edit-'+editor.product.id} product={editor.product} categories={Object.values(LOCAL_CATEGORIES)} onDone={close} onSaved={saved}
      save={(operationId,productId,input)=>service.mutate({schemaVersion:1,kind:'inventoryEdit',operationId,productId,expectedVersion:editor.product.version,name:input.name,categoryId:categoryId(input.category)})}/>}
    {editor?.kind==='stock' && <StockForm key={'stock-'+editor.product.id} product={editor.product} onDone={close} onSaved={saved}
      save={(operationId,action,value)=>service.mutate({schemaVersion:1,kind:'inventoryAdjust',operationId,productId:editor.product.id,expectedVersion:editor.product.version,action,value})}/>}
    {loading && <LoadingIndicator label="Cargando productos…"/>}
    {error && <div role="alert"><p className="field-error">{error}</p><Button variant="secondary" onClick={()=>void load()}>Reintentar carga</Button></div>}
    {!loading && !error && !items.length && <EmptyState title={cursor?'La búsqueda continúa':'No hay productos para mostrar'}>{cursor?'Pulsa Ver más productos para seguir buscando.':'Prueba otro nombre o añade un producto. El inventario local comienza vacío.'}</EmptyState>}
    {items.length>0 && <ul className="inventory-list">{items.map(product=><InventoryProductRow key={product.id} product={product} onEdit={()=>open({kind:'edit',product})} onUpdate={()=>open({kind:'stock',product})}/>)}</ul>}
    {cursor && !loading && <Button variant="secondary" onClick={()=>void load(cursor)}>Ver más productos</Button>}
  </>;
}
