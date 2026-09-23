import { resolve } from 'node:path';
import { buildApp } from '../src/server/app.js';
import { createPool } from '../src/server/infrastructure/database.js';
import { migrate } from '../src/server/migrate.js';
import { testDatabaseUrl } from './helpers.js';
const pool = createPool(testDatabaseUrl());
await migrate(pool);
await pool.query('TRUNCATE orders, customer_sessions, admission CASCADE');
await pool.query(
  "UPDATE products SET price_cents = 850, available = true WHERE id = 'pesto-focaccia'",
);
const app = await buildApp({
  pool,
  instanceId: 'browser-test',
  sessionLimit: 1000,
  staticRoot: resolve('dist/client'),
});
await app.listen({ host: '127.0.0.1', port: 3191 });
const close = async () => {
  await app.close();
  await pool.end();
};
process.on('SIGTERM', () => void close());
process.on('SIGINT', () => void close());
