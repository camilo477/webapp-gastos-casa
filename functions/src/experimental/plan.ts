import type { Intent, Movement, StoredProduct, TimeValue } from './types.js';
import { ConflictError, delta, integer, lineMetadata, metadata, net, parseProduct, stable } from './validation.js';

// Pure planning: no Firestore/Admin, logging, network, clocks or random IDs.
export function plan(intent: Intent, originals: ReadonlyMap<string, unknown | null>, now: TimeValue) {
  const changed = new Map<string, StoredProduct>();
  const movements: Movement[] = [];
  if (intent.kind === 'purchase') {
    for (const line of intent.lines) {
      if (line.kind === 'expense') continue;
      const raw = originals.get(line.productId);
      const prior = raw == null ? null : parseProduct(raw);
      if (line.newProduct !== !prior) throw new ConflictError('PRODUCT_EXISTENCE_CHANGED');
      let p = changed.get(line.productId);
      if (!p) {
        p = prior ? { ...prior } : parseProduct({ ...lineMetadata(line), version: 0, updatedAt: now,
          ...(line.control === 'exact' ? { quantityMilli: 0 } : { status: 'empty' }) });
        changed.set(line.productId, p);
      }
      if (stable(metadata(p)) !== stable(lineMetadata(line))) throw new ConflictError('PRODUCT_IDENTITY_CHANGED');
      const before = p.control === 'exact' ? p.quantityMilli : p.status;
      const amount = delta(line, p);
      if (p.control === 'exact') p.quantityMilli = integer(p.quantityMilli + amount);
      else p.status = line.stockStatus;
      movements.push({ id: `purchase:${intent.operationId}:${line.id}`, lineId: line.id, productId: line.productId,
        kind: 'purchase', before, after: p.control === 'exact' ? p.quantityMilli : p.status, unit: p.unit });
    }
  } else {
    const raw = originals.get(intent.productId);
    if (raw == null) throw new ConflictError('STALE_ADJUSTMENT');
    const p = parseProduct(raw);
    if (p.version !== intent.expectedVersion) throw new ConflictError('STALE_ADJUSTMENT');
    const n = parseProduct({ ...p, ...(p.control === 'exact' ? { quantityMilli: intent.after } : { status: intent.after }) });
    changed.set(intent.productId, n);
    movements.push({ id: `adjust:${intent.operationId}`, productId: intent.productId, kind: 'adjustment',
      before: p.control === 'exact' ? p.quantityMilli : p.status, after: intent.after, unit: p.unit });
  }
  for (const [key, p] of changed) {
    const raw = originals.get(key);
    p.version = integer((raw == null ? -1 : parseProduct(raw).version) + 1); p.updatedAt = now;
    parseProduct(p);
  }
  return { changed, movements,
    lines: intent.kind === 'purchase' ? intent.lines.map(l => ({ ...l, netCOP: net(l) })) : [] };
}
