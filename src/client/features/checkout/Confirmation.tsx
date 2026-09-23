import { ArrowRight, CheckCheck, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { money } from '../../../shared/contracts.js';
import type { Checkout } from './useCheckout.js';

export function Confirmation({ checkout }: { checkout: Checkout }) {
  const c = checkout;
  const receipt = c.receipt!;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo({ top: 0 });
  }, []);
  return (
    <main className="confirmation">
      <div className="confirmation-intro">
        <span className="confirmation-icon">
          <CheckCheck size={36} strokeWidth={1.6} />
        </span>
        <span className="eyebrow">ALL SET. ENJOY THE MOMENT.</span>
        <h1 ref={heading} tabIndex={-1}>
          That’s a good choice.
        </h1>
        <p>Your demo order is confirmed and saved.</p>
      </div>
      <section className="receipt" aria-label="Confirmed order receipt">
        <div className="receipt-top">
          <span>MASHGIN MARKET / CONCEPT</span>
          <span className="receipt-badge">
            <CheckCircle2 size={13} />
            Confirmed
          </span>
        </div>
        <div className="receipt-reference">
          <span>Order reference</span>
          <strong>{receipt.reference}</strong>
        </div>
        <ul>
          {receipt.items.map((item) => (
            <li key={item.productId}>
              <span>
                {item.quantity}× {item.name}
              </span>
              <strong>{money(item.lineTotalCents)}</strong>
            </li>
          ))}
        </ul>
        <div className="receipt-total">
          <span>Total</span>
          <strong>{money(receipt.totalCents)}</strong>
        </div>
        <div className="receipt-meta">
          <span>{receipt.paymentMethod === 'demo-card' ? 'Demo card' : 'Demo cash'}</span>
          <time dateTime={receipt.createdAt}>
            {new Date(receipt.createdAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </time>
        </div>
        <p className="receipt-note">
          No payment was collected. This demo does not prepare or fulfill food orders.
        </p>
      </section>
      <button className="primary-button next-customer" onClick={() => void c.nextCustomer()}>
        Start another order
        <ArrowRight size={18} />
      </button>
      <p className="confirmation-reset">
        <ShieldCheck size={13} />
        Starts a fresh order. Your receipt stays in My orders.
      </p>
    </main>
  );
}
