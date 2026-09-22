import { spawn } from 'node:child_process';
const children = [
  spawn(
    process.execPath,
    ['--env-file-if-exists=.env', '--import', 'tsx', '--watch', 'src/server/main.ts'],
    { stdio: 'inherit' },
  ),
  spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5190'],
    { stdio: 'inherit' },
  ),
];
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    for (const child of children) child.kill();
  });
for (const child of children)
  child.on('exit', (code) => {
    if (code) {
      for (const other of children) other.kill();
      process.exitCode = code;
    }
  });
