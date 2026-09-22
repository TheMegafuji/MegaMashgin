import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Coffee,
  Coins,
  CreditCard,
  Leaf,
  LoaderCircle,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  WifiOff,
  X,
} from 'lucide-react';
import { money, MAX_ITEM_QUANTITY, type Product } from '../shared/contracts.js';
import { useCheckout } from './useCheckout.js';
import { useVisitor } from './visitor.js';
import { History } from './History.js';
import { SearchBox } from './SearchBox.js';
import { Landing, Collections, categories } from './Landing.js';
import { localMatches } from '../shared/discovery.js';
import { History as HistoryIcon, Sparkles, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { Brand } from './Brand.js';
import { ProductAtmosphere, isServedWarm } from './ProductAtmosphere.js';
import { useCartSound } from './sound.js';

type Checkout = ReturnType<typeof useCheckout>;

function Quantity({
  name,
  quantity,
  onChange,
}: {
  name: string;
  quantity: number;
  onChange: (delta: number) => void;
}) {
  return (
    <div className="quantity">
      <button aria-label={'Remove one ' + name} onClick={() => onChange(-1)}>
        <Minus size={15} />
      </button>
      <span aria-label={name + ' quantity'}>{quantity}</span>
      <button
        aria-label={'Add one ' + name}
        disabled={quantity >= MAX_ITEM_QUANTITY}
        onClick={() => onChange(1)}
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
function ProductCard({
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
          <span className="selected-pill">
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
function Cart({ checkout }: { checkout: Checkout }) {
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
function Review({ checkout }: { checkout: Checkout }) {
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
function Confirmation({ checkout }: { checkout: Checkout }) {
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
export function App() {
  const c = useCheckout();
  const identity = useVisitor();
  const sound = useCartSound();
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(16);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [motion, setMotion] = useState(true);
  const products = c.menu?.products ?? [];
  const matching = search.trim() ? localMatches(products, search, products.length) : products;
  const filtered = matching.filter(
    (product) => category === 'All' || product.category === category,
  );
  const locked = c.storageError || ['submitting', 'uncertain'].includes(c.phase);
  const browseCategory = (name: string) => {
    if (c.phase === 'confirmed') void c.nextCustomer();
    setCategory(name);
    setSearch('');
    setVisibleCount(16);
    requestAnimationFrame(() =>
      document.getElementById('market-menu')?.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start',
      }),
    );
  };
  async function forgetDevice() {
    await identity.forget();
    await c.nextCustomer();
  }
  return (
    <div className={'app-shell' + (!motion ? ' motion-paused' : '')}>
      <div className="announcement">
        <span>MASHGIN / MARKET CONCEPT</span>
        <span>
          Self-checkout, made a little brighter <Sparkles size={12} />
        </span>
        <span>DESIGNED & BUILT BY MEGAFUJI</span>
      </div>
      <header className="site-header">
        <Brand />
        <nav className="header-links" aria-label="Main navigation">
          <a
            href="#market-menu"
            onClick={(event) => {
              event.preventDefault();
              browseCategory('All');
            }}
          >
            The market
          </a>
          <button onClick={() => browseCategory('Hot food')}>Feeling hungry?</button>
        </nav>
        <div className="header-actions">
          <button
            className="sound-toggle"
            aria-label={sound.enabled ? 'Mute cart sounds' : 'Enable cart sounds'}
            aria-pressed={sound.enabled}
            title={sound.enabled ? 'Cart sounds on · quiet volume' : 'Cart sounds off'}
            onClick={sound.toggle}
          >
            {sound.enabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button
            className="motion-toggle"
            aria-label={motion ? 'Pause animation' : 'Play animation'}
            onClick={() => setMotion(!motion)}
          >
            {motion ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            className="history-button"
            aria-label="My orders"
            disabled={locked || identity.loading || identity.error}
            onClick={() => setHistoryOpen(true)}
          >
            <HistoryIcon size={18} />
            <span>My orders</span>
            <span className="guest-dot" />
          </button>
          <button
            className="bag-shortcut"
            aria-label={'Your bag, ' + (c.phase === 'confirmed' ? 0 : c.units) + ' items'}
            onClick={() =>
              c.phase === 'confirmed'
                ? browseCategory('All')
                : document
                    .getElementById('your-order')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          >
            <ShoppingBag size={20} />
            <span key={c.units} className="bag-count">
              {c.phase === 'confirmed' ? 0 : c.units}
            </span>
          </button>
        </div>
      </header>
      {identity.error && (
        <div className="identity-banner" role="status">
          We could not connect your guest profile.
          <button onClick={() => void identity.refresh()}>Reconnect</button>
        </div>
      )}
      {!c.online && (
        <div className="offline-banner" role="status">
          <WifiOff size={17} />
          You’re offline. Your order stays here while you reconnect.
        </div>
      )}
      {c.phase === 'confirmed' && c.receipt ? (
        <Confirmation checkout={c} />
      ) : (
        <>
          <Landing
            products={products}
            onCategory={browseCategory}
            onAdd={(id) => c.changeQuantity(id, 1)}
            cart={c.cart}
            locked={locked}
          />
          <Collections onCategory={browseCategory} />
          <main className="shop-layout" id="market-menu">
            <section className="menu-section" aria-label="Market menu">
              <div className="market-heading">
                <div>
                  <span className="eyebrow">A WHOLE LOT OF GOOD</span>
                  <h2>What are you craving?</h2>
                </div>
                <span className="catalog-count">{products.length} little possibilities</span>
              </div>
              <div className="menu-tools">
                <SearchBox
                  products={products}
                  value={search}
                  onChange={(value) => {
                    setSearch(value);
                    setVisibleCount(16);
                  }}
                  onSelect={(product) => {
                    setCategory('All');
                    setSearch(product.name);
                    setVisibleCount(16);
                  }}
                />
                <nav className="categories" aria-label="Menu categories">
                  {categories.map((name) => (
                    <button
                      key={name}
                      aria-label={name}
                      aria-pressed={category === name}
                      className={category === name ? 'active' : ''}
                      onClick={() => {
                        setCategory(name);
                        setVisibleCount(16);
                      }}
                    >
                      {name}
                      <span aria-hidden="true">
                        {name === 'All'
                          ? products.length
                          : products.filter((p) => p.category === name).length}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
              {c.message && c.phase === 'browse' && (
                <div className="message-banner" role="alert">
                  <p>{c.message}</p>
                  {!c.storageError && (
                    <button
                      className="icon-button"
                      aria-label="Dismiss message"
                      onClick={c.dismissMessage}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}
              {c.menuState === 'loading' ? (
                <div className="menu-loading" role="status">
                  <LoaderCircle className="spin" size={23} />
                  <span>Getting the market ready…</span>
                </div>
              ) : c.menuState === 'error' ? (
                <div className="menu-error" role="alert">
                  <Coffee size={35} />
                  <h2>The menu needs a moment.</h2>
                  <p>We couldn’t load the menu. Your order is still here.</p>
                  <button className="secondary-button" onClick={() => void c.loadMenu()}>
                    <RefreshCw size={16} />
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  <div className="section-label">
                    <h3>
                      {search ? 'Your search' : category === 'All' ? 'The good stuff' : category}
                    </h3>
                    <span>
                      {filtered.length} {filtered.length === 1 ? 'find' : 'finds'}
                    </span>
                  </div>
                  {filtered.length ? (
                    <>
                      <div className="product-grid">
                        {filtered.slice(0, visibleCount).map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            locked={locked}
                            quantity={
                              c.cart.find((line) => line.productId === product.id)?.quantity ?? 0
                            }
                            onAdd={() => c.changeQuantity(product.id, 1)}
                          />
                        ))}
                      </div>
                      {visibleCount < filtered.length && (
                        <button
                          className="load-more"
                          onClick={() => setVisibleCount((count) => count + 16)}
                        >
                          More good things <Plus size={16} />
                          <span>{filtered.length - visibleCount} to explore</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="menu-error">
                      <Search size={30} />
                      <h2>
                        {products.length ? 'No matches just yet.' : 'Nothing on the menu yet.'}
                      </h2>
                      <p>Try a product name, describe a craving or explore a category.</p>
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setSearch('');
                          setCategory('All');
                          if (!products.length) void c.loadMenu();
                        }}
                      >
                        {products.length ? 'Show all favorites' : 'Try again'}
                      </button>
                    </div>
                  )}
                </>
              )}
              <p className="menu-disclaimer">
                <Leaf size={13} />
                Fictional products and prices. No payment is collected.
              </p>
            </section>
            <Cart checkout={c} />
          </main>
          <Review checkout={c} />
          {c.units > 0 && c.phase === 'browse' && (
            <button
              className="mobile-order-button"
              onClick={() =>
                document
                  .getElementById('your-order')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            >
              <ShoppingBag size={18} />
              <span>View order · {c.units}</span>
              <strong>{money(c.total)}</strong>
              <ChevronRight size={18} />
            </button>
          )}
        </>
      )}
      {historyOpen && (
        <History
          visitor={identity.visitor}
          onClose={() => setHistoryOpen(false)}
          onForget={forgetDevice}
        />
      )}
      <footer className="site-footer">
        <Brand />
        <p>
          A little market.
          <br />A better kind of break.
        </p>
        <div>
          <span>
            Made by <strong>Megafuji.</strong>
          </span>
          <small>Independent take-home concept. No real payments.</small>
          <nav className="footer-links" aria-label="Project resources">
            <a href="/press/">Press & brand kit</a>
            <a href="/press/#credits">Art credits</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
