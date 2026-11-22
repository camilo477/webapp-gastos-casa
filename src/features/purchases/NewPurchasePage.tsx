import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Card, PageHeading } from '../../components/Surface';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { createDraft } from '../../data/seed';
import { newId, requireSuccess, useDemo } from '../../state/DemoContext';
import { PurchaseMetadataForm } from './PurchaseMetadataForm';

export function NewPurchasePage(){
  const {state,run,getState}=useDemo();const navigate=useNavigate();const [discard,setDiscard]=useState(false);
  function start(scenario:'manual'|'small'|'large'){
    if(getState().draft)return;
    requireSuccess(run({type:'startDraft',draft:createDraft(getState(),newId(),scenario)}));
    if(scenario!=='manual')navigate('/compras/revisar');
  }
  return <>
    <PageHeading title="Registrar compra">Registra lo que compraste o prueba un recibo simulado.</PageHeading>
    {state.draft?<><PurchaseMetadataForm/><Button variant="secondary" onClick={()=>setDiscard(true)}>Descartar esta compra y empezar otra</Button></>:
    <div className="purchase-choices stack">
      <Card className="purchase-choice"><span className="choice-icon"><Icon name="camera"/></span><h2>Con un recibo simulado</h2><p>No se toman fotografías. Los productos son de ejemplo y podrás revisarlos.</p>
        <Button onClick={()=>start('small')}>Simular recibo de 5 productos</Button><Button variant="secondary" onClick={()=>start('large')}>Simular recibo de 50 productos</Button>
      </Card>
      <Card className="purchase-choice"><span className="choice-icon"><Icon name="edit"/></span><h2>A mano, sin foto</h2><p>Indica el establecimiento, la fecha y los artículos de tu compra.</p><Button onClick={()=>start('manual')}>Registrar compra manualmente</Button></Card>
    </div>}
    <ConfirmationDialog open={discard} title="¿Descartar esta compra?" description="Se perderán solo los cambios del borrador. El inventario y los gastos no cambiarán." confirmLabel="Descartar compra" onCancel={()=>setDiscard(false)} onConfirm={()=>{run({type:'discardDraft'});setDiscard(false);}}/>
  </>;
}
