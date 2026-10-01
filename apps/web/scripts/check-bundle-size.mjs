// Performance budget gate: fails the build if the entry JS chunk (gzip) exceeds budget.
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const dir = new URL('../dist/assets/', import.meta.url);
const BUDGET_KB = { entry: 90, total: 260 };
const files = readdirSync(dir).filter((f) => f.endsWith('.js'));
let total = 0;
let entry = 0;
for (const f of files) {
  const kb = gzipSync(readFileSync(new URL(f, dir))).length / 1024;
  total += kb;
  if (f.startsWith('index-')) entry = kb;
  console.log(`${kb.toFixed(1).padStart(7)} kB gz  ${f}`);
}
console.log(
  `entry ${entry.toFixed(1)} kB (budget ${BUDGET_KB.entry}) · total JS ${total.toFixed(1)} kB (budget ${BUDGET_KB.total})`,
);
if (entry > BUDGET_KB.entry || total > BUDGET_KB.total) {
  console.error('✖ Performance budget exceeded');
  process.exit(1);
}
