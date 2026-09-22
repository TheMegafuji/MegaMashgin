import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fingerprint } from './fingerprint.mjs';
const startedAt = new Date().toISOString();
const steps = [];
const commands = [
  ['format', 'node_modules/prettier/bin/prettier.cjs', '--check', '.'],
  ['architecture', 'scripts/check-architecture.mjs'],
  ['api-contract', '--import', 'tsx', 'scripts/openapi.ts', '--check'],
  ['types', 'node_modules/typescript/bin/tsc', '--noEmit'],
  ['unit', 'node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.config.ts'],
  [
    'integration',
    'node_modules/vitest/vitest.mjs',
    'run',
    '--config',
    'vitest.integration.config.ts',
  ],
  ['server-build', 'node_modules/typescript/bin/tsc', '-p', 'tsconfig.server.json'],
  ['web-build', 'node_modules/vite/bin/vite.js', 'build'],
];
for (const [name, ...args] of commands) {
  console.log('\nRunning ' + name);
  const start = Date.now();
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });
  steps.push({ name, exitCode: code, durationMs: Date.now() - start });
  if (code) break;
}
const ok = steps.length === commands.length && steps.every((s) => s.exitCode === 0);
await mkdir('artifacts', { recursive: true });
await writeFile(
  'artifacts/verification.json',
  JSON.stringify(
    {
      startedAt,
      finishedAt: new Date().toISOString(),
      node: process.version,
      platform: process.platform,
      sourceFingerprint: await fingerprint(),
      ok,
      steps,
      note: 'Browser and container checks are separate.',
    },
    null,
    2,
  ) + '\n',
);
if (!ok) process.exitCode = 1;
