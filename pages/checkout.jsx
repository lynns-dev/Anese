import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProductVisual from '../components/ProductVisual';
import AddressFields from '../components/AddressFields';
import { useCart } from '../lib/useCart';
import {
  createSquareCard, tokenizeSquareCard,
  createApplePayButton, createGooglePayButton, createAfterpayButton, tokenizeWallet,
} from '../lib/squareClient';
import { fbTrack, generateEventId } from '../lib/fbPixel';
import { getStoredAttribution } from '../lib/attribution';
import { getSessionId } from '../lib/session';
import { loadCheckoutProgress, saveCheckoutProgress, clearCheckoutProgress } from '../lib/checkoutProgress';
import { T, S } from '../lib/theme';

// Live checkout — charges through Square. QuickBooks Payments is kept as a
// backup at pages/checkout-qb.jsx (a stable, unlinked URL) in case Square
// ever needs to be rotated out again — swap which file lives here the same
// way this page was moved into it. Keep the two pages' non-payment sections
// in sync by hand when either one changes.
//
// 2-step flow (Shipping -> Payment, merged from the old single long-scroll
// form) with a sticky order summary, Apple Pay/Google Pay/Afterpay via
// Square's Web Payments SDK, and a card element Square renders itself
// (lib/squareClient.js) — no raw card fields of our own. Step 1 collects
// contact + delivery address + shipping method + protection; Step 2 is
// payment only, with a compact read-only recap of Step 1 up top (and a
// "Change" link back) instead of repeating the summary line-by-line — one
// discount-code box total, not one per step. Each step's fields aren't
// mounted in the DOM at all while the other step is active, so native
// required-field validation on "Continue" only ever looks at what's
// actually visible, same technique used on checkout-qb.jsx's 3-step flow.

const EMPTY_ADDRESS = { firstName: '', lastName: '', address: '', apt: '', city: '', state: '', zip: '', phone: '' };

const STEPS = [
  { n: 1, label: 'Shipping' },
  { n: 2, label: 'Payment' },
];

