import { useEffect, useId, useRef } from 'react';
import { Button } from './Button';

export function ConfirmationDialog({ open, title, description, confirmLabel, cancelLabel = 'Seguir revisando', onCancel, onConfirm }: {
  open: boolean; title: string; description: string; confirmLabel: string; cancelLabel?: string; onCancel: () => void; onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [open]);

  return <dialog ref={ref} className="confirmation-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
    onCancel={event => { event.preventDefault(); onCancel(); }}>
    <div className="stack">
      <h2 id={`${id}-title`}>{title}</h2><p id={`${id}-description`}>{description}</p>
      <Button onClick={onCancel} autoFocus>{cancelLabel}</Button>
      <Button variant="secondary" onClick={onConfirm}>{confirmLabel}</Button>
    </div>
  </dialog>;
}
