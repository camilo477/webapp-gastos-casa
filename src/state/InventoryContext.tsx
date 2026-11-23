import { createContext, useContext, useState, type ReactNode } from 'react';
import type { LocalInventoryPort } from '../application/inventory';

const Context = createContext<{ service: LocalInventoryPort; pending: boolean; setPending: (value: boolean) => void } | null>(null);
export function InventoryProvider({ service, children }: { service: LocalInventoryPort; children: ReactNode }) {
  const [pending, setPending] = useState(false);
  return <Context.Provider value={{ service, pending, setPending }}>{children}</Context.Provider>;
}
export const useLocalInventory = () => useContext(Context);
