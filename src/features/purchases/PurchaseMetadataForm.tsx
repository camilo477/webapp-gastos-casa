import { useNavigate } from 'react-router';
import { Button } from '../../components/Button';
import { TextField } from '../../components/Fields';
import { Card } from '../../components/Surface';
import { useValidatedForm } from '../../hooks/useValidatedForm';
import { text, validDate } from '../../domain/validation';
import { useDemo } from '../../state/DemoContext';

export function PurchaseMetadataForm({ onDone }: { onDone?:()=>void }) {
  const {state,run,getState}=useDemo();const navigate=useNavigate();const form=useValidatedForm();const draft=state.draft;
  if(!draft)return null;
  return <Card className="editor-section" id="purchase-metadata"><h2>Datos de la compra</h2><form className="editor-example" noValidate onSubmit={form.handle(()=>{
    form.read('store',()=>text(draft.store,'el establecimiento'));form.read('date',()=>validDate(draft.date));if(onDone)onDone();else navigate('/compras/revisar');
  })}>
    <TextField label="Establecimiento" value={draft.store} onChange={e=>run({type:'metadata',store:e.target.value,date:getState().draft!.date})} error={form.errorFor('store')} autoFocus />
    <TextField label="Fecha de compra" type="date" value={draft.date} onChange={e=>run({type:'metadata',store:getState().draft!.store,date:e.target.value})} error={form.errorFor('date')} />
    {form.errorNode}<Button type="submit">{onDone?'Listo, volver a la compra':'Continuar con los productos'}</Button>
  </form></Card>;
}
