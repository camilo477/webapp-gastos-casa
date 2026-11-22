import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';

// Los saltos conservan el historial del router y la protección del borrador.
export function InPageLink({ target, className = 'section-link', children }: {
  target: string; className?: string; children: ReactNode;
}) {
  const { pathname, search } = useLocation();
  return <Link to={{ pathname, search, hash: '#' + target }} replace preventScrollReset className={className}
    onClick={event => {
      if (event.button || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      requestAnimationFrame(() => {
        const element = document.getElementById(target);
        element?.focus({ preventScroll: true });
        element?.scrollIntoView({ block: 'start' });
      });
    }}>{children}</Link>;
}
