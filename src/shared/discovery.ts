import { z } from 'zod';
import { productIdSchema, receiptSchema, type Product } from './contracts.js';

export const visitorSchema = z.object({ id: z.uuid(), expiresAt: z.string() }).strict();
export const historySchema = z
  .object({
    orders: z.array(receiptSchema),
    nextCursor: z.uuid().nullable(),
  })
  .strict();
export const suggestionRequestSchema = z
  .object({
    query: z.string().trim().min(3).max(120),
  })
  .strict();
export const suggestionSchema = z
  .object({
    status: z.enum(['ready', 'no-match', 'unavailable', 'limited', 'pending']),
    source: z.literal('jev'),
    products: z
      .array(z.object({ productId: productIdSchema, weight: z.number().min(0).max(1) }).strict())
      .max(3),
    confidence: z.number().min(0).max(1).optional(),
    matchEvidence: z.number().min(0).max(1).optional(),
    cached: z.boolean(),
  })
  .strict();
export type Visitor = z.infer<typeof visitorSchema>;
export type Suggestion = z.infer<typeof suggestionSchema>;
export const normalizeQuery = (query: string) =>
  query.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
export function localMatches(products: Product[], query: string, limit = 6) {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];
  const tokens = normalized.split(' ');
  return products
    .map((product) => {
      const name = normalizeQuery(product.name);
      const haystack = normalizeQuery(
        product.name + ' ' + product.description + ' ' + product.category,
      );
      const matches = tokens.every((token) => haystack.includes(token));
      return {
        product,
        score: matches
          ? name === normalized
            ? 6
            : name.startsWith(normalized)
              ? 5
              : name.split(/[\s-]+/).some((word) => word.startsWith(normalized))
                ? 4
                : name.includes(normalized)
                  ? 3
                  : 1
          : 0,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, limit)
    .map((item) => item.product);
}
