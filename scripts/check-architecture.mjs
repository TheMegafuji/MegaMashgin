import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
async function walk(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map(async (e) =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
      ),
    )
  ).flat();
}
const failures = [];
for (const file of await walk('src')) {
  if (!/\.tsx?$/.test(file)) continue;
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const target = match[1];
    const resolved = target.startsWith('.')
      ? path.resolve(path.dirname(file), target).replaceAll('\\', '/')
      : target;
    const current = file.replaceAll('\\', '/');
    if (
      current.startsWith('src/client/') &&
      (resolved.includes('/src/server/') || target.startsWith('node:'))
    )
      failures.push(file + ': client imports server infrastructure');
    if (current.startsWith('src/shared/') && target !== 'zod' && !resolved.includes('/src/shared/'))
      failures.push(file + ': shared contract imports infrastructure');
    if (current.startsWith('src/server/') && resolved.includes('/src/client/'))
      failures.push(file + ': server imports browser');
  }
}
const spec = (
  await Promise.all(
    (await walk('specs'))
      .filter((file) => file.endsWith('.md'))
      .map((file) => readFile(file, 'utf8')),
  )
).join('\n');
const ids = [...spec.matchAll(/\|\s+((?:CK|UX|OPS|AI)-\d+)\s+\|/g)].map((m) => m[1]);
if (ids.length === 0) failures.push('No acceptance IDs found in the specification');
const references = [];
for (const file of await walk('tests')) {
  if (!/\.tsx?$/.test(file)) continue;
  const source = await readFile(file, 'utf8');
  for (const m of source.matchAll(/\[((?:CK|UX|OPS|AI)-\d+)\]/g)) {
    if (!ids.includes(m[1])) failures.push('Unknown acceptance ID ' + m[1] + ' in ' + file);
    references.push({ id: m[1], file: file.replaceAll('\\', '/') });
  }
}
await mkdir('artifacts', { recursive: true });
await writeFile(
  'artifacts/traceability.json',
  JSON.stringify(
    {
      ids,
      references,
      note: 'References establish links, not test execution or correctness.',
      failures,
    },
    null,
    2,
  ) + '\n',
);
if (failures.length) throw Error(failures.join('\n'));
console.log(
  'Module boundaries checked; ' +
    ids.length +
    ' acceptance IDs; ' +
    references.length +
    ' test references.',
);
