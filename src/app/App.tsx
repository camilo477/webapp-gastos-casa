import { Link, Navigate, Outlet, RouterProvider, type RouteObject, type createBrowserRouter } from 'react-router';
import type { ReactNode } from 'react';
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
import type { SessionPort } from '../application/ports';
import { SessionProvider, useSession } from '../state/SessionContext';
import { LoginPage, RequireSession } from '../features/authentication/SessionPages';
import type { InventorySource } from '../application/inventory-candidate';
import { InventoryProvider } from '../state/InventoryContext';

function NotFoundPage(){return <><PageHeading title="No encontramos esta página"/><EmptyState title="Volvamos a casa" action={<Link className="btn" to="/">Ir a Inicio</Link>}>Puedes seguir desde la pantalla principal.</EmptyState></>;}
const prototypeRoutes: RouteObject[]=[{element:<AppShell/>,children:[
  {index:true,element:<HomePage/>},{path:'inventario',element:<InventoryPage/>},
  {path:'compras/nueva',element:<NewPurchasePage/>},{path:'compras/revisar',element:<ReviewPurchasePage/>},
  {path:'lista',element:<ShoppingListPage/>},{path:'gastos',element:<ExpensesPage/>},{path:'*',element:<NotFoundPage/>},
]}];
export function createAppRoutes(authenticationRequired = false): RouteObject[] {
  return [
    { path: '/acceso', element: authenticationRequired ? <LoginPage/> : <Navigate to="/" replace/> },
    { element: authenticationRequired ? <RequireSession/> : <Outlet/>, children: prototypeRoutes },
  ];
}
export const appRoutes = createAppRoutes();
function ExampleScope({ initialState, inventory, children }: { initialState?: DomainState; inventory?: InventorySource; children: ReactNode }) {
  const session = useSession();
  return <DemoProvider key={session?.state.scope ?? 'demo'} initialState={initialState}>{inventory ? <InventoryProvider service={inventory}>{children}</InventoryProvider> : children}</DemoProvider>;
}
export function App({router,initialState,session,inventory}:{router:ReturnType<typeof createBrowserRouter>;initialState?:DomainState;session?:SessionPort;inventory?:InventorySource}){
  const content = <ExampleScope initialState={initialState} inventory={inventory}><RouterProvider router={router}/></ExampleScope>;
  return session ? <SessionProvider service={session}>{content}</SessionProvider> : content;
}
