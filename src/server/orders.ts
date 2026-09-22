import { createHash, randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { canonicalItems, type OrderRequest, type Receipt } from '../shared/contracts.js';
import { transaction } from './database.js';
import { ApiError } from './errors.js';
import { readMenu } from './catalog.js';
import { admit, findSession } from './sessions.js';

export function hashIntent(input: OrderRequest) {
  const promotionProductIds = input.promotionProductIds?.length
    ? [...input.promotionProductIds].sort()
    : undefined;
  return createHash('sha256')
    .update(
      JSON.stringify({
        items: canonicalItems(input.items),
        payment: input.payment,
        menuRevision: input.menuRevision,
        ...(promotionProductIds ? { promotionProductIds } : {}),
      }),
    )
    .digest('hex');
}
export type StoredOrder = {
  id: string;
  reference: string;
  total_cents: number;
  payment_method: Receipt['paymentMethod'];
  created_at: Date;
  items: Receipt['items'];
  request_hash: string;
  idempotency_key: string;
};
export function toReceipt(row: StoredOrder): Receipt {
  return {
    id: row.id,
    reference: row.reference,
    totalCents: row.total_cents,
    currency: 'USD',
    status: 'confirmed',
    paymentMethod: row.payment_method,
    createdAt: row.created_at.toISOString(),
    items: row.items,
  };
}
export async function placeOrder(
  pool: Pool,
  token: string,
  key: string,
  input: OrderRequest,
  gameOrderLimit = 1800,
) {
  return transaction(pool, async (db) => {
    const session = await findSession(db, token, true);
    if (input.promotionProductIds?.length && !session.game_profile)
      throw new ApiError(
        422,
        'PROMOTION_NOT_ALLOWED',
        'Promotions are available only in the explicit game checkout.',
      );
    const requestHash = hashIntent(input);
    const existing = await db.query<StoredOrder>('SELECT * FROM orders WHERE session_id = $1', [
      session.id,
    ]);
    if (existing.rows[0]) {
      const prior = existing.rows[0];
      if (prior.idempotency_key !== key)
        throw new ApiError(
          409,
          'SESSION_COMPLETE',
          'This customer already has an order. Start the next customer to make another purchase.',
        );
      if (prior.request_hash !== requestHash)
        throw new ApiError(
          409,
          'INTENT_CONFLICT',
          'This purchase key belongs to a different order. Recover the original order before continuing.',
        );
      return { receipt: toReceipt(prior), replayed: true };
    }
    const menu = await readMenu(db);
    if (input.menuRevision !== menu.revision)
      throw new ApiError(
        409,
        'MENU_CHANGED',
        'The menu has changed. Please review the updated prices before ordering.',
      );
    const promotionIds = new Set(input.promotionProductIds ?? []);
    const items = canonicalItems(input.items).map((line) => {
      const product = menu.products.find((item) => item.id === line.productId);
      if (!product?.available)
        throw new ApiError(
          409,
          'ITEM_UNAVAILABLE',
          'One of your items is no longer available. Please review your order.',
        );
      const unitPriceCents = promotionIds.has(product.id)
        ? Math.round((product.priceCents * 80) / 100)
        : product.priceCents;
      return {
        productId: product.id,
        name: product.name,
        quantity: line.quantity,
        unitPriceCents,
        lineTotalCents: unitPriceCents * line.quantity,
      };
    });
    if (
      input.promotionProductIds?.some(
        (productId) => !items.some((item) => item.productId === productId),
      )
    )
      throw new ApiError(
        422,
        'PROMOTION_INVALID',
        'Promotions must target products in this purchase.',
      );
    const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
    if (!Number.isSafeInteger(totalCents) || totalCents > 50000)
      throw new ApiError(400, 'ORDER_TOO_LARGE', 'This demo accepts orders up to $500.');
    await admit(
      db,
      session.game_profile ? 'orders:game:global' : 'orders:global',
      session.game_profile ? gameOrderLimit : 300,
      60,
    );
    const id = randomUUID();
    const { rows } = await db.query<StoredOrder>(
      'INSERT INTO orders (id, session_id, idempotency_key, request_hash, reference, menu_revision, payment_method, total_cents, items) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) RETURNING *',
      [
        id,
        session.id,
        key,
        requestHash,
        'MF-' + id.slice(0, 8).toUpperCase(),
        menu.revision,
        input.payment.method,
        totalCents,
        JSON.stringify(items),
      ],
    );
    return { receipt: toReceipt(rows[0]!), replayed: false };
  });
}
export async function getOrder(pool: Pool, token: string, id: string) {
  const session = await findSession(pool, token);
  const { rows } = await pool.query<StoredOrder>(
    'SELECT * FROM orders WHERE id = $1 AND session_id = $2',
    [id, session.id],
  );
  if (!rows[0])
    throw new ApiError(404, 'ORDER_NOT_FOUND', 'The order could not be found for this customer.');
  return toReceipt(rows[0]);
}
