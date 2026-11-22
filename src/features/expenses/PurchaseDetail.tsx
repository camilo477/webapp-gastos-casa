import { Money } from '../../components/Money';
import { Card } from '../../components/Surface';
import { lineTotal, purchaseTotal } from '../../domain/finance';
import { formatDemoDate, formatQuantity } from '../../lib/format';
import type { Purchase } from '../../domain/types';
import { Link } from 'react-router';
import { Notice } from '../../components/Feedback';
import { InPageLink } from '../../components/InPageLink';

export function PurchaseDetail({purchase,confirmed=false}:{purchase:Purchase;confirmed?:boolean}){
  return <section id="purchase-detail" tabIndex={-1} className="editor-section" aria-labelledby="purchase-detail-title"><Card className="stack"><h2 id="purchase-detail-title">Detalle de la compra</h2><p><strong>{purchase.store}</strong> · {formatDemoDate(purchase.date)}</p>
    {confirmed&&<div role="status"><Notice title="Compra registrada en esta sesión.">El inventario y los gastos están actualizados solo durante esta sesión.</Notice></div>}
    <ul className="record-list">{purchase.lines.map(line=><li className="record" key={line.id}><div><h3>{line.name}</h3><p className="small muted">{line.category} · {line.kind==='expense'?'Sin inventario':formatQuantity(line.quantityMilli,line.unit)}</p></div><Money amountCOP={lineTotal(line)}/></li>)}</ul>
    <p>Total de esta compra: <Money amountCOP={purchaseTotal(purchase)}/></p><p className="small muted">Los datos se conservan solo en memoria durante esta sesión. No se almacenan fotografías.</p>
    <Link className="section-link" to="/inventario">Ver mi inventario</Link><InPageLink target="contenido">Volver al resumen de gastos</InPageLink>
  </Card></section>;
}
