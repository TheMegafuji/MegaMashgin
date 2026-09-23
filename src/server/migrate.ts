import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Pool } from 'pg';
import { configuration } from './config.js';
import { createPool, transaction } from './infrastructure/database.js';
export async function migrate(pool: Pool) {
  await transaction(pool, async (db) => {
    await db.query('SELECT pg_advisory_xact_lock(772691)');
    await db.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())',
    );
    const names = (await readdir(resolve('migrations')))
      .filter((name) => name.endsWith('.sql'))
      .sort();
    for (const name of names) {
      const source = await readFile(resolve('migrations', name), 'utf8');
      const checksum = createHash('sha256').update(source).digest('hex');
      const { rows } = await db.query('SELECT checksum FROM schema_migrations WHERE version = $1', [
        name,
      ]);
      if (rows.length) {
        if (rows[0].checksum !== checksum) throw new Error('Applied migration changed: ' + name);
        continue;
      }
      await db.query(source);
      await db.query('INSERT INTO schema_migrations (version, checksum) VALUES ($1,$2)', [
        name,
        checksum,
      ]);
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const pool = createPool(configuration().DATABASE_URL);
  try {
    await migrate(pool);
    console.log('Migrations applied.');
  } finally {
    await pool.end();
  }
}
