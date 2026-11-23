import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { App, createAppRoutes } from './app/App';
import { readConfiguration, requireLocalAuthentication, requireTestAuthentication } from './application/configuration';
import type { SessionPort } from './application/ports';
import type { LocalInventoryPort } from './application/inventory';
import './styles/app.css';
async function start() {
  const configuration = readConfiguration(import.meta.env);
  let session: SessionPort | undefined;
  let inventory: LocalInventoryPort | undefined;
  if (configuration.mode === 'emulator') {
    requireLocalAuthentication(configuration, window.location.hostname);
    const { createEmulatorSession } = await import('./adapters/firebase/authentication');
    session = createEmulatorSession(configuration, window.location.hostname);
    const { createEmulatorInventory } = await import('./adapters/firebase/inventory');
    inventory = createEmulatorInventory(configuration, window.location.hostname);
  } else if (configuration.mode === 'auth-test') {
    requireTestAuthentication(configuration, window.location.origin);
    const { createAuthTestSession } = await import('./adapters/firebase/auth-test');
    session = createAuthTestSession(configuration, window.location.origin);
  }
  const router = createBrowserRouter(createAppRoutes(configuration.mode !== 'demo'));
  createRoot(document.getElementById('root')!).render(<StrictMode><App router={router} session={session} inventory={inventory}/></StrictMode>);
  import.meta.hot?.dispose(() => { router.dispose(); void inventory?.dispose().finally(() => session?.dispose()); if (!inventory) void session?.dispose(); });
}
void start().catch(() => {
  // Configuration and import failures never fall back to demo or a remote project.
  const root = document.getElementById('root')!;
  root.textContent = 'No podemos abrir Mi Casa con esta configuración. Revisa la configuración local antes de continuar.';
  root.setAttribute('role', 'alert');
});
