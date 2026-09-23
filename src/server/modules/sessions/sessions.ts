import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { ApiError } from '../../http/errors.js';
import { transaction } from '../../infrastructure/database.js';
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export function bearer(header?: string): string {
  const match = /^Bearer ([a-f0-9]{64})$/.exec(header ?? '');
  if (!match?.[1])
    throw new ApiError(401, 'SESSION_REQUIRED', 'Please start a new customer session.');
  return match[1];
}
export async function admit(db: PoolClient, scope: string, limit: number, seconds: number) {
  const { rows } = await db.query(
    "INSERT INTO admission (scope, bucket, used, expires_at) VALUES ($1, floor(extract(epoch FROM clock_timestamp()) / $2)::bigint, 1, now() + ($2 * interval '1 second')) ON CONFLICT (scope, bucket) DO UPDATE SET used = admission.used + 1 WHERE admission.used < $3 RETURNING used",
    [scope, seconds, limit],
  );
  if (!rows.length)
    throw new ApiError(
      429,
      'DEMO_LIMIT',
      'This demo is busy. Please wait a few minutes and try again.',
    );
}
export async function newSession(
  pool: Pool,
  ip: string,
  limit = 30,
  visitorId?: string,
  gameProfile = false,
  gameGlobalLimit = 600,
) {
  const token = randomBytes(32).toString('hex');
  return transaction(pool, async (db) => {
    await admit(
      db,
      gameProfile ? 'sessions:game:global' : 'sessions:global',
      gameProfile ? gameGlobalLimit : 600,
      600,
    );
    await admit(
      db,
      (gameProfile ? 'sessions:game:ip:' : 'sessions:ip:') + tokenHash(ip),
      limit,
      600,
    );
    const { rows } = await db.query(
      "INSERT INTO customer_sessions (id, token_hash, expires_at, visitor_id, game_profile) VALUES ($1,$2,now() + interval '24 hours',$3,$4) RETURNING expires_at",
      [randomUUID(), tokenHash(token), visitorId ?? null, gameProfile],
    );
    return { token, expiresAt: rows[0].expires_at.toISOString() as string };
  });
}
export async function findSession(db: Pool | PoolClient, token: string, lock = false) {
  const { rows } = await db.query(
    'SELECT id, expires_at, closed_at, visitor_id, game_profile, (expires_at <= now()) AS expired FROM customer_sessions WHERE token_hash = $1' +
      (lock ? ' FOR UPDATE' : ''),
    [tokenHash(token)],
  );
  const row = rows[0];
  if (!row)
    throw new ApiError(
      401,
      'SESSION_REQUIRED',
      'This session could not be found. Please start again.',
    );
  if (row.closed_at || row.expired)
    throw new ApiError(
      410,
      'SESSION_EXPIRED',
      'This customer session has ended. Please start a new session.',
    );
  return row as {
    id: string;
    expires_at: Date;
    closed_at: Date | null;
    visitor_id: string | null;
    game_profile: boolean;
  };
}
