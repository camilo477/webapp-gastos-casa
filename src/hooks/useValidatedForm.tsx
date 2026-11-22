import { useRef, useState, type FormEvent } from 'react';
import { DomainError } from '../domain/validation';

class FieldError extends DomainError {
  constructor(readonly field: string, message: string) { super(message); }
}

export function useValidatedForm() {
  const [error, setError] = useState<{message:string;field?:string}|null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  function read<T>(field:string, action:()=>T):T {
    try { return action(); }
    catch (cause) {
      if (!(cause instanceof DomainError)) throw cause;
      throw new FieldError(field, cause.message);
    }
  }
  function handle(action: () => void) {
    return (event: FormEvent) => {
      event.preventDefault();
      try { action(); setError(null); }
      catch (cause) {
        if (!(cause instanceof DomainError)) throw cause;
        setError({message:cause.message,field:cause instanceof FieldError?cause.field:undefined});
        requestAnimationFrame(() => errorRef.current?.focus());
      }
    };
  }
  return { handle, read, errorFor:(field:string)=>error?.field===field?error.message:undefined,
    errorNode: error ? <p ref={errorRef} role="alert" tabIndex={-1} className="field-error">{error.message}</p> : null };
}
