import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProductVisual from '../components/ProductVisual';
import AddressFields from '../components/AddressFields';
import { useCart } from '../lib/useCart';
import {
  createSquareCard, tokenizeSquareCard,
  createApplePayButton, createGooglePayButton, createAfterpayButton, tokenizeWallet, tokenizeWalletWithContact,
} from '../lib/squareClient';
import { fbTrack, generateEventId, refreshPixelIdentity } from '../lib/fbPixel';
import { getStoredAttribution } from '../lib/attribution';
import { getSessionId } from '../lib/session';
import { loadCheckoutProgress, saveCheckoutProgress, clearCheckoutProgress } from '../lib/checkoutProgress';
import { setCheckoutStep } from '../lib/checkoutStage';
import { getIdentity, rememberIdentity } from '../lib/identity';
import { T, S } from '../lib/theme';

// Live checkout — charges through Square. QuickBooks Payments is kept as a
// backup at pages/checkout-qb.jsx (a stable, unlinked URL) in case Square
// ever needs to be rotated out again — swap which file lives here the same
// way this page was moved into it. Keep the two pages' non-payment sections
// in sync by hand when either one changes.
//
// A 2-step flow (Shipping -> Payment), modeled on Apple's own checkout
// (large touch-friendly fields/buttons) rather than the old single
// long-scroll form — brand colors/fonts stay ANESE's own, not Apple's blue.
// Payment is the final step: its submit button ("Place order") tokenizes
// and charges the card directly rather than advancing to a separate review
// step. Each step is real, native <form> validation (required/type="email"
// on visible fields only — a step's inputs aren't in the DOM at all while
// another step is active, so the browser only ever validates what's
// currently on screen).
//
// No visible step indicator ("1 Shipping — 2 Payment" dots) any more — Step
// 1's own submit and Step 2's Back button are the only way to move between
// them. An itemized order-items panel (cart + discount code + totals) sits
// at the top of the form column on both steps instead, so a shopper never
// loses sight of what they're buying while filling in the form beneath it.
//
// Billing address is always the shipping address entered in Step 1 — no
// separate billing-address toggle; Step 2 just displays it as a read-only
// recap.

const EMPTY_ADDRESS = { name: '', address: '', apt: '', city: '', state: '', zip: '', phone: '' };

// Social proof shown near the order summary — static copy, not pulled from
// lib/reviewsStore.js (those are per-product; these two are checkout-wide).
const FEATURED_REVIEWS = [
  { rating: 5, text: 'Makes your booty so smooth!', author: 'Alexa, Verified Buyer' },
  { rating: 5, text: 'Worth the price. I want all the products now.', author: 'Kelsea Riess, Verified Buyer' },
];

