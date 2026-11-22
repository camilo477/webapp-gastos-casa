import { Link, RouterProvider, type RouteObject, type createBrowserRouter } from 'react-router';
import { EmptyState } from '../components/Feedback';
import { HomePage } from '../features/home/HomePage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { NewPurchasePage } from '../features/purchases/NewPurchasePage';
import { ReviewPurchasePage } from '../features/purchases/ReviewPurchasePage';
import { ShoppingListPage } from '../features/shopping-list/ShoppingListPage';
import { ExpensesPage } from '../features/expenses/ExpensesPage';
import { PageHeading } from '../components/Surface';
import { DemoProvider } from '../state/DemoContext';
import type { DomainState } from '../domain/types';
import { AppShell } from './AppShell';

function NotFoundPage(){return <><PageHeading title="No encontramos esta página"/><EmptyState title="Volvamos a casa" action={<Link className="btn" to="/">Ir a Inicio</Link>}>Puedes seguir desde la pantalla principal.</EmptyState></>;}
export const appRoutes: RouteObject[]=[{element:<AppShell/>,children:[
  {index:true,element:<HomePage/>},{path:'inventario',element:<InventoryPage/>},
  {path:'compras/nueva',element:<NewPurchasePage/>},{path:'compras/revisar',element:<ReviewPurchasePage/>},
  {path:'lista',element:<ShoppingListPage/>},{path:'gastos',element:<ExpensesPage/>},{path:'*',element:<NotFoundPage/>},
]}];
export function App({router,initialState}:{router:ReturnType<typeof createBrowserRouter>;initialState?:DomainState}){
  return <DemoProvider initialState={initialState}><RouterProvider router={router}/></DemoProvider>;
}
