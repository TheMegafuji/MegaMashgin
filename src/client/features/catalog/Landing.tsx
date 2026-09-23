import { ArrowDown, ArrowUpRight, Check, Plus, Sparkles } from 'lucide-react';
import type { Product } from '../../../shared/contracts.js';
import { money } from '../../../shared/contracts.js';
export const categories = [
  'All',
  'Snacks',
  'Sweet treats',
  'Bakery',
  'Drinks',
  'Coffee & cups',
  'Sandwiches',
  'Salads',
  'Hot food',
  'Fruit',
];
const collections = [
  {
    name: 'Crunch time',
    note: 'Big crunch. Small break.',
    category: 'Snacks',
    image: '/market/sea-salt-chips.svg',
    className: 'crunch',
  },
  {
    name: 'A fresh start',
    note: 'Good greens & grab-and-go.',
    category: 'Salads',
    image: '/market/quinoa-bowl.svg',
    className: 'fresh',
  },
  {
    name: 'Sip, then go',
    note: 'Your next pick-me-up.',
    category: 'Coffee & cups',
    image: '/drinks/oat-latte.svg',
    className: 'sip',
  },
];
export function Landing({
  products,
  onCategory,
  onAdd,
  cart,
  locked,
}: {
  products: Product[];
  onCategory: (category: string) => void;
  onAdd: (id: string) => void;
  cart: { productId: string; quantity: number }[];
  locked: boolean;
}) {
  const picks = ['sea-salt-chips', 'classic-cola', 'turkey-wrap'].flatMap((id) => {
    const p = products.find((p) => p.id === id);
    return p ? [p] : [];
  });
  return (
    <section className="market-home" aria-label="Welcome to Mashgin Market concept">
      <div className="landing-copy">
        <span className="hero-kicker">
          <span />
          YOUR EVERYDAY PIT STOP
        </span>
        <h1>
          Good things.
          <br />
          <span>On the go.</span>
          <svg className="hero-spark" viewBox="0 0 56 56" aria-hidden="true">
            <path
              d="M28 3v50M3 28h50M10 10l36 36M10 46l36-36"
              stroke="currentColor"
              strokeWidth="4"
            />
          </svg>
        </h1>
        <p>
          From the first sip to the last-minute snack.
          <br />
          Find your favorites. Make a little moment of it.
        </p>
        <button className="hero-cta" onClick={() => onCategory('All')}>
          Explore the market
          <ArrowDown size={18} />
        </button>
        <div className="hero-footnote">
          <Check size={15} />
          No lines. No signup. Just something good.
        </div>
      </div>
      <div className="hero-scene">
        <div className="scene-ring ring-one" />
        <div className="scene-ring ring-two" />
        <div className="scene-caption">
          <Sparkles size={15} />
          Your everyday checkout
        </div>
        {picks.map((product, i) => (
          <button
            key={product.id}
            className={'floating-product floating-' + i}
            disabled={locked || !product.available}
            onClick={() => onAdd(product.id)}
            aria-label={'Quick add ' + product.name}
          >
            <img src={product.image} alt="" width="280" height="220" />
            <span className="float-label">
              <strong>{product.name}</strong>
              <span>
                {cart.some((p) => p.productId === product.id) ? (
                  <Check size={13} />
                ) : (
                  <Plus size={13} />
                )}{' '}
                {money(product.priceCents)}
              </span>
            </span>
          </button>
        ))}
        <div className="scene-sticker">
          pick.
          <br />
          tap.
          <br />
          <em>happy.</em>
        </div>
        <span className="scene-instruction">
          Tap a favorite to add it to your bag <ArrowUpRight size={15} />
        </span>
      </div>
    </section>
  );
}
export function Collections({ onCategory }: { onCategory: (category: string) => void }) {
  return (
    <section className="collections" aria-label="Shop by mood">
      {collections.map((item) => (
        <button
          key={item.name}
          className={'collection ' + item.className}
          onClick={() => onCategory(item.category)}
        >
          <div>
            <span className="eyebrow">A LITTLE INSPIRATION</span>
            <h2>{item.name}</h2>
            <p>{item.note}</p>
            <span className="collection-link">
              Take a look <ArrowUpRight size={16} />
            </span>
          </div>
          <img src={item.image} alt="" width="180" height="150" />
        </button>
      ))}
    </section>
  );
}
