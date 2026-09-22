import { createHash } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import type { Menu, Product } from '../shared/contracts.js';
export async function readMenu(db: Pool | PoolClient): Promise<Menu> {
  const { rows } = await db.query(
    'SELECT id, name, description, category, price_cents, available, image, dietary FROM products ORDER BY position, id',
  );
  const products: Product[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    priceCents: row.price_cents,
    available: row.available,
    image: row.image,
    dietary: row.dietary,
  }));
  const revision = createHash('sha256').update(JSON.stringify(products)).digest('hex');
  return { revision, currency: 'USD', products };
}
