import { readFileSync, writeFileSync } from 'node:fs';

export function generateRules() {
  const groups = Array.from({ length: 10 }, (_, group) => {
    const checks = Array.from({ length: 10 }, (_, j) => {
      const i = group * 10 + j;
      return `(o.lines.size() <= ${i} || line(o, ${i}))`;
    }).join(' &&\n        ');
    return `function checks${group}(o) { return ${checks}; }`;
  }).join('\n    ');
  const checks = `function checks(o) { return o.lines.size() == 1 ? line(o, 0) : ${Array.from({ length: 10 }, (_, i) =>
    `(o.lines.size() <= ${i * 10} || checks${i}(o))`).join(' && ')}; }`;
  return readFileSync(new URL('./firestore.template.rules', import.meta.url), 'utf8')
    .replace('// GENERATED_CHECKS', [groups, checks].join('\n    '));
}
const target = new URL('./firestore.rules', import.meta.url);
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== generateRules()) throw new Error('Regenerate lab rules');
} else writeFileSync(target, generateRules());
