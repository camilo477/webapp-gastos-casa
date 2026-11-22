import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { TextField } from './Fields';
import { Notice, LoadingIndicator } from './Feedback';

it('relaciona etiqueta, error y campo sin depender del color', () => {
  render(<TextField label="Importe del producto" value="" readOnly error="Falta el importe." />);
  const input = screen.getByRole('textbox', { name: 'Importe del producto' });
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription('Falta el importe.');
});

it('presenta advertencias con texto y carga con un estado accesible', () => {
  render(<><Notice title="Hay productos por revisar." tone="warning" icon="warning">Confirma la cantidad.</Notice><LoadingIndicator label="Estamos preparando la información." /></>);
  expect(screen.getByText('Hay productos por revisar.')).toBeInTheDocument();
  expect(screen.getByText('Confirma la cantidad.')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Estamos preparando la información.');
});
