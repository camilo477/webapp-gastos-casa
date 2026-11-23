import { HttpsError } from 'firebase-functions/v2/https';
import { AccessError } from '../application/executor.js';
import { ConflictError, ValidationError } from '../experimental/validation.js';

// Apply to every callable, including lookup: never emit raw database errors/payloads.
export async function callableResult<T>(work: () => Promise<T>): Promise<T> {
  try { return await work(); }
  catch (error) {
    if (error instanceof AccessError) throw new HttpsError(error.code, error.message);
    if (error instanceof ValidationError) throw new HttpsError('invalid-argument', error.message);
    if (error instanceof ConflictError) throw new HttpsError(error.message === 'IDEMPOTENCY_CONFLICT' ? 'already-exists' : 'failed-precondition', error.message);
    throw new HttpsError('aborted', 'OPERATION_RESULT_UNCERTAIN');
  }
}
