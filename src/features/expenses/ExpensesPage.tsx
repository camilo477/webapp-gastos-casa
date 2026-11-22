import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { SelectField, TextField } from '../../components/Fields';
import { Money } from '../../components/Money';
import { PurchaseHistory } from '../../components/PurchaseHistory';
import { Card, PageHeading } from '../../components/Surface';
import { EmptyState, Notice } from '../../components/Feedback';
import { useDemo } from '../../state/DemoContext';
import { spending } from '../../domain/finance';
import { DEMO_MONTH } from '../../domain/policy';
import { PurchaseDetail } from './PurchaseDetail';

export function ExpensesPage(){
  const {state}=useDemo();const [params]=useSearchParams();const location=useLocation();
  const [month,setMonth]=useState(DEMO_MONTH),[store,setStore]=useState(''),[category,setCategory]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState('');
  const result=spending(state,{month:month||undefined,store:store||undefined,category:category||undefined,from:from||undefined,to:to||undefined});
  const months=[...new Set([DEMO_MONTH,...state.purchases.map(p=>p.date.slice(0,7))])].sort().reverse();
  const stores=[...new Set(state.purchases.map(p=>p.store))],categories=[...new Set(state.purchases.flatMap(p=>p.lines.map(l=>l.category)))];
  const detail=state.purchases.find(p=>p.id===params.get('compra'));
  const invalidRange=Boolean(from&&to&&from>to);
  useEffect(()=>{
    if(!detail||location.hash)return;
    const frame=requestAnimationFrame(()=>{const section=document.getElementById('purchase-detail');section?.focus({preventScroll:true});section?.scrollIntoView({block:'start'});});
    return ()=>cancelAnimationFrame(frame);
  },[detail?.id,location.key]);
  return <>
    <PageHeading title="Mis gastos">Lo que has gastado, sin complicaciones.</PageHeading>
    <div className="filter-row">
      <SelectField label="Periodo" value={month} options={[{value:'',label:'Todo el historial'},...months.map(m=>({value:m,label:m==='2026-11'?'Noviembre de 2026':m}))]} onChange={v=>{setMonth(v);setFrom('');setTo('');}}/>
      <SelectField label="Establecimiento" value={store} options={[{value:'',label:'Todos'},...stores.map(v=>({value:v,label:v}))]} onChange={setStore}/>
      <SelectField label="Categoría" value={category} options={[{value:'',label:'Todas las categorías'},...categories.map(v=>({value:v,label:v}))]} onChange={setCategory}/>
    </div>
    <details className="date-filters"><summary>Elegir fechas concretas</summary><div className="filter-row"><TextField label="Desde" type="date" value={from} error={invalidRange?'Debe ser anterior o igual a Hasta.':undefined} onChange={e=>{setMonth('');setFrom(e.target.value);}}/><TextField label="Hasta" type="date" value={to} onChange={e=>{setMonth('');setTo(e.target.value);}}/></div></details>
    {invalidRange&&<p className="field-error" role="alert">La fecha Desde debe ser anterior o igual a Hasta. Corrige las fechas para consultar los gastos.</p>}
    {!invalidRange&&<>
    <div className="expenses-layout"><div className="stack">
      <Card className="monthly"><h2>{month===DEMO_MONTH&&!store&&!category&&!from&&!to?'Total de este mes':'Total de la selección'}</h2><Money amountCOP={result.totalCOP} showCurrency/><p>{result.rows.length} {result.rows.length===1?'compra':'compras'}</p></Card>
      <section aria-labelledby="spending-categories"><Card className="stack"><h2 id="spending-categories">En qué lo has gastado</h2>
        {Object.keys(result.categories).length?<ul className="category-list">{Object.entries(result.categories).map(([name,amount])=><li className="category-line" key={name}><p>{name}</p><Money amountCOP={amount}/><div className="category-bar" aria-hidden="true"><span style={{width:(result.totalCOP?amount/result.totalCOP*100:0)+'%'}}/></div></li>)}</ul>:<p>No hay gastos en esta selección.</p>}
      </Card></section>
      <Card className="stack"><h2>Dónde compraste</h2><ul className="record-list">{Object.entries(result.stores).map(([name,amount])=><li className="record" key={name}><p>{name}</p><Money amountCOP={amount}/></li>)}</ul></Card>
    </div><section aria-labelledby="purchase-history"><div className="section-heading"><h2 id="purchase-history">Historial de compras</h2></div>
      {result.rows.length?<PurchaseHistory purchases={result.rows.map(r=>r.purchase)} amounts={Object.fromEntries(result.rows.map(r=>[r.purchase.id,r.amountCOP]))}/>:<EmptyState title="No hay compras en estas fechas">Prueba otro periodo o establecimiento.</EmptyState>}
      {category&&<p className="muted small">Los importes de esta selección corresponden solo a la categoría elegida. El detalle muestra la compra completa.</p>}
    </section></div>
    {detail&&<PurchaseDetail purchase={detail} confirmed={state.lastConfirmedId===detail.id}/>}
    {params.get('compra')&&!detail&&<Notice title="Esta compra no está en la sesión actual." tone="warning">Al recargar, los ejemplos vuelven a su estado inicial.</Notice>}
    </>}
  </>;
}
