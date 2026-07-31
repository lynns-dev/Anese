import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { T, S } from '../lib/theme';
import ProductVisual from './ProductVisual';
import { getProductById, FREE_GIFT, FREE_GIFT_THRESHOLD } from '../lib/products';
import { createApplePayButton, tokenizeWallet } from '../lib/squareClient';
import { loadCheckoutProgress, clearCheckoutProgress, hasUsableShipping } from '../lib/checkoutProgress';
import { fbTrack, generateEventId } from '../lib/fbPixel';
import { getStoredAttribution } from '../lib/attribution';
import { getSessionId } from '../lib/session';

const FREE_SHIP_AT = 50;
const FREE_GIFT_AT = FREE_GIFT_THRESHOLD;

export default function CartDrawer({
  cart, open, onClose, remove, setQty, total, add, clear,
  appliedDiscount, applyDiscount, clearDiscount, codeDiscountAmount, discountedTotal,
}) {
  const router = useRouter();
  const [discountCode, setDiscountCode] = React.useState('');
  const [discountMessage, setDiscountMessage] = React.useState('');
  const [discountSubmitting, setDiscountSubmitting] = React.useState(false);
  const puff = getProductById('puff');
  const hasPuff = cart.some((i) => i.id === 'puff');
  const puffPrice = puff ? Math.round(puff.price * 0.9 * 100) / 100 : 0;

  // Apple Pay right on the drawer — a fast path for a shopper who already
  // has shipping info on file this session (e.g. saved earlier at
  // /checkout, or from a previous order this browser session) so they
  // never have to open the full checkout page at all. Shoppers without
  // saved shipping still see the button (Apple Pay's own sheet doesn't
  // collect a shipping address the way a native Apple Pay integration
  // would here — see lib/squareClient.js), but clicking it sends them to
  // /checkout to enter one first rather than failing silently.
  const appleMethodRef = React.useRef(null);
  const [appleAvailable, setAppleAvailable] = React.useState(false);
  const [walletSubmitting, setWalletSubmitting] = React.useState(false);
  const [walletMessage, setWalletMessage] = React.useState('');
  const shippingCost = total >= FREE_SHIP_AT || total === 0 ? 0 : 5;
  const grandTotal = discountedTotal + shippingCost;
  const latestRef = React.useRef({});
  latestRef.current = { cart, grandTotal };

  React.useEffect(() => {
    if (!open || cart.length === 0) return;
    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      const apple = await createApplePayButton(latestRef.current.grandTotal, 'cart-apple-pay-button');
      if (cancelled) {
        apple?.destroy?.().catch(() => {});
        return;
      }
      if (!apple) return;
      appleMethodRef.current = apple;
      setAppleAvailable(true);
      const btn = document.getElementById('cart-apple-pay-button');
      const onClick = (event) => { event.preventDefault(); handleApplePayClick(); };
      btn?.addEventListener('click', onClick);
      cleanup = () => btn?.removeEventListener('click', onClick);
    })();

    return () => {
      cancelled = true;
      cleanup();
      appleMethodRef.current?.destroy?.().catch(() => {});
      appleMethodRef.current = null;
      setAppleAvailable(false);
      setWalletMessage('');
    };
    // handleApplePayClick only ever reads fresh state via latestRef/refs —
    // safe to omit here so this doesn't re-mount on every cart edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cart.length]);

  const handleApplePayClick = async () => {
    const progress = loadCheckoutProgress();
    if (!hasUsableShipping(progress)) {
      setWalletMessage('Add your shipping address to pay with Apple Pay — continuing to checkout…');
      router.push('/checkout');
      return;
    }
    if (!appleMethodRef.current) return;
    setWalletSubmitting(true);
    setWalletMessage('');
    try {
      const token = await tokenizeWallet(appleMethodRef.current);
      const { cart: currentCart, grandTotal: amount } = latestRef.current;
      const purchaseEventId = generateEventId();
      const res = await fetch('/api/square-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          amount,
          items: currentCart,
          email: progress.email,
          shipping: progress.shipping,
          eventId: purchaseEventId,
          url: window.location.href,
          paymentMethod: 'Square (Apple Pay)',
          attribution: getStoredAttribution(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');

      fbTrack('Purchase', {
        content_ids: currentCart.map((i) => i.id),
        contents: currentCart.map((i) => ({ id: i.id, quantity: i.quantity })),
        value: amount,
        currency: 'USD',
      }, purchaseEventId);
      fetch('/api/track/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'purchase', eventId: purchaseEventId, value: amount, sessionId: getSessionId() }),
        keepalive: true,
      }).catch(() => {});

      clearCheckoutProgress();
      onClose();
      clear?.();
      router.push('/success');
    } catch (err) {
      setWalletMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setWalletSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (appliedDiscount) setDiscountCode(appliedDiscount.code);
  }, [appliedDiscount]);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountSubmitting(true);
    setDiscountMessage('Checking…');
    const data = await applyDiscount(discountCode);
    setDiscountSubmitting(false);
    if (data.valid) {
      setDiscountMessage(`Code "${data.code}" applied.`);
    } else if (data.error) {
      setDiscountMessage('Could not check that code — please try again.');
    } else {
      setDiscountMessage('That code isn’t valid.');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.originalPrice ?? item.price) * item.quantity, 0);
  const discountTotal = subtotal - total;
  const freeShipping = total >= FREE_SHIP_AT;

  // Free shipping and the free gift unlock together at the same threshold,
  // so this is a single-stage progress bar (no separate marker needed).
  const progressPct = Math.min(100, (total / FREE_GIFT_AT) * 100);
  const progressMessage = freeShipping
    ? `You've unlocked free shipping and a free ${FREE_GIFT.name}.`
    : `Add $${(FREE_GIFT_AT - total).toFixed(2)} more for free shipping and a free ${FREE_GIFT.name}.`;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(22,20,15,0.4)', zIndex: 200,
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity .3s',
        }}
      />
      <aside
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(420px, 100%)', zIndex: 201,
          background: T.white, borderLeft: `1px solid ${T.line}`, padding: '32px 30px',
          transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .35s ease',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexShrink: 0 }}>
          <span style={S.label}>Your cart</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: T.ink }}>×</button>
        </div>

        {cart.length > 0 && (
          <div style={{ marginBottom: 24, flexShrink: 0 }}>
            <p style={{ fontSize: 12, color: T.ink, marginBottom: 8 }}>{progressMessage}</p>
            <div style={progressTrack}>
              <div style={{ ...progressFill, width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {cart.length === 0 && <p style={{ color: T.soft, fontSize: 14 }}>Your cart is empty.</p>}
          {cart.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '18px 0', borderBottom: `1px solid ${T.line}` }}>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={itemImg}>
                  <ProductVisual id={item.id} images={item.images} alt={item.name} width={56} staticImage />
                </div>
                <div>
                  <div style={{ fontFamily: T.serif, fontWeight: 300, fontSize: 20 }}>{item.name}</div>
                  {item.plan === 'subscribe' && (
                    <div style={subscribeNote}>Subscribe &amp; save · every 2 months</div>
                  )}
                  {item.id === FREE_GIFT.id ? (
                    <div style={{ fontSize: 12, color: T.soft, marginTop: 2 }}>
                      <span style={{ textDecoration: 'line-through', marginRight: 6 }}>${item.originalPrice}</span>
                      Free — added automatically at $50
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, color: T.soft, marginTop: 2 }}>${item.price} · {item.size}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                        <button onClick={() => setQty(item.id, item.quantity - 1)} style={qtyBtn}>−</button>
                        <span style={{ fontSize: 13 }}>{item.quantity}</span>
                        <button onClick={() => setQty(item.id, item.quantity + 1)} style={qtyBtn}>+</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {item.id !== FREE_GIFT.id && (
                <button onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.soft, alignSelf: 'flex-start' }}>Remove</button>
              )}
            </div>
          ))}

          {puff && !hasPuff && cart.length > 0 && (
            <div style={upsellSection}>
              <p style={{ ...S.label, marginBottom: 12 }}>You might also like</p>
              <div style={upsellCard}>
                <div style={itemImg}>
                  <ProductVisual id="puff" images={puff.images} alt={puff.name} width={44} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>{puff.name}</div>
                  <div style={{ fontSize: 12, color: T.soft, marginTop: 2 }}>
                    <span style={{ textDecoration: 'line-through', marginRight: 6 }}>${puff.price}</span>
                    ${puffPrice.toFixed(2)} · 10% off
                  </div>
                </div>
                <button onClick={() => add({ ...puff, price: puffPrice, originalPrice: puff.price }, 1)} style={upsellAddBtn}>Add</button>
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div style={{ marginTop: 16, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                placeholder="Discount code"
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value);
                  if (appliedDiscount) clearDiscount();
                  setDiscountMessage('');
                }}
                style={discountInput}
              />
              <button type="button" style={S.btnOutline} onClick={handleApplyDiscount} disabled={discountSubmitting}>Apply</button>
            </div>
            {discountMessage && (
              <p style={{ fontSize: 12, color: appliedDiscount ? T.ink : '#a13d2b', marginTop: 6 }}>{discountMessage}</p>
            )}
          </div>
        )}

        <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 20, marginTop: 16, flexShrink: 0 }}>
          <div style={summaryRow}>
            <span style={{ color: T.soft }}>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discountTotal > 0 && (
            <div style={summaryRow}>
              <span style={{ color: T.soft }}>Discount</span>
              <span>−${discountTotal.toFixed(2)}</span>
            </div>
          )}
          {codeDiscountAmount > 0 && (
            <div style={summaryRow}>
              <span style={{ color: T.soft }}>Promo ({appliedDiscount.code})</span>
              <span>−${codeDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          <p style={shippingNote}>{freeShipping ? 'Free shipping' : 'Shipping and taxes calculated at checkout'}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '14px 0 18px' }}>
            <span style={S.label}>Total</span>
            <span style={{ fontFamily: T.serif, fontWeight: 300, fontSize: 24 }}>${discountedTotal.toFixed(2)}</span>
          </div>
          <Link
            href="/checkout"
            onClick={(e) => cart.length === 0 && e.preventDefault()}
            style={{ ...S.btnFill, width: '100%', justifyContent: 'center', opacity: cart.length === 0 ? 0.4 : 1, textAlign: 'center' }}
          >
            Checkout
          </Link>
          <div style={{ display: appleAvailable ? 'block' : 'none', marginTop: 10, opacity: walletSubmitting ? 0.6 : 1, pointerEvents: walletSubmitting ? 'none' : 'auto' }}>
            <div id="cart-apple-pay-button" style={walletButtonContainer} />
          </div>
          {walletMessage && (
            <p style={{ fontSize: 12, color: '#a13d2b', marginTop: 8 }}>{walletMessage}</p>
          )}
        </div>
      </aside>
    </>
  );
}