function LockIcon(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ShipIcon(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M3 7l9-4 9 4-9 4-9-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 7v10l9 4 9-4V7M12 11v10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function ReturnIcon(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 12a8 8 0 1 1 2.34 5.66" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 8v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LeafIcon(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5 19c9 0 14-5 14-14-9 0-14 5-14 14Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M5 19c0-6 3-9 9-11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 12.5l5.5 5.5L20 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Itemized cart, discount code entry, and the full price breakdown — shown
// once at the top of the form column on both steps (in the space the old
// Shipping/Payment step indicator used to occupy), so a shopper never
// loses sight of what they're buying while filling in the form beneath it.
function OrderItemsPanel({
  cart, subtotal, discountTotal, codeDiscountAmount, appliedDiscount, shippingCost, addressEntered,
  grandTotal, discountCode, setDiscountCode, discountMessage, setDiscountMessage,
  clearDiscount, handleApplyDiscount,
}) {
  return (
    <div style={reviewCard}>
      <div>
        {cart.map((item) => (
          <div key={item.id} style={summaryItem}>
            <div style={summaryImgWrap}>
              <ProductVisual id={item.id} images={item.images} alt={item.name} width={48} staticImage />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14 }}>{item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ''}</div>
              <div style={{ fontSize: 12, color: T.soft, marginTop: 2 }}>{item.size}</div>
            </div>
            <div style={{ fontSize: 14 }}>${(item.price * item.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 6 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            placeholder="Discount code"
            value={discountCode}
            onChange={(e) => {
              setDiscountCode(e.target.value);
              if (appliedDiscount) clearDiscount();
              setDiscountMessage('');
            }}
            // Enter must apply the code, not fall through to native form submit.
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              handleApplyDiscount();
            }}
            style={{ ...bigInput, height: 46, flex: 1 }}
          />
          <button type="button" style={{ ...smallOutlineButton, height: 46 }} onClick={handleApplyDiscount}>Apply</button>
        </div>
        {discountMessage && (
          <p style={{ fontSize: 12, color: appliedDiscount ? T.ink : '#a13d2b', marginTop: 8 }}>{discountMessage}</p>
        )}
      </div>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.line}` }}>
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
        <div style={summaryRow}>
          <span style={{ color: T.soft }}>Shipping</span>
          <span>{!addressEntered ? 'Enter address' : (shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`)}</span>
        </div>
        <div style={{ ...summaryRow, borderTop: `1px solid ${T.line}`, paddingTop: 12, marginTop: 4 }}>
          <span style={{ fontFamily: T.sans, fontSize: 17, fontWeight: 700 }}>Total</span>
          <span style={{ fontFamily: T.sans, fontSize: 20, fontWeight: 700 }}>${grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// Static list, both shown at once — this sits under the order summary
// sidebar, which is desktop-only (CSS hides the whole sidebar on mobile),
// so no separate visibility handling is needed here.
function FeaturedReviews({ reviews }) {
  return (
    <div style={featuredReviewsWrap}>
      <p style={fieldGroupLabel}>What customers are saying</p>
      {reviews.map((r) => (
        <div key={r.author} style={featuredReviewCard}>
          <div style={{ color: T.ink, fontSize: 13, letterSpacing: '0.05em' }}>
            {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
          </div>
          <p style={{ fontSize: 13, color: T.ink, lineHeight: 1.6, margin: '8px 0 0' }}>&ldquo;{r.text}&rdquo;</p>
          <div style={{ fontSize: 12, color: T.soft, marginTop: 8 }}>{r.author}</div>
        </div>
      ))}
    </div>
  );
}

// Mobile-only (visibility handled by the .mobile-reviews-carousel CSS class
// on its wrapper) — cycles one review at a time rather than listing both,
// since there isn't room to show them side by side under a form button.
function ReviewsCarousel({ reviews }) {
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    if (reviews.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % reviews.length), 5000);
    return () => clearInterval(id);
  }, [reviews.length]);
  const r = reviews[index];
  return (
    <div>
      <p style={{ ...fieldGroupLabel, textAlign: 'center' }}>What customers are saying</p>
      <div style={featuredReviewCard}>
        <div style={{ color: T.ink, fontSize: 13, letterSpacing: '0.05em' }}>
          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
        </div>
        <p style={{ fontSize: 13, color: T.ink, lineHeight: 1.6, margin: '8px 0 0' }}>&ldquo;{r.text}&rdquo;</p>
        <div style={{ fontSize: 12, color: T.soft, marginTop: 8 }}>{r.author}</div>
      </div>
      {reviews.length > 1 && (
        <div style={carouselDots}>
          {reviews.map((rev, i) => (
            <span key={rev.author} style={{ ...carouselDot, background: i === index ? T.ink : T.line }} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, total, hydrated, clear, appliedDiscount, applyDiscount, clearDiscount, codeDiscountAmount, discountedTotal } = useCart();

  // Loaded once at mount — see lib/checkoutProgress.js. Seeds the step +
  // contact/shipping state below so a refresh mid-checkout resumes instead
  // of starting over.
  const [savedProgress] = React.useState(loadCheckoutProgress);

  // Contact + delivery
  const [email, setEmail] = React.useState(savedProgress?.email ?? '');
  const [newsletter, setNewsletter] = React.useState(savedProgress?.newsletter ?? true);
  const [shipping, setShipping] = React.useState(savedProgress?.shipping ?? EMPTY_ADDRESS);

  // 2-step flow (Shipping -> Payment) — Step 1's submit and Step 2's Back
  // button are the only ways to move between them now that the old visible
  // step indicator (which also let a shopper jump back by clicking a
  // completed step's label) is gone.
  const [step, setStep] = React.useState(savedProgress?.step ?? 1);

  // Reported to the live-view heartbeat in pages/_app.jsx (via
  // lib/checkoutStage.js) so admin can see which step visitors are stuck
  // on, not just that they're "at checkout" generically. Cleared on
  // unmount so a visitor who navigates away doesn't linger as mid-checkout
  // until their next heartbeat happens to overwrite it.
  React.useEffect(() => {
    setCheckoutStep(step);
    return () => setCheckoutStep(null);
  }, [step]);

  // Payment — Square's Card element renders its own number/expiry/CVC/
  // postal-code fields into #square-card-container; the returned Card
  // instance lives in squareCardRef for tokenize() at submit time.
  // squareReady disables submit until it's actually mounted.
  const squareCardRef = React.useRef(null);
  const [squareReady, setSquareReady] = React.useState(false);
  const [squareError, setSquareError] = React.useState('');

  // Apple Pay / Google Pay / Afterpay tokenize on click against the method
  // instance Square attaches into each container below.
  const appleMethodRef = React.useRef(null);
  const googleMethodRef = React.useRef(null);
  const afterpayMethodRef = React.useRef(null);
  const [appleAvailable, setAppleAvailable] = React.useState(false);
  const [googleAvailable, setGoogleAvailable] = React.useState(false);
  const [afterpayAvailable, setAfterpayAvailable] = React.useState(false);
  // Surfaces the real reason a wallet failed to initialize directly on the
  // page — createApplePayButton/createGooglePayButton/createAfterpayButton
  // otherwise only console.error() it and quietly hide the button, which
  // leaves no way to tell "not supported here" apart from "actually
  // misconfigured" without opening devtools. TEMPORARY debugging aid.
  const [walletDebugError, setWalletDebugError] = React.useState('');

  // Express checkout — the same three wallets, but shown at the top of
  // Step 1 (before the shopper has typed anything) and built with
  // requestContact so each wallet's own sheet collects name/email/address
  // itself. Separate refs/state/containers from the Step 2 set above since
  // both can be mounted at once (Step 1's express buttons don't unmount
  // until the shopper actually leaves Step 1) and Square's own method
  // instances can't be shared between two differently-configured payment
  // requests.
  const expressAppleMethodRef = React.useRef(null);
  const expressGoogleMethodRef = React.useRef(null);
  const expressAfterpayMethodRef = React.useRef(null);
  const [expressAppleAvailable, setExpressAppleAvailable] = React.useState(false);
  const [expressGoogleAvailable, setExpressGoogleAvailable] = React.useState(false);
  const [expressAfterpayAvailable, setExpressAfterpayAvailable] = React.useState(false);

  // Discount + UI state
  const [discountCode, setDiscountCode] = React.useState(savedProgress?.discountCode ?? '');
  const [discountMessage, setDiscountMessage] = React.useState('');
  // Mobile-only order summary accordion — collapsed by default so a
  // shopper isn't scrolling past the full itemized breakdown before
  // reaching the form; the desktop sticky sidebar (aside below) always
  // shows it in full regardless of this.
  const [orderSummaryOpen, setOrderSummaryOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const errorRef = React.useRef(null);
  const formTopRef = React.useRef(null);

  // Mirrors step/email/newsletter/shipping/discount to sessionStorage on
  // every change so a mid-checkout refresh resumes on the same step with
  // the form already filled in, rather than bouncing back to a blank
  // Step 1. Cleared on successful order.
  React.useEffect(() => {
    saveCheckoutProgress({ step, email, newsletter, shipping, discountCode });
  }, [step, email, newsletter, shipping, discountCode]);

  // Historical funnel counter (admin's funnel card) — reaching Step 2 for
  // the first time, deduped server-side per session so jumping back and
  // forth doesn't inflate this. Step 1 is already covered by the existing
  // checkout_start ping below.
  React.useEffect(() => {
    if (step !== 2) return;
    fetch('/api/track/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'checkout_payment', sessionId: getSessionId() }),
      keepalive: true,
    }).catch(() => {});
  }, [step]);

  // The error message renders once, near the submit button at the bottom
  // of whichever step is active — scrolled into view on every change so it
  // never goes unnoticed if the shopper was scrolled elsewhere.
  React.useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [error]);

  // Every step *change* scrolls back to the top of the form — otherwise
  // advancing from a long Step 1 (address fully filled in, scrolled down)
  // to a short Step 2 can leave the shopper staring at empty space below
  // the fold with no visible change. Skipped on the very first render
  // (mountedRef still false) — scrollIntoView'ing formTopRef there was
  // scrolling the freshly-loaded page down past the header, cutting the
  // logo off instead of landing at the very top like a fresh page load
  // should.
  const mountedRef = React.useRef(false);
  React.useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  React.useEffect(() => {
    if (appliedDiscount) setDiscountCode(appliedDiscount.code);
  }, [appliedDiscount]);

  React.useEffect(() => {
    if (hydrated && cart.length === 0) router.replace('/shop');
  }, [hydrated, cart.length, router]);

  React.useEffect(() => {
    if (!hydrated || cart.length === 0) return;
    const eventId = generateEventId();
    fbTrack('InitiateCheckout', {
      content_ids: cart.map((i) => i.id),
      contents: cart.map((i) => ({ id: i.id, quantity: i.quantity })),
      value: total,
      currency: 'USD',
      num_items: cart.reduce((s, i) => s + i.quantity, 0),
    }, eventId);
    fetch('/api/track/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'checkout_start',
        eventId,
        value: total,
        contentIds: cart.map((i) => i.id),
        contents: cart.map((i) => ({ id: i.id, quantity: i.quantity })),
        url: window.location.href,
        sessionId: getSessionId(),
        ...getIdentity(),
      }),
      keepalive: true,
    }).catch(() => {});
    // Fire once per checkout page load, not on every cart mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Mounts Square's own card-entry form into #square-card-container —
  // gated on step === 2 since that container isn't in the DOM at all until
  // Step 2 renders (a step's inputs are removed entirely, not just hidden),
  // and Square's attach() needs the element to already exist. Re-mounts
  // fresh every time Step 2 is (re-)entered — going back to Step 1 unmounts
  // the container along with the rest of that step's JSX, which would
  // otherwise leave the old Card instance attached to a now-detached node.
  React.useEffect(() => {
    if (step !== 2) return;
    let cancelled = false;
    (async () => {
      try {
        const card = await createSquareCard('square-card-container');
        if (cancelled) {
          await card.destroy();
          return;
        }
        squareCardRef.current = card;
        setSquareReady(true);
      } catch (err) {
        console.error('Square card setup failed:', err);
        setSquareError('Payment form failed to load — please refresh and try again.');
      }
    })();
    return () => {
      cancelled = true;
      if (squareCardRef.current) {
        squareCardRef.current.destroy().catch(() => {});
        squareCardRef.current = null;
      }
      setSquareReady(false);
    };
  }, [step]);

  const addressEntered = Boolean(shipping.address.trim() && shipping.city.trim() && shipping.state && shipping.zip.trim());

  // Mounts Apple Pay / Google Pay / Afterpay as soon as the Square SDK is
  // ready (which only happens on Step 2 — shipping is always already
  // filled in by then). Each pre-declares a total when created (whatever
  // grandTotal is at that moment); known limitation: that displayed total
  // doesn't live-update as discounts change afterward (recreating the
  // buttons on every total change would flicker them) — the amount actually
  // charged is always read fresh from latestRef at tokenize time, so this
  // is a display lag, not a billing bug. Afterpay additionally has its own
  // order-amount eligibility range — outside it, createAfterpayButton fails
  // the same way an unsupported browser/device does for Apple/Google Pay,
  // and the button just doesn't appear.
  React.useEffect(() => {
    if (!squareReady) return;
    let cancelled = false;
    const cleanupFns = [];

    (async () => {
      const amount = latestRef.current.grandTotal;
      const onWalletError = (label) => (err) => {
        if (cancelled) return;
        setWalletDebugError((prev) => `${prev ? `${prev}\n` : ''}${label}: ${err?.message || err}`);
      };

      const apple = await createApplePayButton(amount, onWalletError('Apple Pay'));
      if (!cancelled) setAppleAvailable(Boolean(apple));
      if (cancelled) {
        // nothing to destroy — Apple Pay has no attach()'d element
      } else if (apple) {
        appleMethodRef.current = apple;
      }

      const google = await createGooglePayButton(amount, 'google-pay-button', onWalletError('Google Pay'));
      if (cancelled) {
        google?.destroy?.().catch(() => {});
      } else if (google) {
        googleMethodRef.current = google;
        setGoogleAvailable(true);
        const btn = document.getElementById('google-pay-button');
        const onClick = (event) => { event.preventDefault(); handleWalletPay(googleMethodRef, 'Google Pay'); };
        btn?.addEventListener('click', onClick);
        cleanupFns.push(() => btn?.removeEventListener('click', onClick));
      }

      const afterpay = await createAfterpayButton(amount, 'afterpay-button', onWalletError('Afterpay'));
      if (cancelled) {
        afterpay?.destroy?.().catch(() => {});
      } else if (afterpay) {
        afterpayMethodRef.current = afterpay;
        setAfterpayAvailable(true);
        const btn = document.getElementById('afterpay-button');
        const onClick = (event) => { event.preventDefault(); handleWalletPay(afterpayMethodRef, 'Afterpay'); };
        btn?.addEventListener('click', onClick);
        cleanupFns.push(() => btn?.removeEventListener('click', onClick));
      }
    })();

    return () => {
      cancelled = true;
      cleanupFns.forEach((fn) => fn());
      googleMethodRef.current?.destroy?.().catch(() => {});
      afterpayMethodRef.current?.destroy?.().catch(() => {});
      appleMethodRef.current = null;
      googleMethodRef.current = null;
      afterpayMethodRef.current = null;
      setAppleAvailable(false);
      setGoogleAvailable(false);
      setAfterpayAvailable(false);
    };
    // handleWalletPay only ever reads fresh state via latestRef and stable
    // setters — safe to omit here so this doesn't re-attach on every
    // keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [squareReady]);

  // Express checkout at the top of Step 1 — mounted independently of the
  // Step 2 wallets/card above, since Step 1 doesn't need Square's card
  // element and (unlike Step 2) has no address on file yet: requestContact
  // has each wallet's own sheet collect it instead. Gated on step === 1 the
  // same way Step 2's card is gated on step === 2 — the containers aren't
  // in the DOM at all while the other step is showing.
  React.useEffect(() => {
    if (step !== 1) return;
    let cancelled = false;
    const cleanupFns = [];

    (async () => {
      const amount = latestRef.current.grandTotal;
      const onWalletError = (label) => (err) => {
        if (cancelled) return;
        setWalletDebugError((prev) => `${prev ? `${prev}\n` : ''}${label} (express): ${err?.message || err}`);
      };

      const apple = await createApplePayButton(amount, onWalletError('Apple Pay'), { requestContact: true });
      if (!cancelled) {
        setExpressAppleAvailable(Boolean(apple));
        if (apple) expressAppleMethodRef.current = apple;
      }

      const google = await createGooglePayButton(amount, 'express-google-pay-button', onWalletError('Google Pay'), { requestContact: true });
      if (cancelled) {
        google?.destroy?.().catch(() => {});
      } else if (google) {
        expressGoogleMethodRef.current = google;
        setExpressGoogleAvailable(true);
        const btn = document.getElementById('express-google-pay-button');
        const onClick = (event) => { event.preventDefault(); handleExpressWalletPay(expressGoogleMethodRef, 'Google Pay'); };
        btn?.addEventListener('click', onClick);
        cleanupFns.push(() => btn?.removeEventListener('click', onClick));
      }

      const afterpay = await createAfterpayButton(amount, 'express-afterpay-button', onWalletError('Afterpay'), { requestContact: true });
      if (cancelled) {
        afterpay?.destroy?.().catch(() => {});
      } else if (afterpay) {
        expressAfterpayMethodRef.current = afterpay;
        setExpressAfterpayAvailable(true);
        const btn = document.getElementById('express-afterpay-button');
        const onClick = (event) => { event.preventDefault(); handleExpressWalletPay(expressAfterpayMethodRef, 'Afterpay'); };
        btn?.addEventListener('click', onClick);
        cleanupFns.push(() => btn?.removeEventListener('click', onClick));
      }
    })();

    return () => {
      cancelled = true;
      cleanupFns.forEach((fn) => fn());
      expressGoogleMethodRef.current?.destroy?.().catch(() => {});
      expressAfterpayMethodRef.current?.destroy?.().catch(() => {});
      expressAppleMethodRef.current = null;
      expressGoogleMethodRef.current = null;
      expressAfterpayMethodRef.current = null;
      setExpressAppleAvailable(false);
      setExpressGoogleAvailable(false);
      setExpressAfterpayAvailable(false);
    };
    // handleExpressWalletPay only ever reads fresh state via latestRef and
    // stable setters — safe to omit here so this doesn't re-attach on
    // every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const shippingCost = !addressEntered || cart.length === 0 ? 0 : (total >= 50 ? 0 : 5);
  const subtotal = cart.reduce((sum, item) => sum + (item.originalPrice ?? item.price) * item.quantity, 0);
  const discountTotal = subtotal - total;
  const grandTotal = discountedTotal + shippingCost;

  // Apple Pay/Google Pay's button click handler is attached once (see the
  // wallet mount effect above) and can fire long after that — reading
  // email/shipping/cart/grandTotal through this ref instead of closing
  // over them directly means it always sees what's currently on the page,
  // not what was there at mount.
  const latestRef = React.useRef({});
  latestRef.current = { email, shipping, cart, grandTotal };

  // Fires once the shopper's attention leaves the email field — a good
  // enough proxy for "entered their email" without hammering the KV store
  // on every keystroke. If they never complete the order, this is the only
  // record of them; lib/orderFulfillment.js upgrades the same entry to
  // 'purchased' if they do.
  const handleEmailBlur = () => {
    if (!email.trim()) return;
    rememberIdentity({ email, phone: shipping.phone });
    refreshPixelIdentity(process.env.NEXT_PUBLIC_META_PIXEL_ID);
    fetch('/api/checkout-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        cart: cart.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity })),
        source: 'checkout',
        sessionId: getSessionId(),
        url: window.location.href,
      }),
      keepalive: true,
    }).catch(() => {});
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountMessage('Checking…');
    const data = await applyDiscount(discountCode);
    if (data.valid) {
      setDiscountMessage(`Code "${data.code}" applied.`);
    } else if (data.error) {
      setDiscountMessage('Could not check that code — please try again.');
    } else {
      setDiscountMessage('That code isn’t valid.');
    }
  };

  const goToStep = (n) => {
    setError('');
    setStep(n);
  };

  // Shared by the card submit handler below and the Apple Pay/Google Pay/
  // Afterpay click handlers — every Square payment method resolves to the
  // same single-use token shape, so charging and fulfilling it is identical
  // regardless of which method produced it. Reads email/shipping/cart/
  // grandTotal from latestRef rather than closed-over state since the
  // wallet path can fire long after the render that created its handler.
  const completeSquareOrder = async (token, paymentMethodLabel, overrides = {}) => {
    const { email, shipping, cart, grandTotal } = { ...latestRef.current, ...overrides };
    const purchaseEventId = generateEventId();

    const res = await fetch('/api/square-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        amount: grandTotal,
        items: cart,
        email,
        shipping,
        eventId: purchaseEventId,
        url: window.location.href,
        paymentMethod: paymentMethodLabel,
        attribution: getStoredAttribution(),
        sessionId: getSessionId(),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Payment failed');

    sessionStorage.setItem('anese-purchase', JSON.stringify({
      eventId: purchaseEventId,
      orderId: data.id,
      amount: grandTotal,
      contentIds: cart.map((i) => i.id),
      contents: cart.map((i) => ({ id: i.id, quantity: i.quantity, item_price: i.price })),
    }));
    clearCheckoutProgress();
    await router.push('/success');
    clear();
  };

  // Apple Pay / Google Pay / Afterpay only render their own button — there's
  // no "Place order" click to hang the usual form-level required-field
  // validation off of, so this checks email/shipping directly before
  // approving (belt-and-suspenders here since Step 2 can't be reached
  // without Step 1's own native validation having already passed).
  const handleWalletPay = async (methodRef, label) => {
    setError('');
    const { email, shipping } = latestRef.current;
    const addrOk = Boolean(shipping.address.trim() && shipping.city.trim() && shipping.state && shipping.zip.trim());
    if (!email.trim() || !addrOk) {
      setError(`Enter your email and shipping address before paying with ${label}.`);
      return;
    }
    if (!methodRef.current) return;
    setSubmitting(true);
    try {
      const token = await tokenizeWallet(methodRef.current);
      await completeSquareOrder(token, `Square (${label})`);
    } catch (err) {
      if (!err.cancelled) setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Express checkout buttons at the top of Step 1 collect the shipping
  // contact from the wallet's own sheet (requestContact on the mount
  // effect above) rather than reading the Step 1 form, which isn't filled
  // in yet when these are used. tokenizeWalletWithContact
  // (lib/squareClient.js) hands back both the token and whatever contact
  // the sheet collected; its own extractWalletContact returns null if the
  // essentials (street, city, postal code) aren't all present, so a charge
  // is never attempted with nowhere to ship it — the shopper falls back to
  // the form below instead.
  const handleExpressWalletPay = async (methodRef, label) => {
    setError('');
    if (!methodRef.current) return;
    setSubmitting(true);
    try {
      const { token, contact } = await tokenizeWalletWithContact(methodRef.current);
      if (!contact) {
        setError(`${label} didn’t return a shipping address. Please continue with the form below.`);
        return;
      }
      await completeSquareOrder(token, `Square (${label})`, { email: contact.email, shipping: contact });
    } catch (err) {
      if (!err.cancelled) setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Each step is real native <form> validation — required/type="email" on
  // whichever fields are actually mounted for the current step (a step
  // that isn't showing has its inputs removed from the DOM entirely, not
  // just hidden, so the browser only ever validates what's on screen).
  const handleStepSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      goToStep(2);
      return;
    }

    // Step 2 — charge via Square's Card element.
    if (!squareReady || !squareCardRef.current) {
      setError('Payment form is still loading — please wait a moment and try again.');
      return;
    }
    setSubmitting(true);
    try {
      // verificationDetails deliberately omitted entirely (not just
      // billingContact): passing ANY verificationDetails object — even with
      // billingContact removed — still routes tokenize() through Square's
      // separate buyer-verification call, which has previously rejected this
      // account's location even though that same location processes real
      // charges fine. The wallet buttons above call tokenize() with no
      // arguments and always succeed — mirroring that here avoids the
      // broken verification call.
      const token = await tokenizeSquareCard(squareCardRef.current);
      await completeSquareOrder(token, 'Square');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated || cart.length === 0) return null;

  return (
    <div>
      <header className="desktop-topbar" style={topbar}>
        <div style={{ ...S.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 112 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/images/anese_logo_transparent.png" alt="anese" style={{ height: 84, width: 'auto' }} />
          </Link>
        </div>
      </header>

      {/* Mobile-only compact header — centered logo, no total (the same
          totals already show inline via OrderItemsPanel at the top of the
          form column below, on every breakpoint). */}
      <header className="mobile-topbar" style={mobileTopbar}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/images/anese_logo_transparent.png" alt="anese" style={{ height: 52, width: 'auto' }} />
        </Link>
      </header>

      <div className="checkout-grid" style={checkoutGrid}>
        <div className="form-col" style={formCol}>
          <div ref={formTopRef} />
          {/* TEMPORARY — surfaces the real Square SDK error for any wallet
              that failed to initialize (see the onWalletError wiring in the
              two wallet-mount effects above), so it's visible here instead
              of only in devtools. Remove once wallet availability is
              understood/resolved. */}
          {walletDebugError && (
            <pre style={{
              whiteSpace: 'pre-wrap', fontSize: 12, color: '#a13d2b', background: '#fdf1ee',
              border: '1px solid #eab6a8', borderRadius: 6, padding: '10px 12px', marginBottom: 16,
            }}
            >
              {walletDebugError}
            </pre>
          )}
          {/* Desktop already has the same info in the sticky sidebar aside
              below — this inline panel is mobile-only there (that sidebar
              is hidden under 861px), so keeping it here too on desktop
              would just duplicate it above the shipping form. Collapsed
              into an accordion by default on mobile so the itemized
              breakdown doesn't push the actual form below the fold. */}
          <div className="mobile-order-summary">
            <button
              type="button"
              onClick={() => setOrderSummaryOpen((o) => !o)}
              style={orderSummaryToggle}
              aria-expanded={orderSummaryOpen}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{orderSummaryOpen ? 'Hide' : 'Show'} order summary</span>
                <span style={{ fontSize: 10, transform: orderSummaryOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
              </span>
              <span style={{ fontFamily: T.sans, fontSize: 16, fontWeight: 700 }}>${grandTotal.toFixed(2)}</span>
            </button>
            {orderSummaryOpen && (
              <div style={{ marginTop: 12 }}>
                <OrderItemsPanel
                  cart={cart}
                  subtotal={subtotal}
                  discountTotal={discountTotal}
                  codeDiscountAmount={codeDiscountAmount}
                  appliedDiscount={appliedDiscount}
                  shippingCost={shippingCost}
                  addressEntered={addressEntered}
                  grandTotal={grandTotal}
                  discountCode={discountCode}
                  setDiscountCode={setDiscountCode}
                  discountMessage={discountMessage}
                  setDiscountMessage={setDiscountMessage}
                  clearDiscount={clearDiscount}
                  handleApplyDiscount={handleApplyDiscount}
                />
              </div>
            )}
          </div>

          <form
            onSubmit={handleStepSubmit}
            onKeyDown={(e) => {
              if (step === 2 && e.key === 'Enter' && e.target.type !== 'submit') e.preventDefault();
            }}
          >
            {step === 1 && (
              <section style={{ marginTop: 28 }}>
                {/* Express checkout — Apple Pay / Google Pay / Afterpay up
                    front, before the shopper has typed anything. Unlike the
                    Step 2 wallet buttons below (which reuse the address
                    already entered in Step 1), these are built with
                    requestContact so the wallet's own sheet collects name,
                    email, and shipping address itself — see
                    handleExpressWalletPay. Only rendered once at least one
                    wallet is confirmed available, same tri-state pattern as
                    Step 2. */}
                <div style={{ display: (expressAppleAvailable || expressGoogleAvailable || expressAfterpayAvailable) ? 'block' : 'none' }}>
                  <p style={{ ...fieldGroupLabel, textAlign: 'center' }}>Express checkout</p>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: expressAppleAvailable ? 'block' : 'none' }}>
                      <button
                        type="button"
                        className="apple-pay-button"
                        aria-label="Apple Pay"
                        onClick={() => handleExpressWalletPay(expressAppleMethodRef, 'Apple Pay')}
                      />
                    </div>
                    <div style={{ display: expressGoogleAvailable ? 'block' : 'none' }}>
                      <div id="express-google-pay-button" style={walletButtonContainer} />
                    </div>
                    <div style={{ display: expressAfterpayAvailable ? 'block' : 'none' }}>
                      <div id="express-afterpay-button" style={walletButtonContainer} />
                    </div>
                  </div>
                  <div style={orDivider}>
                    <span style={orDividerLine} />
                    <span style={orDividerText}>or</span>
                    <span style={orDividerLine} />
                  </div>
                </div>

                <div style={{ marginTop: 30 }}>
                  <p style={fieldGroupLabel}>Shipping address</p>
                  <AddressFields value={shipping} onChange={setShipping} idPrefix="ship" inputStyle={bigInput} simplified />
                </div>

                {addressEntered && (
                  <div style={{ marginTop: 26 }}>
                    <p style={fieldGroupLabel}>Shipping method</p>
                    <div style={shipMethod}>
                      <div>
                        <div style={{ fontWeight: 700 }}>Standard Shipping</div>
                        <div style={{ fontSize: 12, color: T.soft, marginTop: 2 }}>3–5 business days after order placed</div>
                      </div>
                      <span style={{ fontWeight: 700 }}>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 26 }}>
                  <p style={fieldGroupLabel}>Country</p>
                  <select value="United States" readOnly style={{ ...bigInput, color: T.soft }}>
                    <option>United States</option>
                  </select>
                </div>

                <h1 style={{ ...stepTitle, marginTop: 30 }}>Contact</h1>

                <div style={{ marginTop: 18 }}>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    style={bigInput}
                    autoComplete="email"
                    required
                  />
                  <label style={checkboxLabel}>
                    <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
                    Email me with news and offers
                  </label>
                </div>

                {error && <p ref={errorRef} style={errorText}>{error}</p>}

                <button type="submit" style={{ ...bigButton, marginTop: 24 }}>
                  Continue to final step
                </button>

                <div className="mobile-reviews-carousel">
                  <ReviewsCarousel reviews={FEATURED_REVIEWS} />
                </div>
              </section>
            )}

            {step === 2 && (
              <section style={{ marginTop: 28 }}>
                <h1 style={stepTitle}>How do you want to pay?</h1>
                <p style={{ fontSize: 13, color: T.soft, marginTop: 10 }}>All transactions are secure and encrypted.</p>

                {/* Google Pay's container always exists in the DOM (hidden
                    via display:none, not conditional rendering) since
                    Square's attach() needs to find it by id before we know
                    whether that wallet is actually available on this
                    browser/device. Apple Pay has no attach()/container at
                    all — it's our own native <button> below, styled with
                    Safari's -apple-pay-button appearance. */}
                <div style={{ display: (appleAvailable || googleAvailable) ? 'block' : 'none', marginTop: 20 }}>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: appleAvailable ? 'block' : 'none' }}>
                      <button
                        type="button"
                        className="apple-pay-button"
                        aria-label="Apple Pay"
                        onClick={() => handleWalletPay(appleMethodRef, 'Apple Pay')}
                      />
                    </div>
                    <div style={{ display: googleAvailable ? 'block' : 'none' }}>
                      <div id="google-pay-button" style={walletButtonContainer} />
                    </div>
                  </div>
                </div>

                {/* Afterpay sits right above the card box — same
                    email/shipping validation via handleWalletPay, just
                    presented as an alternative to the card form
                    specifically. Only one "OR" divider total, after
                    Afterpay and before Credit card. */}
                <div style={{ display: afterpayAvailable ? 'block' : 'none', marginTop: afterpayAvailable && !(appleAvailable || googleAvailable) ? 20 : 10 }}>
                  <div id="afterpay-button" style={walletButtonContainer} />
                  <div style={orDivider}>
                    <span style={orDividerLine} />
                    <span style={orDividerText}>OR</span>
                    <span style={orDividerLine} />
                  </div>
                </div>

                <div style={{ ...paymentList, marginTop: 20 }}>
                  <div style={accordionRow}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>Credit or Debit Card</span>
                  </div>
                  <div style={accordionBody}>
                    {/* Square's Web Payments SDK renders its own card
                        number/expiry/CVC/postal fields into this container,
                        including its own network-brand logo as you type —
                        see the mount effect above. Nothing here reads or
                        holds the raw card data. */}
                    <div id="square-card-container" style={squareCardContainer} />
                    {!squareReady && !squareError && (
                      <p style={{ fontSize: 12, color: T.soft, marginTop: 8 }}>Loading payment form…</p>
                    )}
                    {squareError && (
                      <p style={{ fontSize: 12, color: '#a13d2b', marginTop: 8 }}>{squareError}</p>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <p style={fieldGroupLabel}>Billing address</p>
                  <div style={billingRecap}>
                    <CheckIcon style={{ color: T.ink, flexShrink: 0, marginTop: 3 }} />
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Same as shipping address</div>
                      <div style={{ color: T.soft, fontSize: 13, lineHeight: 1.6 }}>
                        {shipping.name}<br />
                        {shipping.address}{shipping.apt ? `, ${shipping.apt}` : ''}<br />
                        {shipping.city}, {shipping.state} {shipping.zip}
                      </div>
                    </div>
                  </div>
                </div>

                {error && <p ref={errorRef} style={errorText}>{error}</p>}

                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button type="button" onClick={() => goToStep(1)} style={bigButtonSecondary} disabled={submitting}>
                    Back
                  </button>
                  <button type="submit" disabled={submitting || !squareReady} style={{ ...bigButton, flex: 1, opacity: submitting || !squareReady ? 0.6 : 1 }}>
                    {submitting ? 'Processing…' : `Place order — $${grandTotal.toFixed(2)}`}
                  </button>
                </div>

                <div className="mobile-reviews-carousel">
                  <ReviewsCarousel reviews={FEATURED_REVIEWS} />
                </div>

                <div style={secureNote}>
                  <LockIcon />
                  <span>256-bit SSL encrypted &middot; your card details never touch our servers</span>
                </div>
                <p style={{ fontSize: 11, color: T.soft, textAlign: 'center', marginTop: 8 }}>
                  Payments securely processed by Square
                </p>
              </section>
            )}
          </form>
        </div>

        <aside className="order-summary" style={summaryCol}>
          <div style={{ maxHeight: 340, overflowY: 'auto', marginBottom: 20 }}>
            {cart.map((item) => (
              <div key={item.id} style={summaryItem}>
                <div style={summaryImgWrap}>
                  <ProductVisual id={item.id} images={item.images} alt={item.name} width={48} staticImage />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14 }}>{item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ''}</div>
                  <div style={{ fontSize: 12, color: T.soft, marginTop: 2 }}>{item.size}</div>
                </div>
                <div style={{ fontSize: 14 }}>${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>

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
          <div style={summaryRow}>
            <span style={{ color: T.soft }}>Shipping</span>
            <span>{!addressEntered ? 'Enter address' : (shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`)}</span>
          </div>
          <div style={{ ...summaryRow, borderTop: `1px solid ${T.line}`, paddingTop: 16, marginTop: 6 }}>
            <span style={{ fontFamily: T.sans, fontSize: 18 }}>Total</span>
            <span style={{ fontFamily: T.sans, fontSize: 24 }}>${grandTotal.toFixed(2)}</span>
          </div>

          <FeaturedReviews reviews={FEATURED_REVIEWS} />
        </aside>
      </div>

      <div style={reassuranceWrap}>
        <div className="reassurance-grid" style={reassuranceGrid}>
          {[
            [ShipIcon, 'Free shipping over $50', 'Ships within 1 business day.'],
            [ReturnIcon, '30-day returns', 'Not the right fit? Send it back for a full refund.'],
            [LockIcon, 'Secure checkout', 'Payments encrypted and processed by Square.'],
            [LeafIcon, 'Vegan & cruelty-free', 'Every formula, always.'],
          ].map(([Icon, title, copy]) => (
            <div key={title} style={reassuranceItem}>
              <Icon style={{ color: T.ink, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 700, color: T.ink }}>{title}</div>
                <div style={{ fontSize: 12, color: T.soft, marginTop: 2 }}>{copy}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={legalLinks}>
        <Link href="/terms">Terms & Conditions</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/returns">Return Policy</Link>
        <Link href="/shipping">Shipping Policy</Link>
      </div>

      <style jsx>{`
        :global(.row-2) { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .mobile-topbar { display: none; }
        .checkout-grid { grid-template-columns: 1.35fr 1fr; }
        .form-col { padding: 32px 20px; }
        .reassurance-grid { grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 860px) {
          .reassurance-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .reassurance-grid { grid-template-columns: 1fr; }
        }
        .order-summary { display: block; }
        @media (min-width: 861px) {
          .order-summary {
            position: sticky;
            top: 24px;
            align-self: start;
            max-height: calc(100vh - 48px);
            overflow-y: auto;
          }
        }
        .mobile-order-summary { display: block; }
        .mobile-reviews-carousel { display: none; }
        @media (max-width: 860px) {
          .checkout-grid { grid-template-columns: 1fr; }
          .desktop-topbar { display: none; }
          .mobile-topbar { display: flex; }
          .order-summary { display: none; }
          .form-col { padding: 32px 25px; }
          .mobile-reviews-carousel { display: block; margin-top: 20px; }
        }
        @media (min-width: 861px) {
          .mobile-order-summary { display: none; }
        }
        .apple-pay-button {
          display: inline-block;
          width: 100%;
          min-height: 44px;
          border-radius: 6px;
          -webkit-appearance: -apple-pay-button;
          -apple-pay-button-type: buy;
          -apple-pay-button-style: black;
        }
        @supports not (-webkit-appearance: -apple-pay-button) {
          .apple-pay-button { display: none; }
        }
      `}</style>
    </div>
  );
}

const topbar = { borderBottom: `1px solid ${T.line}`, textAlign: 'center' };
// display is deliberately NOT set here — inline styles always beat CSS
// rules, so if 'none' were set inline here, the <style jsx> media query
// below meant to show this at mobile widths could never override it.
const mobileTopbar = {
  alignItems: 'center', justifyContent: 'center',
  padding: '14px 20px', borderBottom: `1px solid ${T.line}`, background: T.white,
};
const checkoutGrid = { display: 'grid', maxWidth: 1280, margin: '0 auto', columnGap: 40, rowGap: 20 };
const formCol = { borderRight: `1px solid ${T.line}` };
const summaryCol = { padding: '32px 40px', background: T.white };
const secureNote = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, fontSize: 12, color: T.soft };
const stepTitle = { fontFamily: T.sans, fontWeight: 700, fontSize: 22, margin: 0, color: T.ink, lineHeight: 1.25 };
const fieldGroupLabel = {
  fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: T.soft, fontWeight: 700, marginBottom: 10,
};
// Bigger than the old `input` (58px vs 44px tall, 14px radius vs 4px) —
// large touch-friendly fields, easy to press on phone. fontSize stays 16px
// or higher — below that, iOS Safari auto-zooms the whole page in when a
// shopper taps into any of these fields.
const bigInput = {
  width: '100%', height: 58, padding: '0 18px', border: `1px solid ${T.line}`, background: T.white,
  fontFamily: T.sans, fontSize: 16, fontWeight: 400, color: T.ink, outline: 'none', boxSizing: 'border-box', borderRadius: 14,
};
const bigButton = {
  ...S.btnFill, width: '100%', height: 60, borderRadius: 14, justifyContent: 'center',
  fontSize: 15, letterSpacing: 'normal', textTransform: 'none', fontWeight: 700,
};
const bigButtonSecondary = {
  ...S.btnOutline, height: 60, borderRadius: 14, justifyContent: 'center', padding: '0 26px',
  fontSize: 15, letterSpacing: 'normal', textTransform: 'none', fontWeight: 700,
};
const smallOutlineButton = {
  ...S.btnOutline, height: 58, borderRadius: 14, justifyContent: 'center', padding: '0 22px',
  fontSize: 13, letterSpacing: 'normal', textTransform: 'none', fontWeight: 700,
};
const checkboxLabel = { display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, fontSize: 13, color: T.soft };
const paymentList = { border: `1.5px solid ${T.ink}`, borderRadius: 14, background: T.white, overflow: 'hidden' };
const accordionRow = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '18px 18px', borderBottom: `1px solid ${T.line}`, background: T.white,
};
const accordionBody = { padding: '16px 18px 20px', background: T.white };
const squareCardContainer = { minHeight: 48 };
const orDivider = { display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0 0' };
const orDividerLine = { flex: 1, height: 1, background: T.line };
const orDividerText = { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.soft };
const walletButtonContainer = { width: '100%', minHeight: 44 };
const billingRecap = {
  display: 'flex', gap: 12, padding: 16, border: `1.5px solid ${T.line}`, borderRadius: 14, background: T.white, fontSize: 14,
};
const reviewCard = { padding: 16, border: `1.5px solid ${T.line}`, borderRadius: 14, background: T.white, fontSize: 14 };
const orderSummaryToggle = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '16px 18px', border: `1.5px solid ${T.line}`, borderRadius: 14, background: T.white,
  cursor: 'pointer', fontFamily: T.sans, fontSize: 13, color: T.ink,
};
const featuredReviewsWrap = { marginTop: 28, paddingTop: 24, borderTop: `1px solid ${T.line}` };
const featuredReviewCard = { padding: 16, border: `1.5px solid ${T.line}`, borderRadius: 14, background: T.paper, marginTop: 12 };
const carouselDots = { display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 };
const carouselDot = { width: 6, height: 6, borderRadius: '50%' };
const shipMethod = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px',
  border: `1.5px solid ${T.ink}`, borderRadius: 14, fontSize: 14,
};
const errorText = { color: '#a13d2b', fontSize: 13, marginTop: 16 };
const summaryItem = { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' };
const summaryImgWrap = { position: 'relative', width: 48, height: 48, flexShrink: 0, overflow: 'hidden', border: `1px solid ${T.line}`, background: T.white };
const summaryRow = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 };
const reassuranceWrap = { borderTop: `1px solid ${T.line}`, background: T.paper };
const reassuranceGrid = { maxWidth: 1280, margin: '0 auto', padding: '32px 40px', display: 'grid', gap: 24 };
const reassuranceItem = { display: 'flex', alignItems: 'flex-start', gap: 12 };
const legalLinks = {
  display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20,
  maxWidth: 1280, margin: '0 auto', padding: '24px 40px 36px',
  fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.soft,
  borderTop: `1px solid ${T.line}`,
};
