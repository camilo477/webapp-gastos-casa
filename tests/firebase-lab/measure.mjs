import { pathToFileURL } from 'node:url';
import { fixtureState, intent, transition, physicalLine } from './model.mjs';
import { PROJECT, UID } from './guard.mjs';

const bytes = value => Buffer.byteLength(value, 'utf8');
const str = value => bytes(value) + 1;
// Official storage-size calculation, NOT protobuf size or a production measurement.
// Maps use document field sizing (+32 overhead), with no document name.
export function valueBytes(v) {
  if (v === null || typeof v === 'boolean') return 1;
  if (typeof v === 'number' || v instanceof Date) return 8;
  if (typeof v === 'string') return str(v);
  if (Array.isArray(v)) return v.reduce((sum, item) => sum + valueBytes(item), 0);
  return 32 + Object.entries(v).reduce((sum, [k, item]) => sum + str(k) + valueBytes(item), 0);
}
export const documentBytes = (path, data) => path.split('/').reduce((sum, p) => sum + str(p), 16) + valueBytes(data);
export function restValue(v) {
  if (v === null) return { nullValue: null };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return { integerValue: String(v) };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(restValue) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, item]) => [k, restValue(item)])) } };
}
export function restCommit(result) {
  const base = `projects/${PROJECT}/databases/(default)/documents/users/${UID}`;
  return { writes: [[`${base}/state/current`, result.next, 'updatedAt'],
    [`${base}/operations/${result.operation.operationId}`, result.operation, 'createdAt']].map(([name, data, time]) => {
    const fields = restValue(data).mapValue.fields; delete fields[time];
    if (data.kind === 'purchase') fields.purchaseDate = restValue(new Date(`${data.purchaseDate}T00:00:00Z`));
    return { update: { name, fields }, updateTransforms: [{ fieldPath: time, setToServerValue: 'REQUEST_TIME' }] };
  }) };
}
export function measure(catalog, count, { longNames = false, repeated = false } = {}) {
  const old = fixtureState(catalog, longNames), input = intent(`size-${catalog}-${count}`, count);
  input.lines = input.lines.map((_, i) => physicalLine(i, `p${repeated ? 0 : i}`, old.products[`p${repeated ? 0 : i}`]));
  const r = transition(old, input);
  const next = { ...r.next, updatedAt: new Date(0) };
  const op = { ...r.operation, createdAt: new Date(0), purchaseDate: new Date('2026-11-22T00:00:00Z') };
  const stateBytes = documentBytes(`users/${UID}/state/current`, next);
  const opBytes = documentBytes(`users/${UID}/operations/${input.operationId}`, op);
  return { catalog, count, longNames, repeated, stateBytes, operationBytes: opBytes,
    restCommitBodyBytes: bytes(JSON.stringify(restCommit(r))),
    stateWithin1MiB: stateBytes <= 1048576, operationWithin1MiB: opBytes <= 1048576 };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const catalog of [100, 500, 1000]) for (const count of [5, 50, 100]) console.log(JSON.stringify(measure(catalog, count)));
  console.log(JSON.stringify(measure(1000, 100, { longNames: true })));
  console.log(JSON.stringify(measure(100, 50, { repeated: true })));
}
