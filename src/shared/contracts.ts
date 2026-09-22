import { z } from 'zod';

export const MAX_ITEM_QUANTITY = 10;
export const MAX_CART_UNITS = 40;
export const productIdSchema = z.string().regex(/^[a-z][a-z0-9-]{1,47}$/);
export const productSchema = z
  .object({
    id: productIdSchema,
    name: z.string(),
    description: z.string(),
    category: z.enum([
      'Snacks',
      'Sweet treats',
      'Bakery',
      'Drinks',
      'Coffee & cups',
      'Sandwiches',
      'Salads',
      'Hot food',
      'Fruit',
    ]),
    priceCents: z.number().int().nonnegative(),
    available: z.boolean(),
    image: z.string(),
    dietary: z.array(z.string()),
  })
  .strict();
export const menuSchema = z
  .object({
    revision: z.string().length(64),
    currency: z.literal('USD'),
    products: z.array(productSchema),
  })
  .strict();
export const lineSchema = z
  .object({ productId: productIdSchema, quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY) })
  .strict();
export const orderRequestSchema = z
  .object({
    items: z.array(lineSchema).min(1).max(MAX_CART_UNITS),
    payment: z.object({ method: z.enum(['demo-card', 'demo-cash']) }).strict(),
    menuRevision: z.string().regex(/^[a-f0-9]{64}$/),
    promotionProductIds: z
      .array(productIdSchema)
      .max(9)
      .optional()
      .superRefine((ids, ctx) => {
        if (ids && new Set(ids).size !== ids.length)
          ctx.addIssue({ code: 'custom', message: 'Promotion products must be unique.' });
      }),
  })
  .strict()
  .superRefine((input, ctx) => {
    const quantities = new Map<string, number>();
    for (const line of input.items)
      quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
    if ([...quantities.values()].some((qty) => qty > MAX_ITEM_QUANTITY))
      ctx.addIssue({
        code: 'custom',
        message: 'At most 10 of the same item may be ordered.',
        path: ['items'],
      });
    if (input.items.reduce((sum, line) => sum + line.quantity, 0) > MAX_CART_UNITS)
      ctx.addIssue({
        code: 'custom',
        message: 'At most 40 items may be ordered.',
        path: ['items'],
      });
  });
export const receiptLineSchema = z
  .object({
    productId: productIdSchema,
    name: z.string(),
    quantity: z.number().int().positive(),
    unitPriceCents: z.number().int().nonnegative(),
    lineTotalCents: z.number().int().nonnegative(),
  })
  .strict();
export const receiptSchema = z
  .object({
    id: z.uuid(),
    reference: z.string(),
    status: z.literal('confirmed'),
    currency: z.literal('USD'),
    totalCents: z.number().int().nonnegative(),
    paymentMethod: z.enum(['demo-card', 'demo-cash']),
    createdAt: z.string(),
    items: z.array(receiptLineSchema),
  })
  .strict();
export const sessionSchema = z
  .object({ token: z.string().regex(/^[a-f0-9]{64}$/), expiresAt: z.string() })
  .strict();
export const idempotencyKeySchema = z.uuid();
export type Product = z.infer<typeof productSchema>;
export type Menu = z.infer<typeof menuSchema>;
export type OrderRequest = z.infer<typeof orderRequestSchema>;
export type Receipt = z.infer<typeof receiptSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type CartLine = z.infer<typeof lineSchema>;
export function canonicalItems(items: CartLine[]): CartLine[] {
  const grouped = new Map<string, number>();
  for (const item of items)
    grouped.set(item.productId, (grouped.get(item.productId) ?? 0) + item.quantity);
  return [...grouped]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([productId, quantity]) => ({ productId, quantity }));
}
export function money(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
