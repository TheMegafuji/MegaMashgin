import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { money, type Receipt } from '../../../shared/contracts.js';
import type { Visitor } from '../../../shared/discovery.js';
import { fetchHistory } from '../../lib/api.js';

export function History({
  visitor,
  onClose,
  onForget,
}: {
  visitor: Visitor | null;
  onClose: () => void;
  onForget: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [orders, setOrders] = useState<Receipt[]>([]),
    [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [confirm, setConfirm] = useState(false),
    [forgetting, setForgetting] = useState(false);
  async function load(next?: string) {
    setLoading(true);
    setError('');
    try {
      const page = await fetchHistory(next);
      setOrders((previous) => (next ? [...previous, ...page.orders] : page.orders));
      setCursor(page.nextCursor);
    } catch {
      setError('We could not load your saved orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    dialog.current?.showModal();
    void load();
  }, []);
  async function forget() {
    setForgetting(true);
    setError('');
    try {
      await onForget();
      onClose();
    } catch {
      setError('This device could not be forgotten. Please try again.');
    } finally {
      setForgetting(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="history-dialog"
      aria-label="Order history"
      onCancel={(event) => {
        event.preventDefault();
        if (!forgetting) onClose();
      }}
    >
      <header className="history-header">
        <div>
          <span className="eyebrow">YOUR LITTLE PIT STOPS</span>
          <h2>My orders</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close order history"
          disabled={forgetting}
          onClick={onClose}
        >
          <X />
        </button>
      </header>
      <div className="visitor-pass">
        <ShieldCheck size={20} />
        <div>
          <strong>Guest {visitor?.id.slice(0, 8) ?? 'visitor'}</strong>
          <p>Saved for this browser for 30 days. No signup needed.</p>
        </div>
      </div>
      <div className="history-body">
        {orders.length === 0 && !loading && !error && (
          <div className="history-empty">
            <Clock3 size={38} />
            <h3>Your first good thing awaits.</h3>
            <p>Complete a checkout and your receipt will appear here.</p>
            <button className="secondary-button" onClick={onClose}>
              Explore the market
              <ArrowRight size={16} />
            </button>
          </div>
        )}
        {orders.map((order) => (
          <details className="history-order" key={order.id}>
            <summary>
              <span className="history-check">
                <CheckCircle2 size={19} />
              </span>
              <span>
                <strong>{order.reference}</strong>
                <small>
                  {new Date(order.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}{' '}
                  · {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                </small>
              </span>
              <b>{money(order.totalCents)}</b>
            </summary>
            <ul>
              {order.items.map((item) => (
                <li key={item.productId}>
                  <span>
                    {item.quantity} × {item.name}
                  </span>
                  <strong>{money(item.lineTotalCents)}</strong>
                </li>
              ))}
            </ul>
            <p>
              Confirmed · {order.paymentMethod === 'demo-card' ? 'Demo card' : 'Demo cash'} · No
              payment collected
            </p>
          </details>
        ))}
        {loading && (
          <p className="history-loading" role="status">
            <LoaderCircle className="spin" size={19} />
            Loading your receipts…
          </p>
        )}
        {error && (
          <div className="inline-error" role="alert">
            {error}
            <button className="text-button" onClick={() => void load()}>
              Try again
            </button>
          </div>
        )}
        {cursor && !loading && (
          <button className="secondary-button" onClick={() => void load(cursor)}>
            Load earlier orders
          </button>
        )}
      </div>
      <footer className="history-footer">
        {confirm ? (
          <div className="forget-confirm">
            <strong>Using a shared device?</strong>
            <p>
              Forget this guest to clear the cart and remove access to this order history. There is
              no password recovery.
            </p>
            <div>
              <button className="danger-button" disabled={forgetting} onClick={() => void forget()}>
                {forgetting ? 'Forgetting…' : 'Yes, forget this device'}
              </button>
              <button
                className="text-button"
                disabled={forgetting}
                onClick={() => setConfirm(false)}
              >
                Keep my guest
              </button>
            </div>
          </div>
        ) : (
          <button className="text-button" onClick={() => setConfirm(true)}>
            <Trash2 size={14} />
            Forget this device
          </button>
        )}
      </footer>
    </dialog>
  );
}
