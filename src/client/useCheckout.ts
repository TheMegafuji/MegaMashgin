import { useEffect, useRef, useState } from 'react';
import {
  MAX_CART_UNITS,
  MAX_ITEM_QUANTITY,
  type CartLine,
  type Menu,
  type OrderRequest,
  type Receipt,
} from '../shared/contracts.js';
import { playCartSound } from './sound.js';
import { ApiFailure, closeSession, createSession, fetchMenu, sendOrder } from './api.js';
import {
  emptyCheckout,
  readSaved,
  STORAGE_KEY,
  writeSaved,
  type SavedCheckout,
} from './storage.js';
export type Phase = 'browse' | 'review' | 'submitting' | 'uncertain' | 'confirmed';
export function useCheckout() {
  const savedRef = useRef<SavedCheckout>(emptyCheckout());
  const busy = useRef(false);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [menuState, setMenuState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [phase, setPhase] = useState<Phase>('browse');
  const [payment, setPayment] = useState<OrderRequest['payment']['method']>('demo-card');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [message, setMessage] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const save = (next: SavedCheckout) => {
    writeSaved(sessionStorage, next);
    savedRef.current = next;
  };
  async function loadMenu() {
    setMenuState('loading');
    try {
      setMenu(await fetchMenu());
      setMenuState('ready');
    } catch {
      setMenuState('error');
    }
  }
  async function submitSaved() {
    const saved = savedRef.current;
    if (!saved.intent || !saved.session) return;
    setPhase('submitting');
    setMessage('');
    try {
      const confirmed = await sendOrder(saved.session.token, saved.intent.key, saved.intent.body);
      setReceipt(confirmed);
      setPhase('confirmed');
    } catch (error) {
      if (
        error instanceof ApiFailure &&
        ['MENU_CHANGED', 'ITEM_UNAVAILABLE', 'INVALID_REQUEST', 'ORDER_TOO_LARGE'].includes(
          error.code,
        )
      ) {
        try {
          save({ ...savedRef.current, intent: undefined });
        } catch {
          setStorageError(true);
        }
        setMessage(error.message);
        setPhase('browse');
        await loadMenu();
      } else {
        setMessage(
          error instanceof ApiFailure
            ? error.message
            : 'The connection was interrupted. Your order may already be saved.',
        );
        setPhase('uncertain');
      }
    }
  }
  useEffect(() => {
    void loadMenu();
    try {
      const saved = readSaved(sessionStorage);
      savedRef.current = saved;
      setCart(saved.cart);
      if (saved.intent) {
        setPayment(saved.intent.body.payment.method);
        busy.current = true;
        void submitSaved().finally(() => {
          busy.current = false;
        });
      }
    } catch {
      setStorageError(true);
      setMessage(
        'This browser could not restore saved checkout data. Use a browser with session storage enabled before placing an order.',
      );
    }
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  const changeQuantity = (productId: string, delta: number) => {
    if (storageError || busy.current || !['browse', 'review'].includes(phase)) return;
    const product = menu?.products.find((item) => item.id === productId);
    if (delta > 0 && !product?.available) return;
    const current = cart.find((line) => line.productId === productId)?.quantity ?? 0;
    const quantity = Math.max(0, Math.min(MAX_ITEM_QUANTITY, current + delta));
    if (quantity === current) return;
    const next = [
      ...cart.filter((line) => line.productId !== productId),
      ...(quantity ? [{ productId, quantity }] : []),
    ];
    if (next.reduce((sum, line) => sum + line.quantity, 0) > MAX_CART_UNITS) {
      setMessage('This demo accepts up to 40 items per order.');
      return;
    }
    try {
      save({ ...savedRef.current, cart: next });
      setStorageError(false);
    } catch {
      setStorageError(true);
      setMessage('Enable session storage in this browser to place an order safely.');
      return;
    }
    setCart(next);
    if (quantity > current && product) playCartSound(product.category);
  };
  const clearCart = () => {
    if (busy.current || savedRef.current.intent) return;
    try {
      save({ ...savedRef.current, cart: [] });
      setCart([]);
    } catch {
      setStorageError(true);
    }
  };
  async function place() {
    if (busy.current || !menu || !cart.length || storageError || !online) return;
    busy.current = true;
    setPhase('submitting');
    setMessage('');
    try {
      const session = savedRef.current.session ?? (await createSession());
      const intent = {
        key: crypto.randomUUID(),
        body: { items: cart, payment: { method: payment }, menuRevision: menu.revision },
      };
      save({ ...savedRef.current, cart, session, intent });
      await submitSaved();
    } catch (error) {
      setPhase('review');
      setMessage(
        error instanceof ApiFailure
          ? error.message
          : 'We could not prepare a recoverable checkout. Check your connection and browser storage, then try again.',
      );
    } finally {
      busy.current = false;
    }
  }
  async function recover() {
    if (busy.current || !online) return;
    busy.current = true;
    try {
      await submitSaved();
    } finally {
      busy.current = false;
    }
  }
  async function nextCustomer() {
    if (busy.current) return;
    busy.current = true;
    const token = savedRef.current.session?.token;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      setStorageError(true);
      busy.current = false;
      return;
    }
    savedRef.current = emptyCheckout();
    if (token)
      void closeSession(token).catch(() => {
        /* Local identity is already cleared; server session expires independently. */
      });
    setCart([]);
    setReceipt(null);
    setMessage('');
    setPhase('browse');
    setPayment('demo-card');
    busy.current = false;
    void loadMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const lines = cart.map((line) => ({
    ...line,
    product: menu?.products.find((product) => product.id === line.productId),
  }));
  const total = lines.reduce(
    (sum, line) => sum + (line.product?.priceCents ?? 0) * line.quantity,
    0,
  );
  const units = cart.reduce((sum, line) => sum + line.quantity, 0);
  const validCart = lines.length > 0 && lines.every((line) => line.product?.available);
  return {
    menu,
    menuState,
    cart,
    lines,
    phase,
    payment,
    receipt,
    message,
    storageError,
    online,
    total,
    units,
    validCart,
    loadMenu,
    changeQuantity,
    clearCart,
    place,
    recover,
    nextCustomer,
    setPayment,
    review: () => {
      if (validCart && online && !storageError) {
        setMessage('');
        setPhase('review');
      }
    },
    edit: () => {
      if (phase === 'review') setPhase('browse');
    },
    dismissMessage: () => setMessage(''),
  };
}
