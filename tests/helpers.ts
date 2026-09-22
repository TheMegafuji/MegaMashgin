import { readFileSync } from 'node:fs';
export function testDatabaseUrl() {
  let url = process.env.TEST_DATABASE_URL;
  if (!url) {
    try {
      url = readFileSync('.env', 'utf8')
        .split(/\r?\n/)
        .find((line) => line.startsWith('TEST_DATABASE_URL='))
        ?.slice('TEST_DATABASE_URL='.length);
    } catch {
      /* Built-in isolated default. */
    }
  }
  url ??= 'postgresql://checkout:local-test-only@127.0.0.1:55543/checkout_test';
  const parsed = new URL(url);
  if (
    parsed.pathname !== '/checkout_test' ||
    !['127.0.0.1', 'localhost', 'postgres-test'].includes(parsed.hostname)
  )
    throw new Error('Refusing tests outside the explicitly disposable checkout_test database.');
  return url;
}
