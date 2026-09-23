import { resolve } from 'node:path';
import { buildApp } from './app.js';
import { configuration } from './config.js';
import { createPool } from './infrastructure/database.js';
const config = configuration();
const pool = createPool(config.DATABASE_URL);
pool.on('error', (error) => console.error('Database pool error:', error.message));
const app = await buildApp({
  pool,
  instanceId: config.INSTANCE_ID,
  logger: true,
  publicOrigin: config.PUBLIC_ORIGIN,
  gameOrigins: config.GAME_ORIGINS,
  gameSessionLimit: config.GAME_SESSIONS_LIMIT,
  gameSessionGlobalLimit: config.GAME_SESSIONS_GLOBAL_LIMIT,
  gameOrderLimit: config.GAME_ORDERS_LIMIT,
  staticRoot: config.SERVE_STATIC === 'true' ? resolve('dist/client') : undefined,
  release: config.RELEASE,
  discovery: {
    apiKey: config.TYPESAFE_API_KEY,
    maxCallsPerDay: config.TYPESAFE_MAX_CALLS_PER_DAY,
    timeoutMs: config.TYPESAFE_TIMEOUT_MS,
  },
});
let closing = false;
const shutdown = async () => {
  if (closing) return;
  closing = true;
  await app.close();
  await pool.end();
};
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
await app.listen({ port: config.PORT, host: config.HOST });
