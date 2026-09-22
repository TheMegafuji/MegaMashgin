import { describe, expect, it } from 'vitest';
import {
  readSaved,
  writeSaved,
  STORAGE_KEY,
  type SavedCheckout,
} from '../../src/client/storage.js';
const purchase: SavedCheckout = {
  version: 1,
  cart: [{ productId: 'pesto-focaccia', quantity: 1 }],
  session: { token: 'a'.repeat(64), expiresAt: '2026-09-22T00:00:00Z' },
  intent: {
    key: '91be014f-6c61-4c2e-9bd3-768e6c67c2ea',
    body: {
      items: [{ productId: 'pesto-focaccia', quantity: 1 }],
      payment: { method: 'demo-card' },
      menuRevision: 'b'.repeat(64),
    },
  },
};
describe('saved purchase recovery', () => {
  it('[CK-08] preserves the exact session, key and payload through serialization', () => {
    const values = new Map<string, string>();
    writeSaved(
      {
        setItem: (key, value) => {
          values.set(key, value);
        },
      },
      purchase,
    );
    expect(readSaved({ getItem: (key) => values.get(key) ?? null })).toEqual(purchase);
    expect(values.has(STORAGE_KEY)).toBe(true);
  });
  it('[CK-08] rejects corrupted state instead of inventing a new purchase', () => {
    expect(() => readSaved({ getItem: () => '{broken' })).toThrow();
    expect(() =>
      readSaved({ getItem: () => JSON.stringify({ ...purchase, session: undefined }) }),
    ).toThrow();
  });
  it('[UX-02] reports a storage failure so submission can be stopped before HTTP', () => {
    expect(() =>
      writeSaved(
        {
          setItem: () => {
            throw Error('quota');
          },
        },
        purchase,
      ),
    ).toThrow('quota');
  });
});

it('[CK-15] forty distinct market products remain recoverable in browser storage', () => {
  let raw: string | null = null;
  const storage = {
    getItem: () => raw,
    setItem: (_key: string, value: string) => {
      raw = value;
    },
  };
  const cart = Array.from({ length: 40 }, (_, i) => ({
    productId: 'market-item-' + i,
    quantity: 1,
  }));
  writeSaved(storage, { version: 1, cart });
  expect(readSaved(storage).cart).toHaveLength(40);
});
