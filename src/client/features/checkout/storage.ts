import { z } from 'zod';
import {
  lineSchema,
  MAX_CART_UNITS,
  orderRequestSchema,
  sessionSchema,
} from '../../../shared/contracts.js';
export const STORAGE_KEY = 'megafuji.checkout.v1';
const savedSchema = z
  .object({
    version: z.literal(1),
    cart: z.array(lineSchema).max(MAX_CART_UNITS),
    session: sessionSchema.optional(),
    intent: z.object({ key: z.uuid(), body: orderRequestSchema }).strict().optional(),
  })
  .strict();
export type SavedCheckout = z.infer<typeof savedSchema>;
export const emptyCheckout = (): SavedCheckout => ({ version: 1, cart: [] });
export function readSaved(storage: Pick<Storage, 'getItem'>): SavedCheckout {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return emptyCheckout();
  const saved = savedSchema.parse(JSON.parse(raw));
  if (saved.intent && !saved.session) throw new Error('Saved intent has no session.');
  return saved;
}
export function writeSaved(storage: Pick<Storage, 'setItem'>, value: SavedCheckout) {
  storage.setItem(STORAGE_KEY, JSON.stringify(savedSchema.parse(value)));
}
