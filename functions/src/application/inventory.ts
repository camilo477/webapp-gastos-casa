import { createHash } from 'node:crypto';
import { authorize, type Identity } from './executor.js';
import type { OperationRepository } from './repository.js';
import type { ProductMetadata, Status, StoredProduct } from '../experimental/types.js';
import { ConflictError, ensure, id, integer, keys, parseProduct, stable } from '../experimental/validation.js';

// Local 05C-1 protocol. These are experimental 04C limits, not production DP approval.
type Common = { schemaVersion: 1; operationId: string; productId: string };
type Command = Common & (
  { kind: 'inventoryCreate'; product: ProductMetadata & ({ control: 'exact'; quantityMilli: number } | { control: 'simple'; status: Status }) }
  | { kind: 'inventoryEdit'; expectedVersion: number; name: string; categoryId: ProductMetadata['categoryId'] }
  | { kind: 'inventoryAdjust'; expectedVersion: number; action: 'add' | 'consume' | 'set'; value: number | Status }
);
function category(value: unknown): void { ensure(typeof value === 'string' && ['food', 'cleaning', 'service'].includes(value)); }
function name(value: unknown): void { ensure(typeof value === 'string' && value.trim().length > 0 && value.length <= 100, 'INVALID_TEXT'); }
export function parseInventoryCommand(input: unknown): Command {
  ensure(input !== null && typeof input === 'object');
  const kind = (input as Record<string, unknown>).kind;
  const common = ['schemaVersion', 'operationId', 'productId', 'kind'];
  ensure(typeof kind === 'string' && ['inventoryCreate', 'inventoryEdit', 'inventoryAdjust'].includes(kind));
  keys(input, [...common, ...(kind === 'inventoryCreate' ? ['product'] : kind === 'inventoryEdit' ? ['expectedVersion', 'name', 'categoryId'] : ['expectedVersion', 'action', 'value'])]);
  ensure(input.schemaVersion === 1); id(input.operationId); id(input.productId);
  if (kind === 'inventoryCreate') {
    const p = input.product as Record<string, unknown> | null;
    ensure(p && typeof p === 'object');
    keys(p, ['name', 'categoryId', 'control', 'unit', p.control === 'exact' ? 'quantityMilli' : 'status']);
    parseProduct({ ...p, version: 0, updatedAt: { toMillis: () => 0 } });
  } else {
    integer(input.expectedVersion);
    if (kind === 'inventoryEdit') { name(input.name); category(input.categoryId); }
    else {
      ensure(typeof input.action === 'string' && ['add', 'consume', 'set'].includes(input.action));
      if (typeof input.value === 'number') integer(input.value, input.action === 'set' ? 0 : 1);
      else ensure(input.action === 'set' && typeof input.value === 'string' && ['available', 'low', 'empty'].includes(input.value));
    }
  }
  return input as unknown as Command;
}
export function createInventoryExecutor(repositoryFor: (uid: string) => OperationRepository, allowedUid: string) {
  return async (auth: Identity, input: unknown) => {
    const uid = authorize(auth, allowedUid);
    ensure(Buffer.byteLength(JSON.stringify({ data: input })) <= 8192, 'REQUEST_TOO_LARGE');
    const command = parseInventoryCommand(structuredClone(input));
    const hash = createHash('sha256').update(stable(command)).digest('hex');
    return repositoryFor(uid).transaction(async tx => {
      const previous = await tx.findOperation(command.operationId);
      if (previous) {
        if (previous.intentHash !== hash) throw new ConflictError('IDEMPOTENCY_CONFLICT');
        return { status: 'already-confirmed', operationId: command.operationId, productId: command.productId };
      }
      const originals = await tx.readProducts([command.productId]);
      const raw = originals.get(command.productId), now = tx.now();
      let product: StoredProduct;
      if (command.kind === 'inventoryCreate') {
        if (raw != null) throw new ConflictError('PRODUCT_EXISTS');
        product = { ...command.product, name: command.product.name.trim(), version: 0, updatedAt: now };
      } else {
        ensure(raw != null, 'PRODUCT_NOT_FOUND');
        const before = parseProduct(raw);
        if (before.version !== command.expectedVersion) throw new ConflictError('VERSION_CONFLICT');
        product = { ...before, version: before.version + 1, updatedAt: now };
        if (command.kind === 'inventoryEdit') product = { ...product, name: command.name.trim(), categoryId: command.categoryId };
        else if (product.control === 'exact') {
          ensure(typeof command.value === 'number', 'INCOMPATIBLE_CONTROL');
          product.quantityMilli = command.action === 'set' ? command.value : product.quantityMilli + (command.action === 'add' ? command.value : -command.value);
        } else {
          ensure(command.action === 'set' && typeof command.value === 'string', 'INCOMPATIBLE_CONTROL');
          product.status = command.value;
        }
      }
      parseProduct(product); // Includes integer, scale, maximum, nonnegative and version checks.
      const stock = (p: StoredProduct) => p.control === 'exact' ? p.quantityMilli : p.status;
      const before = raw == null ? (product.control === 'exact' ? 0 : product.status) : stock(parseProduct(raw));
      tx.writeProduct(command.productId, product, raw != null);
      tx.createOperation({ schemaVersion: 1, operationId: command.operationId, kind: command.kind,
        intentHash: hash, createdAt: now, productIds: [command.productId], productId: command.productId, command,
        movements: command.kind === 'inventoryEdit' ? [] : [{ id: command.operationId, productId: command.productId,
          kind: 'adjustment', before, after: stock(product), unit: product.unit }] });
      return { status: 'confirmed', operationId: command.operationId, productId: command.productId };
    });
  };
}