function StepIndicator({ step, maxStepReached, onJump }) {
  return (
    <div style={stepIndicatorWrap}>
      {STEPS.map(({ n, label }, i) => {
        const done = n < step;
        const active = n === step;
        const reachable = n <= maxStepReached;
        return (
          <React.Fragment key={n}>
            <button
              type="button"
              onClick={() => reachable && onJump(n)}
              disabled={!reachable}
              style={{ ...stepIndicatorItem, cursor: reachable ? 'pointer' : 'default' }}
            >
              <span style={{ ...stepDot, ...(done ? stepDotDone : active ? stepDotActive : stepDotPending) }}>
                {done ? '✓' : n}
              </span>
              <span style={{ ...stepLabel, color: active || done ? T.ink : T.soft }}>{label}</span>
            </button>
            {i < STEPS.length - 1 && <span style={stepConnector} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Flat optional add-on for reshipment/refund if a package is lost, damaged,
// or stolen in transit. Price mirrors the reference design (necessaire.com)
// this was modeled on — adjust freely. IMPORTANT: this only means something
// to a shopper if there's a real support process behind it (reship/refund
// on request for orders that paid for it) — see the order's shippingProtection
// field in the admin Orders tab.
const SHIPPING_PROTECTION_PRICE = 2.79;

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

// ANESE's shipping-protection mark — the same open-flap box as ShipIcon
// above, with a small shield-check badge overlapping its corner to read as
// "this box is covered," rather than a generic insurance/shield glyph on
// its own.
function BoxProtectionIcon(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M2.5 7.5l7.5-3.7 7.5 3.7-7.5 3.7-7.5-3.7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M2.5 7.5v7.6l7.5 3.7 7.5-3.7V7.5M10 11.2v7.6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16.3 12.6l3 1v2.1c0 1.9-1.3 3-3 3.6-1.7-.6-3-1.7-3-3.6v-2.1l3-1Z" fill="#FCFBF7" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M15.2 16.3l.9.9 1.6-1.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="7.7" r="1" fill="currentColor" />
    </svg>
  );
}


export default function CheckoutPage() {
  const router = useRouter();
  const { cart, total, hydrated, clear, appliedDiscount, applyDiscount, clearDiscount, codeDiscountAmount, discountedTotal } = useCart();

  // Contact + delivery
  const [email, setEmail] = React.useState('');
  const [newsletter, setNewsletter] = React.useState(true);
  const [shipping, setShipping] = React.useState(EMPTY_ADDRESS);
  const [shippingProtection, setShippingProtection] = React.useState(false);
  const [showMoreAddress, setShowMoreAddress] = React.useState(false);

  // 2-step flow (Shipping -> Payment). maxStepReached gates the step
  // indicator's jump-back links — a shopper can always return to a step
  // already completed, but can't skip ahead by clicking Payment first.
  const [step, setStep] = React.useState(1);
  const [maxStepReached, setMaxStepReached] = React.useState(1);

  // Every step change scrolls back to the top of the page — advancing from
  // a scrolled-down Step 1 straight into Step 2 would otherwise leave the
  // shopper staring at whatever scroll position Step 1 left them at.
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Payment — Square's Card element renders its own number/expiry/CVC/
  // postal-code fields into squareCardContainerRef; the returned Card
  // instance (not raw field values) lives in squareCardRef for tokenize()
  // at submit time. squareReady disables submit until it's actually
  // mounted, same guard the old Stripe Payment Element used.
  const squareCardContainerRef = React.useRef(null);
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

  // Discount + UI state
  const [discountCode, setDiscountCode] = React.useState('');

  // Restore contact/shipping progress on mount (e.g. after a refresh) —
  // done in an effect rather than lazy useState initializers so server and
  // first client render match (sessionStorage doesn't exist during SSR).
  // Must come after every piece of state it reads/sets is declared above —
  // effect dependency arrays are evaluated immediately during render, so
  // referencing a not-yet-declared const here throws a TDZ ReferenceError.
  const [progressRestored, setProgressRestored] = React.useState(false);
  React.useEffect(() => {
    const saved = loadCheckoutProgress();
    if (saved) {
      if (saved.email) setEmail(saved.email);
      if (typeof saved.newsletter === 'boolean') setNewsletter(saved.newsletter);
      if (saved.shipping) setShipping({ ...EMPTY_ADDRESS, ...saved.shipping });
      if (typeof saved.shippingProtection === 'boolean') setShippingProtection(saved.shippingProtection);
      if (saved.discountCode) setDiscountCode(saved.discountCode);
    }
    setProgressRestored(true);
  }, []);

  // Persist progress on every relevant change, once the initial restore
  // above has run (otherwise this would immediately overwrite saved
  // progress with the pre-restore empty defaults on first render).
  React.useEffect(() => {
    if (!progressRestored) return;
    saveCheckoutProgress({ email, newsletter, shipping, shippingProtection, discountCode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressRestored, email, newsletter, shipping, shippingProtection, discountCode]);

  const [discountMessage, setDiscountMessage] = React.useState('');
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const errorRef = React.useRef(null);
  // The error message renders once, near the "Place order" button at the
  // bottom of the form — fine for card errors (the shopper is already right
  // there), but Apple Pay/Google Pay/Afterpay live mid-page in the Payment
  // section. A validation failure from one of those buttons (e.g. missing
  // shipping address) used to set this same error with no visible reaction
  // near the button that was actually clicked — a shopper scrolled up at
  // Payment would see nothing happen at all. Scrolling it into view on every
  // change fixes that regardless of where on the page the error originated.
  React.useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [error]);

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
      }),
      keepalive: true,
    }).catch(() => {});
    // Fire once per checkout page load, not on every cart mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Mounts Square's own card-entry form into #square-card-container once on
  // load — this is deliberately the plainest possible version of Square's
  // own quickstart pattern (payments.card() -> attach()), rebuilt from
  // scratch after ruling out the billingContact/verificationDetails shape
  // as the cause of a live "unexpected error" (confirmed byte-for-byte
  // against Square's own square/web-payments-quickstart example — the
  // fields were already correct). There's no raw number/expiry/CVC state
  // to manage here — Square's element owns those fields directly and only
  // ever hands back a token via tokenize(), never the underlying data.
  React.useEffect(() => {
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
      if (squareCardRef.current) squareCardRef.current.destroy().catch(() => {});
    };
  }, []);

  const addressEntered = Boolean(shipping.address.trim() && shipping.city.trim() && shipping.state && shipping.zip.trim());

  // Mounts Apple Pay / Google Pay / Afterpay as soon as the Square SDK is
  // ready — same moment the card element becomes usable, not gated on
  // shipping being filled in, so a shopper who wants to pay with a wallet
  // never has to type an address first just to see the button (the section
  // itself is still positioned after Shipping Protection in the JSX below,
  // so by the time it's visible shipping is already filled in). Safe to
  // mount this early either way because handleWalletPay (below) still
  // validates email/shipping are filled in before it lets a click actually
  // proceed to tokenize() — the button existing isn't the same as the
  // button working. Each pre-declares a total when created (whatever
  // grandTotal is at that moment, which won't yet include shipping if the
  // address isn't entered yet); known limitation: that displayed total
  // doesn't live-update as shipping/discounts change afterward (recreating
  // the buttons on every total change would flicker them) — the amount
  // actually charged is always read fresh from latestRef at tokenize time,
  // so this is a display lag, not a billing bug. Afterpay additionally has
  // its own order-amount eligibility range — outside it, createAfterpayButton
  // fails the same way an unsupported browser/device does for Apple/Google
  // Pay, and the button just doesn't appear.
  React.useEffect(() => {
    if (!squareReady) return;
    let cancelled = false;
    const cleanupFns = [];

    (async () => {
      const amount = latestRef.current.grandTotal;

      const apple = await createApplePayButton(amount, 'apple-pay-button');
      if (cancelled) {
        apple?.destroy?.().catch(() => {});
      } else if (apple) {
        appleMethodRef.current = apple;
        setAppleAvailable(true);
        const btn = document.getElementById('apple-pay-button');
        const onClick = (event) => { event.preventDefault(); handleWalletPay(appleMethodRef, 'Apple Pay'); };
        btn?.addEventListener('click', onClick);
        cleanupFns.push(() => btn?.removeEventListener('click', onClick));
      }

      const google = await createGooglePayButton(amount, 'google-pay-button');
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

      const afterpay = await createAfterpayButton(amount, 'afterpay-button');
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
      appleMethodRef.current?.destroy?.().catch(() => {});
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

  // Don't add shipping to the total until there's an address to base it on —
  // showing $5 on top of what the shopper expected from the product/cart
  // page, before they've typed anything, just reads as an unexplained price
  // jump. It only enters the total once addressEntered flips true, same
  // moment the Shipping method section below stops saying "enter your
  // address" and starts showing an actual rate.
  const shippingCost = !addressEntered || cart.length === 0 ? 0 : (total >= 50 ? 0 : 5);
  const subtotal = cart.reduce((sum, item) => sum + (item.originalPrice ?? item.price) * item.quantity, 0);
  const discountTotal = subtotal - total;
  const shippingProtectionCost = shippingProtection ? SHIPPING_PROTECTION_PRICE : 0;
  const grandTotal = discountedTotal + shippingCost + shippingProtectionCost;

  // Apple Pay/Google Pay's button click handler is attached once (see the
  // wallet mount effect below) and can fire long after that — reading
  // email/shipping/cart/grandTotal through this ref instead of closing
  // over them directly means it always sees what's currently on the page,
  // not what was there at mount.
  const latestRef = React.useRef({});
  latestRef.current = { email, shipping, cart, grandTotal, shippingProtectionCost };

  // Fires once the shopper's attention leaves the email field — a good
  // enough proxy for "entered their email" without hammering the KV store
  // on every keystroke. If they never complete the order, this is the only
  // record of them; lib/orderFulfillment.js upgrades the same entry to
  // 'purchased' if they do.
  const handleEmailBlur = () => {
    if (!email.trim()) return;
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

  // Shared by the card submit handler below and the Apple Pay/Google Pay
  // click handler — every Square payment method resolves to the same
  // single-use token shape, so charging and fulfilling it is identical
  // regardless of which method produced it. Reads email/shipping/cart/
  // grandTotal from latestRef rather than closed-over state since the
  // wallet path can fire long after the render that created its handler.
  const completeSquareOrder = async (token, paymentMethodLabel) => {
    const { email, shipping, cart, grandTotal, shippingProtectionCost } = latestRef.current;
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
        shippingProtection: shippingProtectionCost || 0,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Payment failed');

    sessionStorage.setItem('anese-purchase', JSON.stringify({
      eventId: purchaseEventId,
      amount: grandTotal,
      contentIds: cart.map((i) => i.id),
      contents: cart.map((i) => ({ id: i.id, quantity: i.quantity })),
    }));
    clearCheckoutProgress();
    await router.push('/success');
    clear();
  };

  // Apple Pay / Google Pay only render their own button — there's no
  // "Place order" click to hang the usual form-level required-field
  // validation off of, so this checks email/shipping directly before
  // approving.
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
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goToStep = (n) => {
    setError('');
    setStep(n);
    setMaxStepReached((m) => Math.max(m, n));
  };

  // Step 1's own <form> submit — native required-field validation only
  // ever sees Step 1's fields since Step 2 isn't mounted yet, same
  // technique checkout-qb.jsx's 3-step flow uses.
  const handleStep1Submit = (e) => {
    e.preventDefault();
    goToStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!squareReady || !squareCardRef.current) {
      setError('Payment form is still loading — please wait a moment and try again.');
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: tokenize the card via Square's Web Payments SDK
      // (lib/squareClient.js) — the raw card number never reaches our own
      // server, only Square's. The token is single-use.
      //
      // verificationDetails deliberately omitted entirely (not just
      // billingContact): passing ANY verificationDetails object — even with
      // billingContact removed — still routes tokenize() through Square's
      // separate buyer-verification call to
      // pci-connect.squareup.com/v2/analytics/verifications, which — live,
      // confirmed via the real Square error response body — rejects this
      // account's location ("Invalid location id") even though that same
      // location processes real charges fine (confirmed via a completed
      // charge and via Square's own ListLocations API showing it ACTIVE with
      // CREDIT_CARD_PROCESSING). The wallet buttons (Apple/Google
      // Pay/Afterpay) call tokenize() with no arguments at all and always
      // succeeded — mirroring that here avoids the broken verification call.
      // verificationDetails only supports AVS/CVV/SCA verification, not
      // whether the charge itself can complete.
      const token = await tokenizeSquareCard(squareCardRef.current);

      // Step 2: charge that token server-side (/api/square-checkout). Like
      // QuickBooks, a Square charge has no redirect step and no webhook —
      // it either succeeds or fails in this same request — so fulfillment
      // and the success-page navigation both happen right here.
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
      <header style={topbar}>
        <Link href="/" style={{ ...S.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 10, paddingBottom: 10, textDecoration: 'none' }}>
          <img src="/images/anese_logo_transparent.png" alt="anese" style={{ height: 44, width: 'auto' }} />
        </Link>
      </header>

      <button className="summary-toggle" style={summaryToggle} onClick={() => setSummaryOpen((o) => !o)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{summaryOpen ? 'Hide' : 'Show'} order summary</span>
          <span style={{ fontSize: 10 }}>{summaryOpen ? '▲' : '▼'}</span>
        </span>
        <span style={{ fontFamily: T.sans, fontSize: 17 }}>${grandTotal.toFixed(2)}</span>
      </button>

      <div className="checkout-grid" style={checkoutGrid}>
        <div style={formCol}>
          <StepIndicator step={step} maxStepReached={maxStepReached} onJump={goToStep} />

          {step === 1 && (
            <form onSubmit={handleStep1Submit}>
              <section style={{ marginTop: 24 }}>
                <div style={sectionHead}>
                  <h2 style={sectionTitle}>Contact</h2>
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  style={input}
                  autoComplete="email"
                  required
                />
                <label style={checkboxLabel}>
                  <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
                  Email me with news and offers
                </label>
              </section>

              <section style={{ marginTop: 24 }}>
                <div style={sectionHead}>
                  <h2 style={sectionTitle}>Delivery</h2>
                </div>
                <select value="United States" readOnly style={{ ...input, marginBottom: 12, color: T.soft }}>
                  <option>United States</option>
                </select>
                <AddressFields value={shipping} onChange={setShipping} idPrefix="ship" inputStyle={input} compact />
              </section>

              <section style={{ marginTop: 24 }}>
                <div style={sectionHead}>
                  <h2 style={sectionTitle}>Shipping method</h2>
                </div>
                {addressEntered ? (
                  <div style={shipMethod}>
                    <div>
                      <div>Standard Shipping</div>
                      <div style={{ fontSize: 12, color: T.soft, marginTop: 2 }}>3–5 business days after order placed</div>
                    </div>
                    <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                  </div>
                ) : (
                  <p style={{ color: T.soft, fontSize: 14 }}>Enter your delivery address to see shipping options.</p>
                )}
              </section>

              <section style={{ marginTop: 16 }}>
                <div style={protectionCard}>
                  <div style={protectionIconBox}>
                    <BoxProtectionIcon style={{ color: T.ink }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 14, color: T.ink }}>Shipping Protection</span>
                      <span title="Covers reshipment or a refund if your order is lost, damaged, or stolen in transit. Contact us and we'll make it right.">
                        <InfoIcon style={{ color: T.soft }} />
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: T.soft, marginTop: 2 }}>For lost, damaged, or stolen packages</div>
                    <div style={{ fontSize: 13, color: T.ink, marginTop: 4 }}>${SHIPPING_PROTECTION_PRICE.toFixed(2)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShippingProtection((v) => !v)}
                    style={{ ...S.btnOutline, height: 38, padding: '0 20px', ...(shippingProtection ? { background: T.paper } : {}) }}
                  >
                    {shippingProtection ? 'Remove' : 'Add'}
                  </button>
                </div>
              </section>

              <button
                type="submit"
                style={{ ...S.btnFill, width: '100%', justifyContent: 'center', marginTop: 24, height: 58, fontSize: 13 }}
              >
                Continue to payment
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit}>
              {/* Compact read-only recap of Step 1 instead of repeating it —
                  a "Change" link jumps straight back rather than re-showing
                  every field a second time. */}
              <section style={{ marginTop: 24 }}>
                <div style={recapRow}>
                  <div>
                    <div style={recapLabel}>Contact</div>
                    <div style={recapValue}>{email}</div>
                  </div>
                  <button type="button" onClick={() => goToStep(1)} style={changeLink}>Change</button>
                </div>
                <div style={{ ...recapRow, marginTop: 10 }}>
                  <div>
                    <div style={recapLabel}>Ship to</div>
                    <div style={recapValue}>
                      {shipping.address}{shipping.apt ? `, ${shipping.apt}` : ''}, {shipping.city}, {shipping.state} {shipping.zip}
                    </div>
                  </div>
                  <button type="button" onClick={() => goToStep(1)} style={changeLink}>Change</button>
                </div>
              </section>

              <section style={{ marginTop: 24 }}>
                <h2 style={{ ...sectionTitle, marginBottom: 4 }}>Payment</h2>
                <p style={{ fontSize: 13, color: T.soft, marginBottom: 14 }}>All transactions are secure and encrypted.</p>

                {/* Apple Pay / Google Pay — the containers always exist in
                    the DOM (hidden via display:none, not conditional
                    rendering) since Square's attach() needs to find them by
                    id before we know whether that wallet is actually
                    available on this browser/device; the whole section
                    (heading + OR divider) stays hidden the same way until
                    at least one of them is. Sits above Afterpay per request,
                    so shoppers see Apple/Google Pay first. */}
                <div style={{ display: (appleAvailable || googleAvailable) ? 'block' : 'none', marginBottom: 10 }}>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: appleAvailable ? 'block' : 'none' }}>
                      <div id="apple-pay-button" style={walletButtonContainer} />
                    </div>
                    <div style={{ display: googleAvailable ? 'block' : 'none' }}>
                      <div id="google-pay-button" style={walletButtonContainer} />
                    </div>
                  </div>
                </div>

                {/* Afterpay sits right above the card box — same
                    email/shipping validation via handleWalletPay, just
                    presented as an alternative to the card form specifically
                    instead of grouped with the other wallets. Only one "OR"
                    divider total, after Afterpay and before Credit card —
                    not also between the wallet buttons and Afterpay. */}
                <div style={{ display: afterpayAvailable ? 'block' : 'none', marginBottom: 14 }}>
                  <div id="afterpay-button" style={walletButtonContainer} />
                  <div style={orDivider}>
                    <span style={orDividerLine} />
                    <span style={orDividerText}>OR</span>
                    <span style={orDividerLine} />
                  </div>
                </div>

                <div style={paymentList}>
                  <div style={accordionRow}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Credit card</span>
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
              </section>

              {/* Single discount-code box for the whole checkout — the old
                  single-page form also had one in the sticky summary,
                  showing the same input twice on screen at once. */}
              <section style={{ marginTop: 24 }}>
                <div style={sectionHead}>
                  <h2 style={sectionTitle}>Discount code</h2>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    placeholder="Discount code"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value);
                      if (appliedDiscount) clearDiscount();
                      setDiscountMessage('');
                    }}
                    style={{ ...input, flex: 1 }}
                  />
                  <button type="button" style={S.btnOutline} onClick={handleApplyDiscount}>Apply</button>
                </div>
                {discountMessage && (
                  <p style={{ fontSize: 12, color: appliedDiscount ? T.ink : '#a13d2b', marginTop: 8 }}>{discountMessage}</p>
                )}
              </section>

              {error && <p ref={errorRef} style={errorText}>{error}</p>}

              <button
                type="submit"
                disabled={submitting || !squareReady}
                style={{
                  ...S.btnFill, width: '100%', justifyContent: 'center', marginTop: 20,
                  height: 58, fontSize: 13, opacity: submitting || !squareReady ? 0.6 : 1,
                }}
              >
                {submitting ? 'Processing…' : `Place order — $${grandTotal.toFixed(2)}`}
              </button>
              <div style={secureNote}>
                <LockIcon />
                <span>256-bit SSL encrypted &middot; your card details never touch our servers</span>
              </div>
              <p style={{ fontSize: 11, color: T.soft, textAlign: 'center', marginTop: 8 }}>
                Payments securely processed by Square
              </p>
            </form>
          )}
        </div>

        <aside className={`order-summary ${summaryOpen ? 'open' : ''}`} style={summaryCol}>
          <div style={{ maxHeight: 340, overflowY: 'auto', marginBottom: 20 }}>
            {cart.map((item) => (
              <div key={item.id} style={summaryItem}>
                <div style={summaryImgWrap}>
                  <ProductVisual id={item.id} images={item.images} alt={item.name} width={48} staticImage />
                  <span style={qtyBadge}>{item.quantity}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14 }}>{item.name}</div>
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
          {shippingProtection && (
            <div style={summaryRow}>
              <span style={{ color: T.soft }}>Shipping Protection</span>
              <span>${SHIPPING_PROTECTION_PRICE.toFixed(2)}</span>
            </div>
          )}
          <div style={{ ...summaryRow, borderTop: `1px solid ${T.line}`, paddingTop: 16, marginTop: 6 }}>
            <span style={{ fontFamily: T.sans, fontSize: 18 }}>Total</span>
            <span style={{ fontFamily: T.sans, fontSize: 24 }}>${grandTotal.toFixed(2)}</span>
          </div>
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
        :global(.row-3) { display: grid; grid-template-columns: 1.4fr 0.8fr 1fr; gap: 10px; }
        .summary-toggle { display: none; }
        .checkout-grid { grid-template-columns: 1.35fr 1fr; }
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
        @media (max-width: 860px) {
          .checkout-grid { grid-template-columns: 1fr; }
          .summary-toggle { display: flex; }
          .order-summary { display: none; order: -1; border-bottom: 1px solid ${T.line}; }
          .order-summary.open { display: block; }
        }
        @media (max-width: 520px) {
          :global(.row-3) { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

const topbar = { borderBottom: `1px solid ${T.line}`, textAlign: 'center' };
const stepIndicatorWrap = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20 };
const stepIndicatorItem = { display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, font: 'inherit' };
const stepDot = {
  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 12, fontFamily: T.sans, fontWeight: 700, flexShrink: 0,
};
const stepDotPending = { background: T.paper, color: T.soft, border: `1px solid ${T.line}` };
const stepDotActive = { background: T.ink, color: T.oat };
const stepDotDone = { background: T.ink, color: T.oat };
const stepLabel = { fontFamily: T.sans, fontSize: 13, fontWeight: 600 };
const stepConnector = { width: 30, height: 1, background: T.line };
const recapRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '12px 14px', border: `1px solid ${T.line}`, borderRadius: 8 };
const recapLabel = { fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.soft };
const recapValue = { fontSize: 14, color: T.ink, marginTop: 3 };
const changeLink = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, textDecoration: 'underline', textUnderlineOffset: 3, color: T.ink, flexShrink: 0 };
const summaryToggle = {
  width: '100%', border: 'none', borderBottom: `1px solid ${T.line}`, background: T.paper,
  padding: '16px 24px', alignItems: 'center', justifyContent: 'space-between',
  cursor: 'pointer', fontFamily: T.sans, fontSize: 13, color: T.ink,
};
const checkoutGrid = { display: 'grid', maxWidth: 1280, margin: '0 auto', columnGap: 40, rowGap: 20 };
const formCol = { padding: '32px 10px', borderRight: `1px solid ${T.line}` };
const summaryCol = { padding: '32px 40px', background: T.white };
const secureNote = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, fontSize: 12, color: T.soft };
const sectionHead = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, flexWrap: 'wrap', gap: 8 };
const sectionTitle = { fontFamily: T.sans, fontWeight: 700, fontSize: 22, margin: 0 };
// fontSize must stay at 16px or higher — below that, iOS Safari
// auto-zooms the whole page in when a shopper taps into any of these
// fields, which is the "moves the checkout page weird" behavior on focus.
const input = {
  width: '100%', height: 44, padding: '0 14px', border: `1px solid ${T.line}`, background: T.white,
  fontFamily: T.sans, fontSize: 16, fontWeight: 400, color: T.ink, outline: 'none', boxSizing: 'border-box', borderRadius: 4,
};
const checkboxLabel = { display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, fontSize: 13, color: T.soft };
const paymentList = { border: `1.5px solid ${T.ink}`, borderRadius: 10, background: T.white, overflow: 'hidden' };
const accordionRow = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '16px 14px', borderBottom: `1px solid ${T.line}`, background: T.white,
};
const accordionBody = { padding: '14px 14px 18px', background: T.white };
// Square's Web Payments SDK renders its own iframe-based fields into this
// container (card.attach), already inside its own bordered/rounded box —
// no border/padding here, or the card ends up boxed twice; min-height only,
// to keep the layout from jumping while the SDK script loads and mounts.
const squareCardContainer = { minHeight: 48 };
const walletDivider = {
  fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.soft,
  textAlign: 'center', margin: 0,
};
const orDivider = { display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 0' };
const orDividerLine = { flex: 1, height: 1, background: T.line };
const orDividerText = { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.soft };
// No background/border here — Apple Pay and Google Pay each style their
// own attached button (their own colors, logo, corner radius).
const walletButtonContainer = { width: '100%', minHeight: 44 };
const protectionCard = {
  display: 'flex', alignItems: 'center', gap: 14, padding: 14,
  border: `1px solid ${T.line}`, borderRadius: 8, background: T.white,
};
const protectionIconBox = {
  width: 44, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: `1px solid ${T.line}`, borderRadius: 8, background: T.white,
};
const shipMethod = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 14px',
  border: `1px solid ${T.ink}`, fontSize: 14,
};
const errorText = { color: '#a13d2b', fontSize: 13, marginTop: 20 };
const summaryItem = { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' };
const summaryImgWrap = { position: 'relative', width: 48, height: 48, flexShrink: 0, overflow: 'hidden', border: `1px solid ${T.line}`, background: T.white };
const qtyBadge = {
  position: 'absolute', top: -8, right: -8, background: T.soft, color: T.white, borderRadius: '50%',
  width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
};
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
