import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
export async function fingerprint() {
  const paths = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(file);
      else paths.push(file);
    }
  }
  for (const dir of ['src', 'tests', 'scripts', 'migrations', 'public']) await walk(dir);
  paths.push(
    'index.html',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'tsconfig.server.json',
    'vite.config.ts',
    'compose.yaml',
    'compose.dev.yaml',
    'Dockerfile',
  );
  const hash = createHash('sha256');
  for (const file of paths.sort()) {
    hash.update(file.replaceAll('\\', '/'));
    hash.update(await readFile(file));
  }
  return hash.digest('hex');
}
