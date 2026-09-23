import { Flame } from 'lucide-react';
import type { Product } from '../../../shared/contracts.js';
const warmDrinks = new Set([
  'house-coffee',
  'large-coffee',
  'cappuccino',
  'oat-latte',
  'hot-chocolate',
  'english-tea',
]);
export function isServedWarm(product: Product) {
  return product.category === 'Hot food' || warmDrinks.has(product.id);
}
export function ProductAtmosphere() {
  return (
    <>
      <svg className="product-steam" viewBox="0 0 120 180" aria-hidden="true" focusable="false">
        <path d="M32 178 C10 143 54 126 31 99 S10 61 31 24" />
        <path d="M62 178 C84 145 41 121 62 91 S84 54 63 8" />
        <path d="M88 178 C67 147 107 127 86 98 S70 57 88 30" />
      </svg>
      <span className="warm-label">
        <Flame size={12} /> Served warm
      </span>
    </>
  );
}
