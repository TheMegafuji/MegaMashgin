import {
  ArrowLeft,
  ArrowRight,
  Coins,
  CreditCard,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { money } from '../../../shared/contracts.js';
import type { Checkout } from './useCheckout.js';

export function Review({ checkout }: { checkout: Checkout }) {
  const c = checkout;
  const dialog = useRef<HTMLDialogElement>(null);
  const open = ['review', 'submitting', 'uncertain'].includes(c.phase);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) {
      dialog.current?.showModal();
      heading.current?.focus();
    }
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  return (
    <dialog
      className="review-dialog"
      ref={dialog}
      aria-labelledby="review-heading"
      onCancel={(event) => {
        event.preventDefault();
        if (c.phase === 'review') c.edit();
      }}
    >
      <div className="review-header">
        <span className="eyebrow">YOUR MOMENT, ALMOST HERE</span>
        {c.phase === 'review' && (
          <button className="icon-button" aria-label="Close order review" onClick={c.edit}>
            <X size={20} />
          </button>
        )}
        <h2 id="review-heading" ref={heading} tabIndex={-1}>
          {c.phase === 'uncertain'
            ? 'Let’s check your order.'
            : c.phase === 'submitting'
              ? 'One moment, please.'
              : 'Everything look good?'}
        </h2>
        <p>
          {c.phase === 'submitting'
            ? 'We’re waiting for your order confirmation.'
            : c.phase === 'uncertain'
              ? 'A lost connection doesn’t always mean a lost order.'
              : 'Give your order a final look, then choose a demo payment.'}
        </p>
      </div>
      {c.phase === 'uncertain' ? (
        <div className="uncertain-state" role="status">
          <div className="status-symbol">
            <RefreshCw size={27} />
          </div>
          <h3>Your order may already be saved.</h3>
          <p>{c.message}</p>
          <p>
            We’ve kept your exact order. Checking again will recover it without placing a second
            purchase.
          </p>
          <button className="primary-button" onClick={() => void c.recover()} disabled={!c.online}>
            <RefreshCw size={17} />
            Check my order
          </button>
          <small>You can reload this page. Your purchase details will stay in this tab.</small>
        </div>
      ) : (
        <>
          <ul className="review-lines">
            {c.lines.map((line) => (
              <li key={line.productId}>
                <span className="review-qty">{line.quantity}×</span>
                <span>{line.product?.name ?? line.productId}</span>
                <strong>{money((line.product?.priceCents ?? 0) * line.quantity)}</strong>
              </li>
            ))}
          </ul>
          <div className="review-total">
            <span>Total</span>
            <strong>{money(c.total)}</strong>
          </div>
          {c.phase === 'review' && (
            <fieldset className="payment-options">
              <legend>Choose a demo payment</legend>
              <label className={c.payment === 'demo-card' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="payment"
                  value="demo-card"
                  checked={c.payment === 'demo-card'}
                  onChange={() => c.setPayment('demo-card')}
                />
                <CreditCard size={23} />
                <span>
                  Demo card<small>No card details needed</small>
                </span>
                <span className="radio-dot" />
              </label>
              <label className={c.payment === 'demo-cash' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="payment"
                  value="demo-cash"
                  checked={c.payment === 'demo-cash'}
                  onChange={() => c.setPayment('demo-cash')}
                />
                <Coins size={23} />
                <span>
                  Demo cash<small>No money is collected</small>
                </span>
                <span className="radio-dot" />
              </label>
            </fieldset>
          )}
          {c.message && c.phase === 'review' && (
            <p className="inline-error" role="alert">
              {c.message}
            </p>
          )}
          <div className="review-actions">
            {c.phase === 'review' ? (
              <>
                <button
                  className="primary-button"
                  disabled={!c.online || c.storageError}
                  onClick={() => void c.place()}
                >
                  Place demo order · {money(c.total)}
                  <ArrowRight size={18} />
                </button>
                <button className="text-button" onClick={c.edit}>
                  <ArrowLeft size={14} />
                  Back to my order
                </button>
              </>
            ) : (
              <div className="pending-state" role="status">
                <LoaderCircle className="spin" size={28} />
                <span>Confirming your order…</span>
                <small>
                  Please keep this tab open. We’ll recover safely if the connection drops.
                </small>
              </div>
            )}
          </div>
        </>
      )}
      <div className="review-footnote">
        <ShieldCheck size={14} />
        This is a demonstration. Nothing will be charged.
      </div>
    </dialog>
  );
}
