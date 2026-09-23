import { describe, expect, it } from 'vitest';
import { canonicalItems, money, orderRequestSchema } from '../../src/shared/contracts.js';
import { hashIntent } from '../../src/server/modules/orders/orders.js';
const input = {
  items: [{ productId: 'pesto-focaccia', quantity: 2 }],
  payment: { method: 'demo-card' as const },
  menuRevision: 'a'.repeat(64),
};
describe('purchase contract', () => {
  it('[CK-03] accepts a fictional payment method and rejects card details', () => {
    expect(orderRequestSchema.safeParse(input).success).toBe(true);
    expect(
      orderRequestSchema.safeParse({
        ...input,
        payment: { method: 'demo-card', cardNumber: 'not-real' },
      }).success,
    ).toBe(false);
  });
  it('[CK-04] rejects client prices and unbounded or fractional quantities', () => {
    for (const body of [
      { ...input, totalCents: 1 },
      { ...input, items: [] },
      ...[0, -1, 1.5, 11].map((quantity) => ({
        ...input,
        items: [{ productId: 'pesto-focaccia', quantity }],
      })),
    ])
      expect(orderRequestSchema.safeParse(body).success).toBe(false);
    expect(
      orderRequestSchema.safeParse({
        ...input,
        items: Array.from({ length: 11 }, () => ({ productId: 'pesto-focaccia', quantity: 1 })),
      }).success,
    ).toBe(false);
  });
  it('[CK-07] canonicalizes equivalent quantities and detects a changed intent', () => {
    expect(
      canonicalItems([
        { productId: 'iced-latte', quantity: 1 },
        ...input.items,
        { productId: 'iced-latte', quantity: 2 },
      ]),
    ).toEqual([{ productId: 'iced-latte', quantity: 3 }, ...input.items]);
    expect(hashIntent(input)).toBe(
      hashIntent({
        ...input,
        items: [
          { productId: 'pesto-focaccia', quantity: 1 },
          { productId: 'pesto-focaccia', quantity: 1 },
        ],
      }),
    );
    expect(hashIntent(input)).not.toBe(hashIntent({ ...input, payment: { method: 'demo-cash' } }));
    expect(hashIntent(input)).toBe(hashIntent({ ...input, promotionProductIds: [] }));
  });
  it('[CK-04] formats cents without using floating-point amounts for calculation', () => {
    expect(money(850 + 450)).toBe('$13.00');
    expect(money(1)).toBe('$0.01');
  });
});
