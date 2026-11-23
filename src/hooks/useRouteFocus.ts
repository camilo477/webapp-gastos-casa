import { useEffect } from 'react';
import { useLocation } from 'react-router';

const titles: Record<string, string> = {
  '/acceso': 'Ingresar',
  '/': 'Inicio', '/inventario': 'Inventario', '/compras/nueva': 'Registrar compra',
  '/compras/revisar': 'Revisar compra', '/lista': 'Mi lista', '/gastos': 'Gastos',
};

export function useRouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => {
    const normalizedPathname = pathname.replace(/\/+$/, '') || '/';
    document.title = `${titles[normalizedPathname] ?? 'Página no encontrada'} · Mi Casa`;
    window.scrollTo(0, 0);
    document.getElementById('contenido')?.focus({ preventScroll: true });
  }, [pathname]);
}
