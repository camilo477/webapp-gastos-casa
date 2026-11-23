import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { App, createAppRoutes } from '../../app/App';
import { AuthenticationError } from '../../application/authentication-errors';
import type { SessionOptions, SessionPort, SessionState } from '../../application/ports';

function setup(path = '/inventario', initial: SessionState = { status: 'checking', scope: 0 }, options: SessionOptions = { mode: 'emulator', methods: ['password'] }) {
  let state = initial;
  const listeners = new Set<() => void>();
  const emit = (next: SessionState) => { state = next; for (const listener of listeners) listener(); };
  const service: SessionPort = {
    options,
    current: () => state, subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    signIn: vi.fn(async () => { emit({ status: 'authenticated', scope: 1, session: { uid: 'demo-owner-05a' } }); }),
    signOut: vi.fn(async () => { emit({ status: 'anonymous', scope: state.scope + 1 }); }), recheck: vi.fn(), dispose: vi.fn(),
  };
  const router = createMemoryRouter(createAppRoutes(true), { initialEntries: [path] });
  render(<App router={router} session={service}/>);
  return { emit, service, router, user: userEvent.setup() };
}
describe('session screens and route protection', () => {
  it('never renders private content during initial verification', async () => {
    const { emit } = setup();
    expect(screen.getByRole('status')).toHaveTextContent('comprobando'); expect(screen.queryByRole('heading', { name: 'Mi inventario' })).not.toBeInTheDocument();
    act(() => emit({ status: 'anonymous', scope: 0 }));
    expect(await screen.findByRole('heading', { name: 'Bienvenida a Mi Casa' })).toBeVisible();
  });
  it('restores the requested private route after login without retaining password input', async () => {
    const { user, service, router } = setup('/inventario', { status: 'anonymous', scope: 0 });
    await user.type(await screen.findByLabelText('Correo electrónico'), 'duena@example.test');
    await user.type(screen.getByLabelText('Contraseña'), 'Only-fictional');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('heading', { name: 'Mi inventario' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/inventario'); expect(service.signIn).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('Prueba local de acceso')).toHaveTextContent('no pertenecen a esta cuenta');
  });
  it('announces errors, clears the password and permits retry', async () => {
    const { user, service } = setup('/acceso', { status: 'anonymous', scope: 0 });
    vi.mocked(service.signIn).mockRejectedValueOnce(new AuthenticationError('Revisa el correo y la contraseña.'));
    await user.type(screen.getByLabelText('Correo electrónico'), 'duena@example.test'); await user.type(screen.getByLabelText('Contraseña'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Revisa el correo'); expect(screen.getByLabelText('Contraseña')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled();
    expect(screen.queryByText(/registrar cuenta|crear cuenta/i)).not.toBeInTheDocument();
  });
  it('clears all example state across logout and subsequent identity scope', async () => {
    const { user, emit } = setup('/lista', { status: 'authenticated', scope: 1, session: { uid: 'demo-owner-05a' } });
    await user.click(screen.getByRole('button', { name: 'Finalizar y descartar lista' }));
    await user.click(screen.getByRole('button', { name: 'Finalizar y descartar' }));
    expect(await screen.findByRole('heading', { name: 'No tienes una lista activa' })).toBeVisible();
    act(() => emit({ status: 'anonymous', scope: 2 }));
    expect(await screen.findByRole('heading', { name: 'Bienvenida a Mi Casa' })).toBeVisible();
    act(() => emit({ status: 'authenticated', scope: 3, session: { uid: 'demo-owner-05a' } }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Mi próxima compra' })).toBeVisible());
  });
  it('keeps the demo usable with private prototype paths and no session service', async () => {
    render(<App router={createMemoryRouter(createAppRoutes(), { initialEntries: ['/gastos'] })}/>);
    expect(await screen.findByRole('heading', { name: 'Mis gastos' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument();
  });
  it('presents only the explicitly selected Google method with accessible cancellation and retry', async () => {
    const { user, service } = setup('/acceso', { status: 'anonymous', scope: 0 }, { mode: 'auth-test', methods: ['google'] });
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument();
    expect(screen.getByText(/Prueba de acceso autorizada/)).toBeVisible();
    vi.mocked(service.signIn).mockRejectedValueOnce(new AuthenticationError('El acceso con Google se canceló. Puedes volver a intentarlo cuando quieras.'));
    await user.click(screen.getByRole('button', { name: 'Ingresar con Google' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('se canceló');
    expect(service.signIn).toHaveBeenCalledWith({ method: 'google' });
    await user.click(screen.getByRole('button', { name: 'Ingresar con Google' }));
    expect(await screen.findByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
    expect(screen.getByLabelText('Prueba de acceso autorizada')).toHaveTextContent('no pertenecen a esta cuenta');
  });
  it('keeps the selected password alternative and prevents duplicate Google requests', async () => {
    const { user, service } = setup('/acceso', { status: 'anonymous', scope: 0 }, { mode: 'auth-test', methods: ['google', 'password'] });
    expect(screen.getByLabelText('Contraseña')).toBeVisible();
    let finish!: () => void;
    vi.mocked(service.signIn).mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
    await user.dblClick(screen.getByRole('button', { name: 'Ingresar con Google' }));
    expect(service.signIn).toHaveBeenCalledOnce(); expect(screen.getAllByRole('button', { name: 'Ingresando…' }).every(button => button.hasAttribute('disabled'))).toBe(true);
    await act(async () => { finish(); });
    expect(screen.getByRole('button', { name: 'Ingresar con Google' })).toBeEnabled();
  });
});
