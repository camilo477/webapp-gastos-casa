import { Button } from '../../components/Button';
import { Money } from '../../components/Money';
import { Card } from '../../components/Surface';
import { purchaseTotal } from '../../domain/finance';
import { formatDemoDate } from '../../lib/format';
import type { Draft } from '../../domain/types';
import { InPageLink } from '../../components/InPageLink';

export function PurchaseOverview({purchase,pendingCount,onAdd,onMetadata}:{purchase:Draft;pendingCount:number;onAdd:()=>void;onMetadata:()=>void}){
  const recognized=purchase.lines.filter(l=>l.source==='receipt').length;
  return <section aria-labelledby="purchase-store"><Card className="review-overview">
    <h2 id="purchase-store">{purchase.store||'Establecimiento por indicar'}</h2><p>{purchase.date?formatDemoDate(purchase.date):'Fecha por indicar'}</p>
    <Button variant="secondary" onClick={onMetadata}>Editar datos de la compra</Button>
    <p className="overview-total">Total de la compra <Money amountCOP={purchaseTotal(purchase)}/></p>
    <dl className="review-counts"><div><dt>Productos en total</dt><dd>{purchase.lines.length}</dd></div><div><dt>Reconocidos del recibo</dt><dd>{recognized}</dd></div><div><dt>Necesitan revisión</dt><dd>{pendingCount}</dd></div></dl>
    <p className="muted small">{purchase.lines.length-recognized} {purchase.lines.length-recognized===1?'añadido':'añadidos'} a mano. Los pendientes ya están incluidos en el total de artículos.</p>
    {purchase.source==='simulation'&&<p className="muted small">Recibo simulado. Los productos nuevos parten de 0 salvo que indiques otra existencia anterior al editarlos. Los de estado pasan a Hay suficiente al reponerlos, según el supuesto de esta demostración.</p>}
    <div className="review-shortcuts"><Button variant="secondary" onClick={onAdd}>Añadir producto</Button><InPageLink target="confirmar-compra">Ir al total y guardar</InPageLink></div>
  </Card></section>;
}
