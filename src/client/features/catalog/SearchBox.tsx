import { ArrowUpLeft, LoaderCircle, Search, Sparkles, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { money, type Product } from '../../../shared/contracts.js';
import { localMatches, type Suggestion } from '../../../shared/discovery.js';
import { fetchSuggestions } from '../../lib/api.js';

export function SearchBox({
  products,
  value,
  onChange,
  onSelect,
}: {
  products: Product[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (product: Product) => void;
}) {
  const [open, setOpen] = useState(false),
    [active, setActive] = useState(-1);
  const [smart, setSmart] = useState<{ query: string; result: Suggestion } | null>(null);
  const [loading, setLoading] = useState(false);
  const sequence = useRef(0),
    root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const direct = localMatches(products, value);
  const ai =
    smart?.query === value
      ? smart.result.products
          .flatMap((line) => {
            const p = products.find((p) => p.id === line.productId && p.available);
            return p ? [p] : [];
          })
          .filter((p) => !direct.some((d) => d.id === p.id))
      : [];
  const options = [...direct, ...ai];
  useEffect(() => {
    const current = ++sequence.current;
    const controller = new AbortController();
    setSmart(null);
    setActive(-1);
    setLoading(false);
    if (value.trim().length < 3 || !open) return () => controller.abort();
    setLoading(true);
    const timer = setTimeout(() => {
      void fetchSuggestions(value, controller.signal)
        .then((result) => {
          if (current === sequence.current && !controller.signal.aborted)
            setSmart({ query: value, result });
        })
        .catch(() => {
          /* Local matches stay usable if semantic search fails. */
        })
        .finally(() => {
          if (current === sequence.current && !controller.signal.aborted) setLoading(false);
        });
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, open]);
  useEffect(() => {
    if (active >= 0)
      document.getElementById(listId + '-' + active)?.scrollIntoView({ block: 'nearest' });
  }, [active, listId]);
  const choose = (product: Product) => {
    onSelect(product);
    setOpen(false);
    setActive(-1);
  };
  const shown = open && value.trim().length > 0;
  const resultButton = (product: Product, index: number) => (
    <div
      key={product.id}
      id={listId + '-' + index}
      role="option"
      aria-selected={active === index}
      className={'suggestion-row' + (active === index ? ' is-active' : '')}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => choose(product)}
    >
      <img src={product.image} alt="" width="48" height="40" />
      <span>
        <strong>{product.name}</strong>
        <small>
          {product.category}
          {!product.available ? ' · Back soon' : ''}
        </small>
      </span>
      <b>{money(product.priceCents)}</b>
      <ArrowUpLeft size={15} />
    </div>
  );
  return (
    <div
      className="search-discovery"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <div className={'search-box' + (shown ? ' expanded' : '')}>
        <Search size={21} />
        <input
          type="search"
          role="combobox"
          aria-label="Search the menu"
          aria-expanded={shown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? listId + '-' + active : undefined}
          placeholder="Try “something crunchy” or “iced coffee”"
          value={value}
          maxLength={120}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, options.length - 1));
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              setOpen(false);
              setActive(-1);
            }
            if (event.key === 'Enter' && active >= 0 && options[active]) {
              event.preventDefault();
              choose(options[active]);
            }
          }}
        />
        {value ? (
          <button
            className="search-clear"
            aria-label="Clear search"
            onClick={() => {
              onChange('');
              root.current?.querySelector('input')?.focus();
            }}
          >
            <X size={17} />
          </button>
        ) : (
          <span className="search-hint">Find your good</span>
        )}
      </div>
      {shown && (
        <div
          className="suggestion-panel"
          tabIndex={0}
          role="region"
          aria-label="Search suggestions"
        >
          <div id={listId} role="listbox" aria-label="Product suggestions">
            <div role="group" aria-label="Menu matches">
              <div className="suggestion-label" role="presentation">
                <Search size={13} />
                Menu matches <span>instant</span>
              </div>
              {direct.length ? (
                direct.map((p, i) => resultButton(p, i))
              ) : (
                <div role="presentation" className="suggestion-empty">
                  No exact matches. Try a product name or explore a category.
                </div>
              )}
            </div>
            <div role="group" aria-label="AI suggestions">
              <div className="suggestion-label smart-label" role="presentation">
                <Sparkles size={14} />
                AI suggestions <span>Jev</span>
              </div>
              {ai.map((p, i) => resultButton(p, direct.length + i))}
            </div>
          </div>
          <div className="smart-status" role="status" aria-live="polite">
            {loading ? (
              <>
                <LoaderCircle className="spin" size={14} />
                Finding a few more possibilities…
              </>
            ) : ai.length ? (
              'Suggestions by meaning. Prices always come from the menu.'
            ) : value.trim().length < 3 ? (
              'Type 3 characters to explore with AI.'
            ) : smart?.result.status === 'ready' ? (
              'Your best matches are already above.'
            ) : smart?.result.status === 'no-match' ? (
              'No confident extra match. Keep exploring the menu.'
            ) : (
              'AI suggestions are taking a break. Menu search still works.'
            )}
          </div>
          <p className="search-privacy">
            Search text and menu descriptions are sent to TypeSafe for suggestions.
          </p>
        </div>
      )}
    </div>
  );
}
