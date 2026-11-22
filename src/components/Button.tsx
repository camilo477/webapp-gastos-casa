import type { ComponentPropsWithRef } from 'react';
import { Icon, type IconName } from './Icon';

type Props = ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'soft' | 'danger';
  icon?: IconName;
};

export function Button({ variant = 'primary', icon, className = '', children, ...props }: Props) {
  const variantClass = variant === 'primary' ? '' : `btn-${variant}`;
  return <button type="button" className={`btn ${variantClass} ${className}`} {...props}>
    {icon && <Icon name={icon} />}{children}
  </button>;
}

export function UnavailableButton({ children, ...props }: Omit<Props, 'onClick' | 'disabled'>) {
  return <Button {...props} disabled aria-describedby="demo-availability">{children}</Button>;
}
