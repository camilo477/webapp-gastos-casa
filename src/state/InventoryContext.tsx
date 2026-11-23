import { createContext, useContext, useState, type ReactNode } from 'react';
import type { InventoryService } from '../application/inventory-candidate';

const Context = createContext<{ service: InventoryService; pending: boolean; setPending: (value: boolean) => void } | null>(null);
export function InventoryProvider({ service, children }: { service: InventoryService; children: ReactNode }) {
  const [pending, setPending] = useState(false);
  return <Context.Provider value={{ service, pending, setPending }}>{children}</Context.Provider>;
}
export const useLocalInventory = () => useContext(Context);
