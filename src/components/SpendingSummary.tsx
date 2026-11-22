import { Link } from 'react-router';
import { useDemo } from '../state/DemoContext';
import { spending } from '../domain/finance';
import { DEMO_MONTH } from '../domain/policy';
import { Money } from './Money';
import { Card } from './Surface';

export function SpendingSummary({home=false,month=DEMO_MONTH}:{home?:boolean;month?:string}){
  const {state}=useDemo();const result=spending(state,{month:month||undefined});
  const label=month?new Intl.DateTimeFormat('es-CO',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-15T12:00:00Z')):'Todo el historial';
  return <section aria-label="Gasto mensual"><Card className="monthly"><p className="eyebrow">{label}</p><h2>{home?'Este mes has gastado':'Total del periodo'}</h2><Money amountCOP={result.totalCOP} showCurrency/>
    {home?<Link className="section-link" to="/gastos">Ver mis gastos</Link>:<p className="muted">{result.rows.length} compras</p>}
  </Card></section>;
}
