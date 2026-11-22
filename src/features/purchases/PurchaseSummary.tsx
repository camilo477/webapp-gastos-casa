import { Button } from '../../components/Button';
import { Money } from '../../components/Money';
import { Card } from '../../components/Surface';
import { purchaseTotal } from '../../domain/finance';
import type { Draft } from '../../domain/types';

export function PurchaseSummary({purchase,pendingCount,onViewPending,onAdd,onConfirm,onAcceptTotal,editing=false,onReturnToEditor}:{purchase:Draft;pendingCount:number;onViewPending:()=>void;onAdd:()=>void;onConfirm:()=>void;onAcceptTotal:()=>void;editing?:boolean;onReturnToEditor?:()=>void}){
  const total=purchaseTotal(purchase),difference=purchase.referenceTotalCOP!==undefined&&purchase.referenceTotalCOP!==total&&purchase.reviewedTotalCOP!==total;
  return <section id="confirmar-compra" className="review-confirmation" tabIndex={-1} aria-labelledby="purchase-total-title"><Card className="stack">
    <h2 id="purchase-total-title">El total de tu compra</h2><p>{purchase.store||'Sin establecimiento'} · {purchase.lines.length} {purchase.lines.length===1?'artículo':'artículos'}</p>
    <div className="total-line"><span>Total</span><Money amountCOP={total}/></div><p className="muted small">Pesos colombianos. Se registrará solo en esta sesión.</p>
    {pendingCount>0&&<><p>{pendingCount===1?'Hay un artículo pendiente de revisión.':'Hay '+pendingCount+' artículos pendientes de revisión.'}</p><Button variant="secondary" onClick={onViewPending}>Ver pendientes ({pendingCount})</Button></>}
    {difference&&<div className="notice notice-warning"><div><p>El recibo simulado indicaba <Money amountCOP={purchase.referenceTotalCOP!}/>. Tus artículos ahora suman <Money amountCOP={total}/>. Revisa la diferencia; no hemos añadido ningún ajuste.</p><Button variant="secondary" onClick={onAcceptTotal}>He revisado y acepto este total</Button></div></div>}
    {editing&&<div className="stack-tight"><p>Hay un formulario abierto. Termina de guardar sus cambios o vuelve sin cambiarlos antes de guardar la compra.</p><Button variant="secondary" onClick={onReturnToEditor}>Volver al formulario abierto</Button></div>}
    {!purchase.lines.length&&<p>Añade al menos un artículo antes de guardar la compra.</p>}
    <Button variant="secondary" onClick={onAdd}>Añadir producto</Button>
    <Button onClick={onConfirm} disabled={editing||pendingCount>0||difference||purchase.lines.length===0}>Guardar compra</Button>
    <p className="muted small">Al confirmar se actualizarán el inventario y los gastos del modo demostración. No hay respaldo en la nube.</p>
  </Card></section>;
}
