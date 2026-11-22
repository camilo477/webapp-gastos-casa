import { describe, expect, it, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { App, appRoutes } from './App';

function openApp(path='/'){const router=createMemoryRouter(appRoutes,{initialEntries:[path]});render(<App router={router}/>);return router;}
describe('Modo demostración integrado',()=>{
  it.each([['/','Tu casa, en orden.'],['/inventario','Mi inventario'],['/compras/nueva','Registrar compra'],['/compras/revisar','Revisar compra'],['/lista','Mi lista'],['/gastos','Mis gastos']])('abre %s sin errores de consola',async(path,heading)=>{
    const errors=vi.spyOn(console,'error').mockImplementation(()=>undefined);
    try{openApp(path);expect(await screen.findByRole('heading',{level:1,name:heading})).toBeInTheDocument();expect(screen.getByText('Modo demostración.')).toBeInTheDocument();expect(errors).not.toHaveBeenCalled();}finally{errors.mockRestore();}
  });
  it('conecta navegación principal con una sola sesión',async()=>{
    const user=userEvent.setup();openApp();await user.click(screen.getByRole('link',{name:'Inventario'}));expect(screen.getByRole('heading',{level:1,name:'Mi inventario'})).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox',{name:'Buscar un producto'}),'leche');expect(screen.getByRole('heading',{name:'Leche entera'})).toBeInTheDocument();expect(screen.queryByRole('heading',{name:'Arroz'})).not.toBeInTheDocument();
  });
  it('filtra una compra grande dentro de React y conserva el total',async()=>{
    const user=userEvent.setup();openApp('/compras/revisar?ejemplo=grande');
    await waitFor(()=>expect(document.querySelectorAll('.compact-review-item')).toHaveLength(50));expect(screen.getAllByText('435.600')).toHaveLength(2);
    await user.click(screen.getByRole('button',{name:'Por revisar (6)'}));expect(document.querySelectorAll('.compact-review-item')).toHaveLength(6);expect(screen.getAllByText('435.600')).toHaveLength(2);
  });
  it('resuelve un pendiente sin exigir editar los cinco artículos',async()=>{
    const user=userEvent.setup();openApp('/compras/revisar');
    await user.click(await screen.findByRole('button',{name:'Por revisar (1)'}));const summary=document.querySelector('summary')!;await user.click(summary);
    await user.click(screen.getByRole('button',{name:'Marcar revisado Leche entera'}));expect(screen.getByRole('heading',{name:'No quedan artículos pendientes'})).toBeInTheDocument();expect(screen.getByRole('button',{name:'Guardar compra'})).toBeEnabled();
  });
  it('advierte al salir, permite seguir y descarta sin actualizar inventario',async()=>{
    const user=userEvent.setup();openApp('/compras/revisar');await screen.findByRole('button',{name:'Por revisar (1)'});
    await user.click(screen.getByRole('link',{name:'Volver'}));const dialog=screen.getByRole('dialog',{name:'¿Descartar esta compra?'});
    await user.click(within(dialog).getByRole('button',{name:'Seguir revisando'}));expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('link',{name:'Volver'}));await user.click(screen.getByRole('button',{name:'Descartar y salir'}));expect(screen.getByRole('button',{name:'Registrar compra manualmente'})).toBeInTheDocument();
    await user.click(screen.getByRole('link',{name:'Volver'}));expect(screen.getByText('286.400')).toBeInTheDocument();
  });
  it('marca la lista sin afectar el gasto y confirma su finalización',async()=>{
    const user=userEvent.setup();openApp('/lista');await user.click(screen.getByRole('checkbox',{name:/Café molido/}));
    await user.click(screen.getByRole('button',{name:'Finalizar y descartar lista'}));await user.click(screen.getByRole('button',{name:'Finalizar y descartar'}));
    expect(screen.getByRole('heading',{name:'No tienes una lista activa'})).toBeInTheDocument();await user.click(screen.getByRole('link',{name:'Gastos'}));expect(screen.getByText('286.400')).toBeInTheDocument();
  });
  it('muestra validaciones en español y evita el producto duplicado',async()=>{
    const user=userEvent.setup();openApp('/inventario');await user.click(screen.getByRole('button',{name:'Añadir producto'}));
    await user.type(screen.getByRole('textbox',{name:'Nombre del producto'}),'LECHE ENTERA');await user.click(screen.getByRole('button',{name:'Guardar producto'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya hay un producto');expect(screen.getAllByRole('heading',{name:'Leche entera'})).toHaveLength(1);
  });
  it('asocia el error de existencias con su campo y anuncia una corrección válida',async()=>{
    const user=userEvent.setup();openApp('/inventario');
    await user.click(screen.getByRole('button',{name:'Actualizar cuánto queda de Leche entera'}));
    const quantity=screen.getByRole('textbox',{name:'Cuánto hay ahora'});await user.clear(quantity);await user.type(quantity,'-1');
    await user.click(screen.getByRole('button',{name:'Guardar existencias'}));
    expect(quantity).toHaveAttribute('aria-invalid','true');expect(quantity).toHaveAccessibleDescription(/cantidad válida/);
    await waitFor(()=>expect(screen.getByRole('alert')).toHaveFocus());
    await user.clear(quantity);await user.type(quantity,'6');await user.click(screen.getByRole('button',{name:'Guardar existencias'}));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();expect(screen.getByText('6 unidades')).toBeInTheDocument();
    expect(screen.getByText('Leche entera: existencias actualizadas en esta sesión. Tus gastos no cambian.').closest('[role="status"]')).toBeInTheDocument();
  });
  it('restablece los ejemplos con confirmación',async()=>{
    const user=userEvent.setup();openApp('/lista');await user.click(screen.getByRole('button',{name:'Finalizar y descartar lista'}));await user.click(screen.getByRole('button',{name:'Finalizar y descartar'}));
    await user.click(screen.getByRole('button',{name:'Restablecer datos de ejemplo'}));await user.click(screen.getByRole('button',{name:'Restablecer ejemplos'}));
    expect(screen.getByRole('heading',{level:1,name:'Tu casa, en orden.'})).toBeInTheDocument();await user.click(within(screen.getByRole('navigation',{name:'Secciones principales'})).getByRole('link',{name:'Mi lista'}));
    expect(screen.getByRole('heading',{name:'Mi próxima compra'})).toBeInTheDocument();
  });
  it('trata las direcciones desconocidas y las barras finales',async()=>{
    const user=userEvent.setup();openApp('/pagina-inexistente');expect(screen.getByRole('link',{name:'Ir a Inicio'})).toHaveAttribute('href','/');
    await user.click(screen.getByRole('link',{name:'Ir a Inicio'}));expect(document.title).toBe('Inicio · Mi Casa');
  });
});
