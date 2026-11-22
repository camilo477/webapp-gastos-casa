import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import { PageHeading } from '../../components/Surface';
import { SpendingSummary } from '../../components/SpendingSummary';
import { PurchaseHistory } from '../../components/PurchaseHistory';
import { EmptyState } from '../../components/Feedback';
import { useDemo } from '../../state/DemoContext';

export function HomePage(){
  const {state}=useDemo();return <>
    <PageHeading title="Tu casa, en orden.">Hola. Qué bueno tenerte por aquí.</PageHeading>
    <div className="home-layout"><div className="stack"><SpendingSummary home/>
      <Link className="btn btn-block" to="/compras/nueva"><Icon name="plus"/>Registrar compra</Link><p className="muted">Con un recibo simulado o a mano.</p>
      <div className="quick-links"><Link className="quick-link" to="/inventario"><Icon name="inventory"/><span>Mi inventario</span></Link><Link className="quick-link" to="/lista"><Icon name="list"/><span>Mi lista</span></Link></div>
    </div><section aria-labelledby="recent-purchases"><div className="section-heading"><h2 id="recent-purchases">Compras recientes</h2></div>
      {state.purchases.length?<PurchaseHistory purchases={state.purchases.slice(0,2)}/>:<EmptyState title="Aún no hay compras">Registra tu primera compra de esta sesión.</EmptyState>}<Link className="section-link" to="/gastos">Ver todas las compras</Link>
    </section></div>
  </>;
}
