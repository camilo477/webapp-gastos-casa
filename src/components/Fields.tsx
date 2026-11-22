import { useId, type InputHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; help?: string; error?: string; leadingIcon?: IconName };

export function TextField({ label, help, error, leadingIcon, id: providedId, className = '', ...props }: FieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    <div className={leadingIcon ? 'search-wrap' : undefined}>
      {leadingIcon && <Icon name={leadingIcon} />}
      <input {...props} id={id} className={`input ${className}`} aria-invalid={error ? true : undefined}
        aria-describedby={help || error ? `${id}-help` : undefined} />
    </div>
    {(help || error) && <p id={`${id}-help`} className={error ? 'field-error' : 'muted small'}>{error ?? help}</p>}
  </div>;
}

type SelectProps = {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange?: (value: string) => void;
  disabled?: boolean;
};

export function SelectField({ label, value, options, onChange, disabled = !onChange }: SelectProps) {
  const id = useId();
  const selected = options.find(option => option.value === value);
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    <div className="select-wrap">
      <select id={id} value={value} disabled={disabled} onChange={event => onChange?.(event.target.value)}>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <span className="select-value" aria-hidden="true">{selected?.label}</span>
      <Icon name="chevron" />
    </div>
  </div>;
}
