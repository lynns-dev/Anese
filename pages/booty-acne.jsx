import React from 'react';
import Header from '../components/Header';
import CartDrawer from '../components/CartDrawer';
import ProductVisual from '../components/ProductVisual';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import AnimatedResultsTimeline from '../components/AnimatedResultsTimeline';
import { getProductById } from '../lib/products';
import { useCart } from '../lib/useCart';
import { useAllReviews } from '../lib/useReviews';
import { T, S } from '../lib/theme';

// Dedicated landing page for booty-acne-specific traffic (ads, search) —
// same product as the regular PDP (that-booty-tho), but every word and
// section is written for this one concern instead of the general
// booty-scrub pitch. Visual-first: short copy blocks between images/
// animation/social proof rather than long paragraphs, closer to an ad
// landing page than the full PDP.
const RECEIPTS = [
  '/images/anese-before-after-1.jpg',
  '/images/anese-before-after-2.jpg',
  '/images/anese-before-after-3.jpg',
  '/images/anese-before-after-4.jpg',
];

const CAUSES = [
  ['Clogged pores', 'Sweat, friction, and dead skin build up in pores you can\'t see — that\'s the breakout waiting to happen.'],
  ['Trapped bacteria', 'Tight clothes and sitting all day trap bacteria against skin, the same way it causes acne anywhere else.'],
  ['Rough, thick skin', "Butt skin is thicker than your face's — regular face routines aren't strong enough to actually reach it."],
];

const FAQS = [
  ['Will this actually help my booty acne?', "It's built for it. Walnut grain physically clears clogged pores while botanical extracts calm the inflammation that turns a clogged pore into a breakout."],
  ['Is it safe to use on active breakouts?', 'Yes — it\'s gentle enough for regular use (2–3x a week) without over-stripping or irritating already-inflamed skin.'],
  ['How long until I see results?', "Smoother immediately. Most people see visibly calmer, clearer skin within 1–2 weeks of consistent use."],
  ['Will it help with dark marks left behind?', 'Regular exfoliation is exactly what fades post-acne marks over time — it\'s the same principle dermatologists recommend for the face.'],
];

