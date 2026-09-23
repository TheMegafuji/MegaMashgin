import {
  ChevronRight,
  Coffee,
  History as HistoryIcon,
  Leaf,
  LoaderCircle,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Volume2,
  VolumeX,
  WifiOff,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { money } from '../../shared/contracts.js';
import { localMatches } from '../../shared/discovery.js';
import { useCartSound } from '../audio/sound.js';
import { Brand } from '../components/Brand.js';
import { Collections, Landing, categories } from '../features/catalog/Landing.js';
import { ProductCard } from '../features/catalog/ProductCard.js';
import { SearchBox } from '../features/catalog/SearchBox.js';
import { Cart } from '../features/checkout/Cart.js';
import { Confirmation } from '../features/checkout/Confirmation.js';
import { Review } from '../features/checkout/Review.js';
import { useCheckout } from '../features/checkout/useCheckout.js';
import { History } from '../features/history/History.js';
import { useVisitor } from '../features/history/useVisitor.js';

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
