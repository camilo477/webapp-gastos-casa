import { useEffect, useState } from 'react';
import type { Definition } from '@mi-casa/inventory-contract';
import { candidateCategory, type CandidateReadPort, type CandidateSuggestion } from '../../application/inventory-candidate';
import type { InventoryProduct } from '../../application/inventory';
import { Button } from '../../components/Button';

export function useProductSuggestions(service:CandidateReadPort|undefined,definition:Omit<Definition,'categoryId'>&{category:string},enabled:boolean){
  const [state,setState]=useState<{key:string;items:CandidateSuggestion[];incomplete:boolean;error:string}>({key:'',items:[],incomplete:false,error:''});
  const [distinct,setDistinct]=useState(false),[retry,setRetry]=useState(0);
  const key=JSON.stringify(definition);
  useEffect(()=>{
    let active=true;setDistinct(false);
    if(!service||!enabled||definition.name.trim().length<2){setState({key,items:[],incomplete:false,error:''});return;}
    const timer=setTimeout(()=>{
      const target={name:definition.name.trim(),presentation:definition.presentation,baseUnit:definition.baseUnit,control:definition.control,categoryId:candidateCategory(definition.category)};
      void service.suggest(target).then(result=>{if(active)setState({key,...result,error:''});}).catch(()=>{if(active)setState({key,items:[],incomplete:false,error:'No pudimos revisar si ya existe este producto. Vuelve a intentarlo.'});});
    },250);
    return()=>{active=false;clearTimeout(timer);};
  },[service,key,enabled,retry]); // key is the complete immutable request identity.
  return{...state,loading:state.key!==key&&Boolean(service)&&enabled,distinct,setDistinct,retry:()=>setRetry(v=>v+1)};
}
export function ProductSuggestions({state,onExisting}:{state:ReturnType<typeof useProductSuggestions>;onExisting?:(product:InventoryProduct)=>void}){
  if(state.loading)return <p role="status">Buscando productos parecidos…</p>;
  if(state.error)return <div role="alert"><p>{state.error}</p><Button variant="secondary" onClick={state.retry}>Revisar coincidencias otra vez</Button></div>;
  if(!state.items.length&&!state.incomplete)return null;
  return <div className="stack product-suggestions"><p><strong>Puede que este producto ya esté en casa.</strong> Revisa su presentación antes de añadir otro.</p>
    <ul className="stack">{state.items.map(({product,reason})=><li key={product.id}><strong>{product.name}</strong>{product.presentation&&<p>{product.presentation}</p>}<p className="muted small">{reason==='incompatible'?'Se controla de otra manera. No combinaremos sus existencias.':reason==='same'?'Nombre y presentación coinciden.':'La presentación o el nombre pueden ser diferentes.'}</p>{onExisting&&<Button variant="secondary" onClick={()=>onExisting(product)}>Usar {product.name}</Button>}</li>)}</ul>
    {state.incomplete&&<p className="muted small">Solo revisamos una parte del catálogo. Comprueba que sea un producto distinto.</p>}
    <label className="checkbox-label"><input type="checkbox" checked={state.distinct} onChange={e=>state.setDistinct(e.target.checked)}/> Es un producto distinto; quiero añadirlo</label>
  </div>;
}
