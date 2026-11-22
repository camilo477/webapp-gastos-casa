import { Link, NavLink } from 'react-router';
import { Icon, type IconName } from './Icon';
const sections: readonly { to:string;label:string;icon:IconName }[]=[
  {to:'/',label:'Inicio',icon:'home'},{to:'/inventario',label:'Inventario',icon:'inventory'},
  {to:'/lista',label:'Mi lista',icon:'list'},{to:'/gastos',label:'Gastos',icon:'wallet'},
];
export function BottomNavigation(){return <nav className="bottom-nav" aria-label="Secciones principales">{sections.map(s=><NavLink key={s.to} className="nav-link" to={s.to} end><Icon name={s.icon}/><span>{s.label}</span></NavLink>)}</nav>;}
export function ContextNavigation({reviewing}:{reviewing:boolean}){return <nav className="context-nav" aria-label="Registro de compra"><Link className="text-btn" to={reviewing?'/compras/nueva':'/'}>Volver</Link><span aria-current="step">{reviewing?'Revisar compra':'Registrar compra'}</span></nav>;}
