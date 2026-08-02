import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { T, S } from '../lib/theme';
import ProductVisual from './ProductVisual';
import { getProductById, FREE_GIFT, FREE_GIFT_THRESHOLD } from '../lib/products';
import { createApplePayButton, createGooglePayButton, tokenizeWalletWithContact } from '../lib/squareClient';
import { clearCheckoutProgress } from '../lib/checkoutProgress';
import { isShopPayAvailable, mountShopPayButton } from '../lib/shopPayClient';
import { fbTrack, generateEventId } from '../lib/fbPixel';
import { getStoredAttribution } from '../lib/attribution';
import { getSessionId } from '../lib/session';
import { getIdentity } from '../lib/identity';

const SHOP_PAY_CONTAINER_ID = 'cart-shop-pay-button';
const GOOGLE_PAY_CONTAINER_ID = 'cart-google-pay-button';

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
  const [shopPayReady, setShopPayReady] = React.useState(false);
  const [payError, setPayError] = React.useState('');
  const [paying, setPaying] = React.useState(false);
  const shopPayEventIdRef = React.useRef(null);
  const puff = getProductById('puff');
  const hasPuff = cart.some((i) => i.id === 'puff');
  const puffPrice = puff ? Math.round(puff.price * 0.9 * 100) / 100 : 0;

  // Apple Pay right on the drawer — there's no address form here at all, so
  // the payment request is built with requestContact so Apple's own sheet
  // gathers name/address/email itself; extractWalletContact() (in
  // lib/squareClient.js) maps that back into the site's shipping shape and
  // the charge is abandoned (not attempted) if no usable address comes
  // back, so an order can never be taken with nowhere to ship it.
  const appleMethodRef = React.useRef(null);
  const googleMethodRef = React.useRef(null);
  const [appleAvailable, setAppleAvailable] = React.useState(false);
  const [googleAvailable, setGoogleAvailable] = React.useState(false);
  const [walletSubmitting, setWalletSubmitting] = React.useState(false);
  const [walletMessage, setWalletMessage] = React.useState('');
  // TEMPORARY — see the matching walletDebugError in pages/checkout.jsx for
  // why this exists: surfaces the real Square SDK failure reason on-screen
  // instead of only in devtools' console.
  const [walletDebugError, setWalletDebugError] = React.useState('');

  const subtotal = cart.reduce((sum, item) => sum + (item.originalPrice ?? item.price) * item.quantity, 0);
  const discountTotal = subtotal - total;
  const freeShipping = total >= FREE_SHIP_AT;

  // Free shipping and the free gift unlock together at the same threshold,
  // so this is a single-stage progress bar (no separate marker needed).
  const progressPct = Math.min(100, (total / FREE_GIFT_AT) * 100);
  const progressMessage = freeShipping
    ? `You've unlocked free shipping and a free ${FREE_GIFT.name}.`
    : `Add $${(FREE_GIFT_AT - total).toFixed(2)} more for free shipping and a free ${FREE_GIFT.name}.`;

  // Same $0/$5 rule pages/checkout.jsx charges — this drawer has no address
  // yet, so like checkout before one's entered, an empty cart charges
  // nothing and everything else falls back to the flat rate.
  const shippingCost = cart.length === 0 ? 0 : (freeShipping ? 0 : 5);
  const grandTotal = discountedTotal + shippingCost;

  const latestRef = React.useRef({});
  latestRef.current = { cart, grandTotal, shippingCost, discountCode: appliedDiscount?.code };

  React.useEffect(() => {
    if (!open || cart.length === 0) return undefined;
    let cancelled = false;
    let googleClickCleanup = null;
    (async () => {
      const onWalletError = (label) => (err) => {
        if (cancelled) return;
        setWalletDebugError((prev) => `${prev ? `${prev}\n` : ''}${label}: ${err?.message || err}`);
      };

      const apple = await createApplePayButton(latestRef.current.grandTotal, onWalletError('Apple Pay'), { requestContact: true });
      if (cancelled) return;
      appleMethodRef.current = apple;
      setAppleAvailable(Boolean(apple));

      const google = await createGooglePayButton(latestRef.current.grandTotal, GOOGLE_PAY_CONTAINER_ID, onWalletError('Google Pay'), { requestContact: true });
      if (cancelled) {
        google?.destroy?.().catch(() => {});
        return;
      }
      if (google) {
        googleMethodRef.current = google;
        setGoogleAvailable(true);
        const btn = document.getElementById(GOOGLE_PAY_CONTAINER_ID);
        const onClick = (event) => { event.preventDefault(); handleWalletPay(googleMethodRef, 'Google Pay'); };
        btn?.addEventListener('click', onClick);
        googleClickCleanup = () => btn?.removeEventListener('click', onClick);
      }
    })();
    return () => {
      cancelled = true;
      googleClickCleanup?.();
      googleMethodRef.current?.destroy?.().catch(() => {});
      appleMethodRef.current = null;
      googleMethodRef.current = null;
      setAppleAvailable(false);
      setGoogleAvailable(false);
      setWalletMessage('');
    };
  }, [open, cart.length]);

  const handleWalletPay = async (methodRef, label) => {
    if (!methodRef.current) return;
    setWalletSubmitting(true);
    setWalletMessage('');
    try {
      const { token, contact } = await tokenizeWalletWithContact(methodRef.current);
      // Nothing is charged until there's somewhere to ship it — the wallet
      // sheet returns its contact info alongside the token, and an order
      // without a usable address can't be fulfilled.
      if (!contact) {
        setWalletMessage(`${label} didn’t return a shipping address. Please use checkout instead.`);
        return;
      }
      const { cart: currentCart, grandTotal: amount } = latestRef.current;
      const purchaseEventId = generateEventId();
      const res = await fetch('/api/square-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          amount,
          items: currentCart,
          email: contact.email,
          shipping: contact,
          eventId: purchaseEventId,
          url: window.location.href,
          paymentMethod: `Square (${label})`,
          attribution: getStoredAttribution(),
          sessionId: getSessionId(),
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
      await router.push('/success');
      clear?.();
    } catch (err) {
      if (!err.cancelled) setWalletMessage(err.message || 'Something went wrong. Please try again.');
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

  // Shop Pay's button doesn't bake the amount in at creation — a fresh
  // session is requested (POST /api/shop-pay/session) each time the
  // shopper opens the sheet, so this mounts once per drawer-open rather
  // than rebuilding on every total change.
  React.useEffect(() => {
    if (!open || cart.length === 0) return undefined;
    let cancelled = false;
    let teardown = null;
    (async () => {
      const available = await isShopPayAvailable();
      if (cancelled || !available) return;
      teardown = await mountShopPayButton(SHOP_PAY_CONTAINER_ID, {
        onSessionRequest: async () => {
          setPayError('');
          setPaying(true);
          const { cart: items, grandTotal: amount, shippingCost: shipping, discountCode: code } = latestRef.current;
          const purchaseEventId = generateEventId();
          shopPayEventIdRef.current = purchaseEventId;
          const res = await fetch('/api/shop-pay/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cart: items,
              amount,
              shippingCost: shipping,
              discountCode: code,
              eventId: purchaseEventId,
              email: getIdentity().email || undefined,
              url: window.location.href,
              attribution: getStoredAttribution(),
              sessionId: getSessionId(),
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Shop Pay is unavailable for this cart.');
          return data.session;
        },
        onComplete: () => {
          // Optimistic UX only — the order this site's own ledger/admin
          // actually records comes from the Shopify webhook
          // (pages/api/shop-pay/webhook.js), the one thing guaranteed to
          // see every completed order even if this event never fires.
          const { cart: items, grandTotal: amount } = latestRef.current;
          fbTrack('Purchase', {
            content_ids: items.map((i) => i.id),
            content_type: 'product',
            contents: items.map((i) => ({ id: i.id, quantity: i.quantity, item_price: i.price })),
            value: amount,
            currency: 'USD',
          }, shopPayEventIdRef.current);
          onClose?.();
          router.push('/success');
          clear?.();
          setPaying(false);
        },
        onClose: () => setPaying(false),
        onError: (err) => {
          setPayError(err?.message || 'Something went wrong with Shop Pay. Please try again.');
          setPaying(false);
        },
      });
      if (!cancelled) setShopPayReady(Boolean(teardown));
    })();
    return () => {
      cancelled = true;
      teardown?.();
      setShopPayReady(false);
    };
  }, [open, cart.length]);

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
          {walletDebugError && (
            <pre style={{
              whiteSpace: 'pre-wrap', fontSize: 11, color: '#a13d2b', background: '#fdf1ee',
              border: '1px solid #eab6a8', borderRadius: 6, padding: '8px 10px', marginTop: 12,
            }}
            >
              {walletDebugError}
            </pre>
          )}
          {/* Apple Pay + Google Pay, under the main Checkout button and
              split off by an "or". Each renders only once Square confirms
              that wallet is actually available (Safari + a verified
              merchant domain for Apple Pay; a saved card for Google Pay),
              so nothing shows on browsers/accounts that can't offer it. */}
          {(appleAvailable || googleAvailable || shopPayReady) && cart.length > 0 && (
            <>
              <div style={orDivider}>
                <span style={orDividerLine} />
                <span style={orDividerText}>or</span>
                <span style={orDividerLine} />
              </div>
              {appleAvailable && (
                <button
                  type="button"
                  className="cart-apple-pay-button"
                  aria-label="Buy with Apple Pay"
                  disabled={walletSubmitting}
                  onClick={() => handleWalletPay(appleMethodRef, 'Apple Pay')}
                  style={{ opacity: walletSubmitting ? 0.6 : 1, marginBottom: 10 }}
                />
              )}
            </>
          )}
          {/* Always in the DOM once there's a cart to mount into — Square's
              SDK attach()es its own iframe button into this id as soon as
              createGooglePayButton() resolves, which can happen before
              googleAvailable flips true. Only the visible space collapses. */}
          {cart.length > 0 && (
            <div
              id={GOOGLE_PAY_CONTAINER_ID}
              style={{
                width: '100%', minHeight: googleAvailable ? 44 : 0,
                display: googleAvailable ? 'block' : 'none',
                opacity: walletSubmitting ? 0.6 : 1, pointerEvents: walletSubmitting ? 'none' : 'auto',
                marginBottom: googleAvailable && shopPayReady ? 10 : 0,
              }}
            />
          )}
          {walletMessage && (
            <p style={{ fontSize: 12, color: '#a13d2b', marginTop: 8 }}>{walletMessage}</p>
          )}
          {/* Always in the DOM once there's a cart to mount into — the SDK
              (lib/shopPayClient.js) targets this id as soon as
              isShopPayAvailable() resolves, which can happen before
              shopPayReady flips true. Only the visible space collapses. */}
          {cart.length > 0 && (
            <div id={SHOP_PAY_CONTAINER_ID} style={{ display: shopPayReady ? 'block' : 'none', opacity: paying ? 0.6 : 1, pointerEvents: paying ? 'none' : 'auto' }} />
          )}
          {payError && <p style={{ fontSize: 12, color: '#a13d2b', marginTop: 10 }}>{payError}</p>}

          <style jsx>{`
            .cart-apple-pay-button {
              display: block;
              width: 100%;
              min-height: 44px;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              -webkit-appearance: -apple-pay-button;
              -apple-pay-button-type: buy;
              -apple-pay-button-style: black;
            }
            @supports not (-webkit-appearance: -apple-pay-button) {
              .cart-apple-pay-button { display: none; }
            }
          `}</style>
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
const orDivider = { display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0' };
const orDividerLine = { flex: 1, height: 1, background: T.line };
const orDividerText = { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.soft };
