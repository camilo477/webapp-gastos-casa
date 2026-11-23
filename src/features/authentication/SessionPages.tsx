import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { AuthenticationError, authenticationMessage } from '../../application/authentication-errors';
import { Button } from '../../components/Button';
import { TextField } from '../../components/Fields';
import { LoadingIndicator } from '../../components/Feedback';
import { Header } from '../../components/Header';
import { PageHeading } from '../../components/Surface';
import { useRouteFocus } from '../../hooks/useRouteFocus';
import { useSession } from '../../state/SessionContext';

function AccessLayout({ children }: { children: ReactNode }) {
  useRouteFocus();
  return <div className="app-shell access-shell"><Header contextual/>
    <main id="contenido" className="app-main" tabIndex={-1}>{children}</main>
  </div>;
}
export function SessionLoading() {
  return <AccessLayout><LoadingIndicator label="Estamos comprobando tu sesión…"/></AccessLayout>;
}
export function RequireSession() {
  const session = useSession(), location = useLocation();
  if (!session || session.state.status === 'checking') return <SessionLoading/>;
  if (session.state.status !== 'authenticated') return <Navigate to="/acceso" replace state={{ from: location.pathname + location.search }}/>;
  return <Outlet/>;
}
export function LoginPage() {
  const session = useSession(), location = useLocation();
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const submitting = useRef(false), errorRef = useRef<HTMLParagraphElement>(null);
  if (!session) return <Navigate to="/" replace/>;
  if (session.state.status === 'checking') return <SessionLoading/>;
  if (session.state.status === 'authenticated') {
    const from: unknown = location.state?.from;
    const destination = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/acceso') ? from : '/';
    return <Navigate to={destination} replace/>;
  }
  const message = error || session.state.message;
  const local = session.service.options.mode === 'emulator';
  const methods = session.service.options.methods;
  async function googleSignIn() {
    if (submitting.current || !session) return;
    submitting.current = true; setBusy(true); setError('');
    try { await session.service.signIn({ method: 'google' }); }
    catch (cause) {
      setError(cause instanceof AuthenticationError ? cause.message : authenticationMessage(null));
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally { submitting.current = false; setBusy(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !session) return;
    const form = event.currentTarget, fields = new FormData(form);
    submitting.current = true; setBusy(true); setError('');
    const request = { method: 'password' as const, email: String(fields.get('email') ?? ''), password: String(fields.get('password') ?? '') };
    // Only the SDK receives the password. Clear the input before awaiting the network.
    (form.elements.namedItem('password') as HTMLInputElement).value = '';
    try { await session.service.signIn(request); }
    catch (cause) {
      setError(cause instanceof AuthenticationError ? cause.message : authenticationMessage(null));
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally { request.password = ''; submitting.current = false; setBusy(false); }
  }
  return <AccessLayout>
    <PageHeading title="Bienvenida a Mi Casa">Ingresa para probar el acceso a tus compras y productos.</PageHeading>
    <section className="panel stack access-card" aria-label="Inicio de sesión">
      <p className="muted">{local ? 'Prueba local de acceso. Usa únicamente una cuenta ficticia.' : 'Prueba de acceso autorizada. Ingresa con la cuenta acordada para esta prueba.'}</p>
      {message && <p ref={errorRef} role="alert" tabIndex={-1} className="field-error">{message}</p>}
      {methods.includes('google') && <Button className="btn-block" disabled={busy} onClick={() => { void googleSignIn(); }}>{busy ? 'Ingresando…' : 'Ingresar con Google'}</Button>}
      {methods.includes('password') && <form className="stack" onSubmit={submit} aria-busy={busy}>
        <TextField label="Correo electrónico" name="email" type="email" help={local ? 'Usa el correo ficticio de prueba terminado en @example.test.' : undefined} autoComplete="username" autoCapitalize="none" spellCheck={false} required disabled={busy}/>
        <TextField label="Contraseña" name="password" type="password" autoComplete="current-password" required disabled={busy}/>
        <Button type="submit" className="btn-block" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</Button>
      </form>}
      {session.state.status === 'error' && <Button variant="secondary" onClick={() => { setError(''); void session.service.recheck(); }}>Volver a comprobar la sesión</Button>}
      <p className="muted small">Este acceso no guarda compras ni productos en la nube. El modo demostración se puede usar sin una cuenta.</p>
    </section>
  </AccessLayout>;
}

export function SessionActions() {
  const session = useSession();
  const [error, setError] = useState('');
  if (!session) return null;
  const label = session.service.options.mode === 'emulator' ? 'Prueba local de acceso' : 'Prueba de acceso autorizada';
  return <aside className="demo-mode" aria-label={label}>
    <p><strong>{label}.</strong> Los datos de ejemplo no pertenecen a esta cuenta. Al salir se descartan los cambios de esta sesión.</p>
    <Button variant="secondary" className="btn-small" onClick={() => { setError(''); void session.service.signOut().catch(cause => {
      setError(cause instanceof AuthenticationError ? cause.message : authenticationMessage(null));
    }); }}>Cerrar sesión</Button>
    {error && <p role="alert" className="field-error">{error}</p>}
  </aside>;
}
