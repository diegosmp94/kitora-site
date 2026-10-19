import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const excluded = new Set(['node_modules', '.git', 'dist', 'vendor', 'coverage']);
const files = [];
function visit(dir) {
  for (const name of readdirSync(dir)) {
    if (excluded.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) visit(path);
    else if (/\.(?:js|mjs|cjs)$/.test(name)) files.push(path);
  }
}
visit('.');
const failures = [];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {encoding: 'utf8'});
  if (result.status !== 0) failures.push({file, error: (result.stderr || result.stdout).slice(0, 1200)});
}
for (const item of failures) console.error(item.file + '\n' + item.error);
console.log('JavaScript files checked:', files.length, '| failed:', failures.length);
if (failures.length) process.exitCode = 1;