export default function BootyAcneLanding() {
  const c = useCart();
  const product = getProductById('that-booty-tho');
  const reviewsByProduct = useAllReviews();
  const reviews = reviewsByProduct[product.id] || { reviews: [], average: 0, count: 0 };
  const [quantity, setQuantity] = React.useState(1);

  const handleAdd = () => c.add(product, quantity);

  return (
    <div style={{ paddingBottom: 76 }}>
      <Seo
        title="Booty Acne Treatment | That Booty Tho. — ANESE"
        description="A walnut-grain scrub built specifically for booty acne — clears clogged pores, calms breakouts, fades dark marks. Dermatologist-informed, cruelty-free."
        path="/booty-acne"
      />
      <Header cartCount={c.count} onCartClick={() => c.setOpen(true)} />

      {/* HERO */}
      <section style={hero}>
        <div style={heroInner}>
          <div>
            <p style={S.label}>For booty acne, specifically</p>
            <h1 style={heroH1}>Bumps, breakouts, <span style={S.it}>gone from the butt down.</span></h1>
            <p style={heroSub}>
              Not a regular body scrub with a cute name — walnut grain formulated to clear the clogged
              pores and trapped bacteria behind booty acne, without stripping or irritating skin that's
              already inflamed.
            </p>
            {reviews.count > 0 && (
              <div style={heroRating}>
                <span style={{ color: T.honey, letterSpacing: '1.5px' }}>{'★'.repeat(Math.round(reviews.average))}{'☆'.repeat(5 - Math.round(reviews.average))}</span>
                {' '}{reviews.average.toFixed(1)} · {reviews.count}+ reviews
              </div>
            )}
            <button style={{ ...S.btnFill, marginTop: 22 }} onClick={handleAdd}>Shop the fix — ${product.price}</button>
          </div>
          <div style={heroImg}>
            <ProductVisual id={product.id} images={product.images} alt={product.name} width={220} />
          </div>
        </div>
      </section>

      {/* WHY IT HAPPENS */}
      <section style={{ ...band, background: T.shell, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
        <div style={{ ...S.wrap, textAlign: 'center' }}>
          <p style={S.label}>Why it happens</p>
          <h2 style={{ ...S.h2, marginTop: 12 }}>It's not just you.</h2>
          <div className="causes-grid" style={causesGrid}>
            {CAUSES.map(([h, p]) => (
              <div key={h} style={causeCard}>
                <div style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 22, marginBottom: 10 }}>{h}</div>
                <p style={{ fontSize: 14, color: T.soft, margin: 0 }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — animation */}
      <section style={band}>
        <div style={{ ...S.wrap, maxWidth: 640 }}>
          <AnimatedResultsTimeline />
        </div>
      </section>

      {/* RECEIPTS */}
      <section style={{ ...band, background: T.shell, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
        <div style={{ ...S.wrap, textAlign: 'center' }}>
          <p style={S.label}>Real results</p>
          <h2 style={{ ...S.h2, marginTop: 12 }}>Not filtered. <span style={S.it}>Not staged.</span></h2>
          <div className="receipts-grid" style={receiptsGrid}>
            {RECEIPTS.map((src, i) => (
              <div key={i} style={receiptCard}><img src={src} alt="Before and after" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} /></div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS SNIPPET */}
      {reviews.reviews.length > 0 && (
        <section style={band}>
          <div style={{ ...S.wrap, textAlign: 'center' }}>
            <p style={S.label}>From people who dealt with the same thing</p>
            <div className="rev-grid" style={revGrid}>
              {reviews.reviews.slice().reverse().slice(0, 3).map((r) => (
                <div key={r.id} style={revCard}>
                  <div style={{ color: T.honey, letterSpacing: '1px', marginBottom: 14 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  <p style={{ fontFamily: T.serif, fontSize: 19, lineHeight: 1.3, marginBottom: 14 }}>"{r.text}"</p>
                  <cite style={{ fontStyle: 'normal', fontSize: 13, color: T.soft }}>— {r.author}, Verified Buyer</cite>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section style={{ ...band, background: T.shell, borderTop: `1px solid ${T.line}` }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <p style={S.label}>Good to know</p>
          <h2 style={{ ...S.h2, marginTop: 12 }}>Real questions.</h2>
          <div style={{ marginTop: 30, textAlign: 'left' }}>
            {FAQS.map(([q, a]) => (
              <div key={q} style={faqRow}>
                <div style={{ fontFamily: T.serif, fontSize: 19, marginBottom: 6 }}>{q}</div>
                <p style={{ fontSize: 14, color: T.soft, margin: 0 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section style={closing}>
        <p style={{ ...S.label, color: T.oat }}>Booty acne, handled</p>
        <h2 style={{ ...S.h2, marginTop: 16, color: '#fff', fontSize: 'clamp(38px,6vw,64px)' }}>
          Clear it up <span style={{ ...S.it, color: T.white }}>starting tonight.</span>
        </h2>
        <button onClick={handleAdd} style={{ ...S.btnFill, padding: '0 52px', marginTop: 24 }}>
          Shop {product.name} — ${product.price}
        </button>
        <p style={{ marginTop: 18, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)' }}>
          Free shipping over $50 · 30-day guarantee
        </p>
      </section>

      <Footer />
      <CartDrawer {...c} onClose={() => c.setOpen(false)} />

      {/* Floating add-to-cart bar, same shape as the PDP's */}
      <div style={stickyBar}>
        <div className="sticky-bar-inner" style={stickyBarInner}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 15, color: T.oat, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
            <div style={{ fontFamily: T.sans, fontSize: 13, color: 'rgba(244,237,227,0.7)', marginTop: 2 }}>${product.price}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <div style={stickyQtyWrap}>
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} style={stickyQtyBtn} aria-label="Decrease quantity">−</button>
              <span style={{ width: 30, textAlign: 'center', fontSize: 14, fontWeight: 500, color: T.oat }}>{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} style={stickyQtyBtn} aria-label="Increase quantity">+</button>
            </div>
            <button onClick={handleAdd} style={stickyAddBtn}>Add to cart</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .causes-grid { grid-template-columns: repeat(3, 1fr); }
        .rev-grid { grid-template-columns: repeat(3, 1fr); }
        .receipts-grid { grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 880px) {
          .causes-grid { grid-template-columns: 1fr; }
          .rev-grid { grid-template-columns: 1fr; }
          .receipts-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 680px) {
          .sticky-bar-inner { padding: 0 16px; gap: 12px; }
        }
      `}</style>
    </div>
  );
}

const hero = { padding: '60px 32px 70px', maxWidth: T.maxw, margin: '0 auto' };
const heroInner = { display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 50, alignItems: 'center' };
const heroH1 = { fontFamily: T.serif, fontWeight: 400, fontSize: 'clamp(36px,5vw,58px)', lineHeight: 1.02, marginTop: 16 };
const heroSub = { fontSize: 15, color: T.soft, lineHeight: 1.6, marginTop: 18, maxWidth: '46ch' };
const heroRating = { fontSize: 14, color: T.soft, fontFamily: T.sans, marginTop: 18 };
const heroImg = { display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.shell, borderRadius: 24, aspectRatio: '1/1' };
const band = { padding: '80px 0' };
const causesGrid = { display: 'grid', gap: 20, marginTop: 44, textAlign: 'left' };
const causeCard = { background: T.white, borderRadius: 20, padding: '30px 28px', boxShadow: T.shadowSm };
const receiptsGrid = { display: 'grid', gap: 16, marginTop: 44 };
const receiptCard = { overflow: 'hidden', boxShadow: T.shadowSm, background: T.white };
const revGrid = { display: 'grid', gap: 20, marginTop: 44, textAlign: 'left' };
const revCard = { background: T.oat, borderRadius: 20, padding: 28 };
const faqRow = { padding: '22px 0', borderBottom: `1px solid ${T.line}` };
const closing = { background: T.ink, color: T.oat, textAlign: 'center', padding: '110px 32px' };
const stickyBar = { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 150, background: T.ink, padding: '14px 0' };
const stickyBarInner = { maxWidth: T.maxw, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, padding: '0 32px' };
const stickyQtyWrap = { display: 'flex', alignItems: 'center', border: `1px solid ${T.dline}`, height: 40 };
const stickyQtyBtn = { width: 32, height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: T.oat };
const stickyAddBtn = { ...S.btnFill, background: T.oat, color: T.ink, height: 40, padding: '0 22px', whiteSpace: 'nowrap', flexShrink: 0 };
