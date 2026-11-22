import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { STATUS_LABELS } from '../../domain/policy';
import { formatQuantity } from '../../lib/format';
import type { Product } from '../../domain/types';

export function InventoryProductRow({ product, onUpdate, onEdit }: { product:Product;onUpdate:()=>void;onEdit:()=>void }) {
  const tone=product.control==='simple'?(product.status==='low'?'badge-warning':product.status==='empty'?'badge-error':''):'';
  return <li className="inventory-item" data-product-id={product.id}>
    <div className="stack-tight"><h3>{product.name}</h3><p className="muted small">{product.category} · {product.control==='exact'?'Cantidad':'Estado'}</p></div>
    <div className="item-bottom">
      {product.control==='exact'?<p className="quantity">{formatQuantity(product.quantityMilli,product.unit)}</p>:<span className={'badge '+tone}><Icon name={product.status==='available'?'check':'warning'} />{STATUS_LABELS[product.status]}</span>}
      <div className="item-actions"><Button variant="secondary" className="btn-small" onClick={onUpdate} aria-label={'Actualizar cuánto queda de '+product.name}>Actualizar</Button><button className="text-btn" type="button" onClick={onEdit} aria-label={'Editar '+product.name}>Editar</button></div>
    </div>
  </li>;
}
