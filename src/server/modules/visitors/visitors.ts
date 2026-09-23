import { randomBytes, randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { ApiError } from '../../http/errors.js';
import { transaction } from '../../infrastructure/database.js';
import type { StoredOrder } from '../orders/orders.js';
import { toReceipt } from '../orders/orders.js';
import { admit, tokenHash } from '../sessions/sessions.js';

export const VISITOR_COOKIE = 'megafuji_visitor';
export type Visitor = { id: string; expiresAt: string };
export async function findVisitor(pool: Pool, token?: string): Promise<Visitor | null> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const { rows } = await pool.query(
    'SELECT id, expires_at FROM visitors WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>now()',
    [tokenHash(token)],
  );
  return rows[0] ? { id: rows[0].id, expiresAt: rows[0].expires_at.toISOString() } : null;
}
export async function requireVisitor(pool: Pool, token?: string): Promise<Visitor> {
  const visitor = await findVisitor(pool, token);
  if (!visitor)
    throw new ApiError(
      401,
      'VISITOR_REQUIRED',
      'Your visitor session has ended. Reload to start a new visit.',
    );
  return visitor;
}
export async function bootstrapVisitor(pool: Pool, token: string | undefined, ip: string) {
  const existing = await findVisitor(pool, token);
  if (existing) return { visitor: existing, token: undefined };
  return transaction(pool, async (db) => {
    await admit(db, 'visitors:global', 600, 600);
    await admit(db, 'visitors:ip:' + tokenHash(ip), 100, 600);
    const nextToken = randomBytes(32).toString('hex');
    const { rows } = await db.query(
      "INSERT INTO visitors(id,token_hash,expires_at) VALUES($1,$2,now()+interval '30 days') RETURNING id,expires_at",
      [randomUUID(), tokenHash(nextToken)],
    );
    return {
      visitor: { id: rows[0].id, expiresAt: rows[0].expires_at.toISOString() },
      token: nextToken,
    };
  });
}
export async function visitorOrders(pool: Pool, visitorId: string, cursor?: string) {
  const { rows } = await pool.query<StoredOrder>(
    `SELECT o.* FROM orders o JOIN customer_sessions s ON s.id=o.session_id
      WHERE s.visitor_id=$1
      AND ($2::uuid IS NULL OR (o.created_at,o.id) <
        (SELECT before_o.created_at,before_o.id FROM orders before_o
          JOIN customer_sessions before_s ON before_s.id=before_o.session_id
          WHERE before_o.id=$2 AND before_s.visitor_id=$1))
      ORDER BY o.created_at DESC,o.id DESC LIMIT 11`,
    [visitorId, cursor ?? null],
  );
  return {
    orders: rows.slice(0, 10).map(toReceipt),
    nextCursor: rows.length > 10 ? rows[9]!.id : null,
  };
}
export async function visitorOrder(pool: Pool, visitorId: string, orderId: string) {
  const { rows } = await pool.query<StoredOrder>(
    'SELECT o.* FROM orders o JOIN customer_sessions s ON s.id=o.session_id WHERE o.id=$1 AND s.visitor_id=$2',
    [orderId, visitorId],
  );
  if (!rows[0])
    throw new ApiError(404, 'ORDER_NOT_FOUND', 'This order is not available for your visitor.');
  return toReceipt(rows[0]);
}
