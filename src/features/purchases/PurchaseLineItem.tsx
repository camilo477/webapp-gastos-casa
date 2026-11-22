import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Money } from '../../components/Money';
import { lineTotal } from '../../domain/finance';
import { STATUS_LABELS } from '../../domain/policy';
import { formatQuantity } from '../../lib/format';
import type { PurchaseLine } from '../../domain/types';

export function PurchaseLineItem({line,onEdit,onRemove,onResolve}:{line:PurchaseLine;onEdit:()=>void;onRemove:()=>void;onResolve:()=>void}){
  const source=line.source==='manual'?'Añadido a mano':'Leído (simulado)';
  const icon=line.reviewReason?'warning':line.source==='manual'?'edit':'receipt';
  return <li className={'compact-review-item '+(line.reviewReason?'needs-review':'')} data-pending={Boolean(line.reviewReason)}>
    <details><summary><span className="line-status"><Icon name={icon}/>{line.reviewReason?'Por revisar':source}</span>
      <span className="line-name">{line.name}</span><span className="line-quantity">{line.kind==='expense'?'Sin inventario':formatQuantity(line.quantityMilli,line.unit)}</span>
      <Money amountCOP={lineTotal(line)}/><span className="line-expand">Ver y editar<Icon name="chevron"/></span>
    </summary><div className="line-details">
      {line.reviewReason&&<p className="warning-copy">{line.reviewReason}</p>}
      {line.kind==='product'&&<p className="muted small">{line.newProduct?'Producto nuevo. Existencia anterior: '+(line.newProduct.control==='exact'?formatQuantity(line.newProduct.initialQuantityMilli,line.newProduct.unit):'Agotado'):'Producto del inventario.'}</p>}
      {(line.newProduct?.control==='simple')&&<p>Después de comprar: {STATUS_LABELS[line.stockStatus]}.</p>}
      <p>{line.priceMode==='unit'?'Precio por unidad de compra: ':'Importe de esta cantidad: '}<Money amountCOP={line.priceCOP}/></p>
      {line.discountCOP>0&&<p>Descuento: <Money amountCOP={line.discountCOP}/></p>}
      <div className="item-actions"><Button variant="secondary" onClick={onEdit} aria-label={'Editar '+line.name}>Editar producto</Button><Button variant="danger" onClick={onRemove} aria-label={'Quitar '+line.name+' de esta compra'}>Quitar de esta compra</Button>
        {line.reviewReason&&<Button onClick={onResolve} aria-label={'Marcar revisado '+line.name}>Ya revisé este artículo</Button>}</div>
    </div></details>
  </li>;
}
