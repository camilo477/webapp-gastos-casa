import { describe, expect, it, vi } from 'vitest';
import { EMULATOR_CONFIG, readConfiguration, requireDemoConfiguration } from './configuration';
import { createFirebaseServices } from '../adapters/firebase/disabled';

const local = {
  VITE_APP_MODE: 'emulator', VITE_FIREBASE_PROJECT_ID: 'demo-mi-casa-05a',
  VITE_AUTH_EMULATOR_HOST: '127.0.0.1:9299', VITE_FIRESTORE_EMULATOR_HOST: '127.0.0.1:8386',
  VITE_FUNCTIONS_EMULATOR_HOST: '127.0.0.1:5205',
};
describe('configuration fails closed without remote requests', () => {
  it('keeps demo as default even when unrelated Firebase variables exist', () => {
    expect(readConfiguration({})).toEqual({ mode: 'demo' });
    expect(readConfiguration({ VITE_FIREBASE_PROJECT_ID: 'untrusted' })).toEqual({ mode: 'demo' });
    expect(() => requireDemoConfiguration({})).not.toThrow();
  });
  it('accepts only explicit, complete, exact loopback emulator configuration', () => {
    expect(readConfiguration(local)).toEqual(EMULATOR_CONFIG);
    for (const key of Object.keys(local).filter(k => k !== 'VITE_APP_MODE')) {
      expect(() => readConfiguration({ ...local, [key]: undefined })).toThrow('INVALID_LOCAL_CONFIGURATION');
      expect(() => readConfiguration({ ...local, [key]: 'real-or-public' })).toThrow('INVALID_LOCAL_CONFIGURATION');
    }
  });
  it('rejects unknown, staging and production modes, and emulator mode in the current React entry', () => {
    for (const mode of ['', 'staging', 'production', 'unknown']) expect(() => readConfiguration({ VITE_APP_MODE: mode })).toThrow('DISABLED_05A');
    expect(() => requireDemoConfiguration(local)).toThrow('NOT_CONNECTED_05A');
  });
  it('cannot initialize remote adapters or send a request', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    try {
      expect(() => createFirebaseServices(EMULATOR_CONFIG)).toThrow('ADAPTER_DISABLED_05A');
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally { fetchSpy.mockRestore(); }
  });
});
