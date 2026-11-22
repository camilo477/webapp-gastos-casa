import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);
window.scrollTo = vi.fn();
HTMLElement.prototype.scrollIntoView = vi.fn();

// jsdom no implementa top layer: solo permite probar apertura/cierre y navegación.
// El foco modal real y la geometría pertenecen a las pruebas de navegador.
HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
