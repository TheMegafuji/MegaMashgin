import { Check, Leaf, Plus } from 'lucide-react';
import { MAX_ITEM_QUANTITY, money, type Product } from '../../../shared/contracts.js';
import { ProductAtmosphere, isServedWarm } from './ProductAtmosphere.js';

export function ProductCard({
  product,
  quantity,
  onAdd,
  locked,
}: {
  product: Product;
  quantity: number;
  onAdd: () => void;
  locked: boolean;
}) {
  return (
    <article
      className={
        'product-card' +
        (isServedWarm(product) ? ' is-warm' : '') +
        (quantity ? ' is-selected' : '') +
        (!product.available ? ' is-unavailable' : '')
      }
    >
      <div className="product-art">
        {isServedWarm(product) && product.available && <ProductAtmosphere />}
        <img src={product.image} alt="" width="400" height="280" loading="lazy" />
        {quantity > 0 && (
          <span key={quantity} className="selected-pill">
            <Check size={13} /> {quantity} in your order
          </span>
        )}
        {!product.available && <span className="sold-out">Back soon</span>}
      </div>
      <div className="product-content">
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-diet">
          {product.dietary[0] && (
            <>
              <Leaf size={12} />
              <span>{product.dietary[0]}</span>
            </>
          )}
        </div>
        <div className="product-bottom">
          <strong>{money(product.priceCents)}</strong>
          <button
            className="add-button"
            aria-label={'Add ' + product.name}
            disabled={locked || !product.available || quantity >= MAX_ITEM_QUANTITY}
            onClick={onAdd}
          >
            <Plus size={16} />
            {product.available ? 'Add' : 'Sold out'}
          </button>
        </div>
      </div>
    </article>
  );
}
