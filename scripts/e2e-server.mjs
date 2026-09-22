import { spawn } from 'node:child_process';
const child = spawn(process.execPath, ['--import', 'tsx', 'tests/serve.ts'], {
  stdio: 'inherit',
  env: process.env,
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code) => {
  process.exitCode = code ?? 0;
});