const qtyBtn = {
  width: 26, height: 26, border: `1px solid ${T.line}`, background: 'transparent',
  cursor: 'pointer', fontSize: 14, lineHeight: 1, color: '#16140F',
};

const itemImg = {
  width: 56, height: 56, flexShrink: 0, overflow: 'hidden',
  background: T.paper, border: `1px solid ${T.line}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const subscribeNote = { fontSize: 11, color: T.soft, marginTop: 3, letterSpacing: '0.02em' };

const progressTrack = { position: 'relative', height: 4, background: T.paper, marginTop: 2 };
const progressFill = { position: 'absolute', top: 0, left: 0, bottom: 0, background: T.ink, transition: 'width .3s ease' };

const upsellSection = { background: T.paper, padding: '18px 16px', marginTop: 12 };
const upsellCard = { display: 'flex', alignItems: 'center', gap: 14 };
const upsellAddBtn = {
  fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', border: `1px solid ${T.ink}`,
  background: 'none', padding: '8px 14px', cursor: 'pointer', fontFamily: T.sans, flexShrink: 0,
};

const discountInput = {
  flex: 1, height: 44, padding: '0 14px', border: `1px solid ${T.line}`, background: T.white,
  fontFamily: T.sans, fontSize: 13, color: T.ink, outline: 'none', boxSizing: 'border-box',
};

const summaryRow = { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' };
const shippingNote = { fontSize: 11, color: T.soft, marginTop: 8, letterSpacing: '0.02em' };
// No background/border here — Apple Pay styles its own attached button.
const walletButtonContainer = { width: '100%', minHeight: 44 };
