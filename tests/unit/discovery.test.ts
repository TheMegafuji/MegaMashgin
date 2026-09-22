import { describe, it, expect } from 'vitest';
import { buildJevRequest, interpretJev, jevResponseSchema } from '../../src/server/jev.js';
import { localMatches } from '../../src/shared/discovery.js';
import type { Menu } from '../../src/shared/contracts.js';
const menu: Menu = {
  revision: 'a'.repeat(64),
  currency: 'USD',
  products: [
    {
      id: 'sea-salt-chips',
      name: 'Sea salt chips',
      description: 'Crunchy potato chips',
      category: 'Snacks',
      priceCents: 249,
      available: true,
      image: '/a.svg',
      dietary: [],
    },
    {
      id: 'classic-cola',
      name: 'Classic cola',
      description: 'A cold soda can',
      category: 'Drinks',
      priceCents: 249,
      available: true,
      image: '/b.svg',
      dietary: [],
    },
    {
      id: 'sold-out',
      name: 'Sold out',
      description: 'Unavailable',
      category: 'Snacks',
      priceCents: 249,
      available: false,
      image: '/c.svg',
      dietary: [],
    },
  ],
};
const answer = (exists = 0.95) => ({
  model: 'jev-1.13.0',
  answers: {
    ranking: {
      type: 'choice' as const,
      choice: 'sea-salt-chips',
      confidence: 0.85,
      probabilities: { 'sea-salt-chips': 0.9, 'classic-cola': 0.08, none: 0.02 },
    },
    exists: { type: 'noul' as const, noul: exists },
  },
  usage: { input_tokens: 900, output_tokens: 40 },
});
describe('Closed-set semantic discovery', () => {
  it('[UX-04] immediate search ranks exact names and supports words out of order', () => {
    expect(localMatches(menu.products, 'chips salt')[0]?.id).toBe('sea-salt-chips');
    expect(localMatches(menu.products, '  CLASSIC   COLA  ')[0]?.id).toBe('classic-cola');
    expect(localMatches(menu.products, 'nonexistent')).toEqual([]);
    const chocolate = {
      ...menu.products[0]!,
      id: 'chocolate-cookie',
      name: 'Chocolate cookie',
      description: 'Sweet chocolate',
    };
    expect(localMatches([...menu.products, chocolate], 'cola')[0]?.id).toBe('classic-cola');
  });
  it('[AI-03] request includes only available catalog data and query', () => {
    const request = buildJevRequest(menu, 'something crunchy');
    expect(request.state.catalog.map((p) => p.id)).not.toContain('sold-out');
    expect(Object.keys(request.state)).toEqual(['query', 'catalog', 'currency']);
    expect(request.questions.ranking.criteria).toHaveProperty('none');
  });
  it('[AI-04] ranks only existing products and refuses a high ranking with weak match evidence', () => {
    expect(interpretJev(answer(), menu).products[0]?.productId).toBe('sea-salt-chips');
    expect(interpretJev(answer(0.1), menu).products).toEqual([]);
  });
  it('[AI-04] rejects unknown IDs and non-distributions from a provider', () => {
    const unknown = answer();
    unknown.answers.ranking.choice = 'invented';
    expect(() => interpretJev(unknown, menu)).toThrow();
    const invalid = answer();
    invalid.answers.ranking.probabilities.none = 0.8;
    expect(() => interpretJev(invalid, menu)).toThrow();
  });
  it('[AI-04] validates external types and probability ranges before use', () => {
    const invalid = answer();
    invalid.answers.exists.noul = 1.4;
    expect(jevResponseSchema.safeParse(invalid).success).toBe(false);
  });
});
