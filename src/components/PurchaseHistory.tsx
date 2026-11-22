import { Link } from 'react-router';
import type { Purchase } from '../domain/types';
import { purchaseTotal } from '../domain/finance';
import { formatDemoDate } from '../lib/format';
import { Money } from './Money';

export function PurchaseHistory({purchases,amounts}:{purchases:Purchase[];amounts?:Record<string,number>}){
  return <ul className="record-list">{purchases.map(p=><li className="record" key={p.id}><div><h3><Link to={'/gastos?compra='+encodeURIComponent(p.id)}>{p.store}</Link></h3><p className="muted small">{formatDemoDate(p.date)}</p></div><Money amountCOP={amounts?.[p.id]??purchaseTotal(p)}/></li>)}</ul>;
}
