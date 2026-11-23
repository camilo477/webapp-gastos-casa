import { ConfigurationError, type Configuration } from '../../application/configuration';

// Reserved composition point. Importing it never imports an SDK or opens a network.
// Session, reads, confirmation and durable pending adapters need separate authorization.
export function createFirebaseServices(_configuration: Configuration): never {
  throw new ConfigurationError('FIREBASE_APPLICATION_ADAPTER_DISABLED_05A');
}
