import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`panel ${className}`} {...props}>{children}</div>;
}

export function PageHeading({ title, children, eyebrow }: { title: string; children?: ReactNode; eyebrow?: string }) {
  return <header className="page-intro">
    {eyebrow && <p className="eyebrow">{eyebrow}</p>}
    <h1>{title}</h1>{children && <p className="muted">{children}</p>}
  </header>;
}
