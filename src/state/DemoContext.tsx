import { createContext, useCallback, useContext, useReducer, useRef, type ReactNode } from 'react';
import { createInitialState } from '../data/seed';
import { reduceDomain } from '../domain/reducer';
import { DomainError } from '../domain/validation';
import type { Command, DomainState } from '../domain/types';

export type CommandResult = { ok: true } | { ok: false; error: string };
type DemoContextValue = { state: DomainState; run: (command: Command) => CommandResult; getState: () => DomainState; reset: () => void };
const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children, initialState }: { children: ReactNode; initialState?: DomainState }) {
  const [state, publish] = useReducer((_current: DomainState, next: DomainState) => next, initialState, value => value ?? createInitialState());
  const current = useRef(state);
  // Publicar una instantánea completa y actualizar la referencia antes de otro clic.
  const run = useCallback((command: Command): CommandResult => {
    try { const next = reduceDomain(current.current, command); current.current = next; publish(next); return { ok: true }; }
    catch (error) { if (error instanceof DomainError) return { ok: false, error: error.message }; throw error; }
  }, []);
  const getState = useCallback(() => current.current, []);
  const reset = useCallback(() => { const next = createInitialState(); current.current = next; publish(next); }, []);
  return <DemoContext.Provider value={{ state, run, getState, reset }}>{children}</DemoContext.Provider>;
}
export function useDemo() { const context = useContext(DemoContext); if (!context) throw new Error('Falta DemoProvider'); return context; }
export function requireSuccess(result: CommandResult) { if (!result.ok) throw new DomainError(result.error); }
export function newId() { return crypto.randomUUID(); }
