import { useEffect, useRef, useState } from 'react';
import { InventoryError } from '../application/inventory';
import { useLocalInventory } from '../state/InventoryContext';

export function useInventorySave() {
  const inventory = useLocalInventory();
  const [busy, setBusy] = useState(false), [error, setError] = useState<InventoryError | null>(null);
  const attempt = useRef<(() => Promise<void>) | null>(null), active = useRef(true), running = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  function run(action: () => Promise<void>, done: () => void) {
    if (running.current) return;
    attempt.current ??= action; // A lost response must retry the exact same intent and ID.
    running.current = true; setBusy(true); setError(null); inventory?.setPending(true);
    void Promise.resolve().then(attempt.current).then(() => {
      if (!active.current) return;
      inventory?.setPending(false); attempt.current = null; done();
    }).catch((cause: unknown) => {
      if (!active.current) return;
      const failure = cause instanceof InventoryError ? cause : new InventoryError('No pudimos comprobar el guardado. Reinténtalo.', true);
      if (!failure.uncertain) { attempt.current = null; inventory?.setPending(false); }
      setError(failure); requestAnimationFrame(() => errorRef.current?.focus());
    }).finally(() => { running.current = false; if (active.current) setBusy(false); });
  }
  return { run, busy, locked: busy || Boolean(error?.uncertain), retry: Boolean(error?.uncertain),
    errorNode: error ? <p className="field-error" role="alert" ref={errorRef} tabIndex={-1}>{error.message}</p> : null };
}
