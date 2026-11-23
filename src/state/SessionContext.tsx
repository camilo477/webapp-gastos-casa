import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { SessionPort, SessionState } from '../application/ports';

const SessionContext = createContext<{ service: SessionPort; state: SessionState } | null>(null);
export function SessionProvider({ service, children }: { service: SessionPort; children: ReactNode }) {
  const state = useSyncExternalStore(service.subscribe, service.current);
  return <SessionContext.Provider value={{ service, state }}>{children}</SessionContext.Provider>;
}
export function useSession() { return useContext(SessionContext); }
