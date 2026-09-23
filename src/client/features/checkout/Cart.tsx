import { ArrowRight, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react';
import { money } from '../../../shared/contracts.js';
import { Quantity } from './Quantity.js';
import type { Checkout } from './useCheckout.js';

export function Cart({ checkout }: { checkout: Checkout }) {
  const c = checkout;
  return (
    <aside className="cart-panel" id="your-order" aria-labelledby="order-heading">
      <div className="cart-heading">
        <div>
          <span className="eyebrow">SOMETHING GOOD</span>
          <h2 id="order-heading">
            Your order <span>{c.units}</span>
          </h2>
        </div>
        <ShoppingBag size={24} strokeWidth={1.5} />
      </div>
      {c.units === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-art">
            <ShoppingBag size={49} strokeWidth={1} />
            <span>+</span>
          </div>
          <h3>Make yourself happy.</h3>
          <p>
            Add a little something from the menu.
            <br />
            We’ll keep it right here.
          </p>
        </div>
      ) : (
        <>
          <ul className="cart-lines">
            {c.lines.map((line) => (
              <li key={line.productId}>
                <img src={line.product?.image} alt="" width="56" height="56" />
                <div className="cart-line-body">
                  <h3>{line.product?.name ?? line.productId}</h3>
                  {!line.product?.available && (
                    <span className="unavailable-note">No longer available</span>
                  )}
                  <Quantity
                    name={line.product?.name ?? line.productId}
                    quantity={line.quantity}
                    onChange={(delta) => c.changeQuantity(line.productId, delta)}
                  />
                </div>
                <strong>{money((line.product?.priceCents ?? 0) * line.quantity)}</strong>
              </li>
            ))}
          </ul>
          <button className="text-button clear-order" onClick={c.clearCart}>
            <Trash2 size={13} />
            Clear order
          </button>
        </>
      )}
      <div className="cart-checkout">
        <div className="total-row">
          <span>Total</span>
          <strong>{money(c.total)}</strong>
        </div>
        <p className="total-note">All displayed prices included. No extra fees.</p>
        <button
          className="primary-button"
          disabled={!c.validCart || !c.online || c.storageError}
          onClick={c.review}
        >
          Review order <ArrowRight size={18} />
        </button>
        <p className="demo-caption">
          <ShieldCheck size={13} />
          Demo checkout · no real charge
        </p>
      </div>
      <div className="cart-note">
        <span className="tiny-flower" aria-hidden="true">
          ✳
        </span>
        <p>
          A small pause.
          <br />
          <strong>A very good choice.</strong>
        </p>
      </div>
    </aside>
  );
}
