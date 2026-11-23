import { ConfigurationError, type Configuration } from '../../application/configuration';

// Reserved composition point. Importing it never imports an SDK or opens a network.
// Data reads, confirmation and durable pending adapters still need separate authorization.
// Local Authentication lives in its own adapter and never calls this factory.
export function createFirebaseServices(_configuration: Configuration): never {
  throw new ConfigurationError('FIREBASE_APPLICATION_ADAPTER_DISABLED_05A');
}
