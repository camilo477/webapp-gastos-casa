import { useState } from 'react';

// Región persistente: anuncia resultados sin desplazar el foco de la tarea.
export function useStatusMessage() {
  const [status, setStatus] = useState({ message: '', revision: 0 });
  function announce(message: string) {
    setStatus(previous => ({ message, revision: previous.revision + 1 }));
  }
  const statusNode = <p className="status-message" role="status" aria-atomic="true">
    <span key={status.revision}>{status.message}</span>
  </p>;
  return { announce, statusNode };
}
