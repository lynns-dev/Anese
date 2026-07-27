import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import CartDrawer from '../../components/CartDrawer';
import ProductVisual from '../../components/ProductVisual';
import Marquee from '../../components/Marquee';
import Footer from '../../components/Footer';
import { PRODUCTS, getProductById } from '../../lib/products';
import { useCart } from '../../lib/useCart';
import { fbTrack } from '../../lib/fbPixel';
import { T, S } from '../../lib/theme';

const BENEFITS = [
  ['Smoother texture', "Walnut grain buffs away rough, uneven, dull skin — what's left feels like a compliment."],
  ['Lit-from-within glow', 'Shea, jojoba & rosehip hydrate while you exfoliate, so you rinse off glowing, not stripped.'],
  ['Made for the booty', 'Formulated for butt, thighs & hips — the spots most body scrubs completely ignore.'],
  ['Gritty, not gnarly', 'Coarse enough to work, gentle enough for 2–3x a week. No raw, over-scrubbed skin.'],
  ['Viral for a reason', 'Thousands swear by the glow-up. The before & afters speak for themselves.'],
  ['Zero body-shaming', "Not here to \"fix\" you. We're not punishing our bodies anymore — we're taking care of them."],
];

const TIMELINE = [
  ['Right away', 'Instantly smoother', 'Softer to the touch the second you step out of the shower.'],
  ['3–7 days', 'Better texture', "Noticeably more even skin where you've been scrubbing."],
  ['Long-term', 'Consistently soft', 'Smooth, confident skin that sticks around with regular use.'],
];

const HOW_TO_USE = [
  ['Hop in the shower', "On wet skin, scoop two moist fingers' worth onto your target area."],
  ['Massage in circles', 'Work it into booty, thighs, hips — wherever you want the glow.'],
  ['Rinse & repeat', "2–3x a week. A small scoop goes a long way, so don't go overboard."],
];

// Drop real customer before/after photos into public/images and list them
// here — the section hides while empty.
const RECEIPTS = [];

const FAQS = [
  ['Is it too rough?', "Nope. The texture is intentionally balanced — gritty enough to exfoliate, gentle enough that you're not left raw. We're buffing, not sanding."],
  ['How often should I use it?', '2–3x a week is the sweet spot, depending on your skin. A small scoop goes a long way.'],
  ['How long until I see results?', "You'll feel smoother immediately. Most people see noticeably softer, more even skin within a few days of consistent use."],
  ['Will it help with bumps or "strawberry skin"?', 'Lots of customers use it on rough, bumpy texture. Results vary, but regular exfoliation + hydration is exactly what that texture loves.'],
  ['Is it clean?', 'Formulated without harsh additives and made to be skin-friendly. The full ingredient list is right on the page — no secrets.'],
  ['Can I use it anywhere else?', 'Go for it — thighs, hips, arms, wherever you want smoother skin. Just keep it below the neck.'],
];

export async function getStaticPaths() {
  return { paths: PRODUCTS.map((p) => ({ params: { id: p.id } })), fallback: false };
}
export async function getStaticProps({ params }) {
  return { props: { product: getProductById(params.id) || null } };
}

function AccordionRow({ title, open, onToggle, children }) {
  return (
    <div style={accordionRow}>
      <button onClick={onToggle} style={accordionHeader} aria-expanded={open}>
        <span>{title}</span>
        <span style={accordionIcon}>{open ? '−' : '+'}</span>
      </button>
      <div style={{ ...accordionBody, maxHeight: open ? 600 : 0, opacity: open ? 1 : 0, paddingBottom: open ? 24 : 0 }}>
        {children}
      </div>
    </div>
  );
}

export default function ProductPage({ product }) {
  const c = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = React.useState(1);
  const [openSection, setOpenSection] = React.useState('how-to-use');
  const [openFaq, setOpenFaq] = React.useState(null);
  const images = React.useMemo(() => product?.images || [], [product]);
  const [activeImage, setActiveImage] = React.useState(images[0] || '');
  const [reviewData, setReviewData] = React.useState({ reviews: [], average: 0, count: 0 });
  const [reviewForm, setReviewForm] = React.useState({ rating: 5, text: '', author: '' });
  const [reviewSubmitting, setReviewSubmitting] = React.useState(false);
  const [reviewError, setReviewError] = React.useState('');
  const [reviewSubmitted, setReviewSubmitted] = React.useState(false);

  React.useEffect(() => {
    setActiveImage(images[0] || '');
  }, [images]);

  React.useEffect(() => {
    if (!product) return;
    fetch(`/api/reviews?productId=${product.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.reviews)) setReviewData(data);
      })
      .catch(() => {});
  }, [product]);

  React.useEffect(() => {
    if (!product) return;
    fbTrack('ViewContent', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: 'USD',
    });
  }, [product]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, ...reviewForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit review.');
      setReviewForm({ rating: 5, text: '', author: '' });
      setReviewSubmitted(true);
    } catch (err) {
      setReviewError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (router.isFallback || !product) return null;

  const upsell = PRODUCTS.find((p) => p.id !== product.id && p.category === product.category);
  const related = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);
  const toggleSection = (key) => setOpenSection((cur) => (cur === key ? null : key));
  const toggleFaq = (i) => setOpenFaq((cur) => (cur === i ? null : i));

  const unitPrice = product.price;

  const handleAdd = () => {
    c.add({ ...product, price: unitPrice }, quantity);
    setQuantity(1);
  };

  const handleAddUpsell = () => upsell && c.add(upsell, 1);

  return (
    <div style={{ paddingBottom: 76 }}>
      <Header cartCount={c.count} onCartClick={() => c.setOpen(true)} />

      <section style={{ maxWidth: T.maxw, margin: '0 auto', padding: '22px 32px 0' }}>
        <Link href="/shop" style={{ ...S.label, display: 'inline-block', marginBottom: 30 }}>← Back to shop</Link>
      </section>

      {/* HERO */}
      <section style={{ maxWidth: T.maxw, margin: '0 auto', padding: '0 32px 60px' }}>
        <div className="pdp-grid" style={grid}>
          <div className="pdp-gallery" style={gallery}>
            <div style={imgSide}>
              {product.badge && <span style={imageBadge}>{product.badge}</span>}
              {activeImage ? (
                <img src={activeImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <ProductVisual id={product.id} width={230} />
              )}
            </div>
            {images.length > 1 && (
              <div className="thumb-col" style={thumbCol}>
                {images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setActiveImage(src)}
                    style={{ ...thumbBtn, borderColor: activeImage === src ? T.clay : T.line, opacity: activeImage === src ? 1 : 0.5 }}
                    aria-label={`Show image ${i + 1}`}
                    aria-current={activeImage === src}
                  >
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={infoCol}>
            <p style={S.label}>{product.tagline}</p>
            <a href="#reviews" style={pdpRating}>
              {reviewData.count > 0 ? (
                <>
                  <span style={{ color: T.honey, letterSpacing: '1px' }}>{'★'.repeat(Math.round(reviewData.average))}{'☆'.repeat(5 - Math.round(reviewData.average))}</span>
                  {' '}{reviewData.average.toFixed(1)} · {reviewData.count} review{reviewData.count === 1 ? '' : 's'}
                </>
              ) : (
                'Be the first to review'
              )}
            </a>
            <h1 style={pdpTitle}>{product.name}</h1>
            <p style={pdpDesc}>{product.description}</p>

            <div style={pdpPrice}>${unitPrice} <span style={{ fontSize: 13, color: T.soft, fontFamily: T.sans }}>· {product.size}</span></div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={qtyWrap}>
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} style={qtyBtn} aria-label="Decrease quantity">−</button>
                <span style={qtyValue}>{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)} style={qtyBtn} aria-label="Increase quantity">+</button>
              </div>
              <button style={{ ...S.btnFill, flex: 1 }} onClick={handleAdd}>Add to cart</button>
            </div>

            <p style={badgeRow}>Free shipping over $50 · Butt · thighs · hips · Use 2–3x a week · Cruelty-free</p>

            {upsell && (
              <div style={upsellCard}>
                <div style={upsellVisual}><ProductVisual id={upsell.id} images={upsell.images} alt={upsell.name} width={54} /></div>
                <div style={{ flex: 1 }}>
                  <div style={S.label}>Go bigger</div>
                  <div style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 19, marginTop: 4 }}>{upsell.name}</div>
                  <div style={{ fontSize: 13, color: T.soft, marginTop: 2 }}>{upsell.tagline}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: T.serif, fontSize: 18, marginBottom: 8 }}>${upsell.price}</div>
                  <button onClick={handleAddUpsell} style={upsellAddBtn}>Add</button>
                </div>
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <AccordionRow title="How to use" open={openSection === 'how-to-use'} onToggle={() => toggleSection('how-to-use')}>
                {HOW_TO_USE.map(([h, p], i) => (
                  <div key={i} style={{ marginBottom: i < HOW_TO_USE.length - 1 ? 18 : 0, display: 'flex', gap: 14 }}>
                    <span style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.clay, fontSize: 20, flex: '0 0 22px' }}>{i + 1}</span>
                    <div>
                      <div style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 18, marginBottom: 4 }}>{h}</div>
                      <p style={{ fontSize: 13, color: T.soft, margin: 0 }}>{p}</p>
                    </div>
                  </div>
                ))}
              </AccordionRow>
              {product.ingredients && (
                <AccordionRow title="Ingredients" open={openSection === 'ingredients'} onToggle={() => toggleSection('ingredients')}>
                  <p style={{ fontSize: 14, color: T.soft, margin: 0 }}>{product.ingredients}</p>
                </AccordionRow>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div style={ticker}>
        <div style={tickerTrack}>
          {['softer', 'smoother', 'glowier', 'touchable', 'confident', 'softer', 'smoother', 'glowier', 'touchable', 'confident'].map((w, i) => (
            <React.Fragment key={i}>
              <span>{w}</span><em style={{ color: T.clay, fontStyle: 'italic', margin: '0 22px' }}>✶</em>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* BENEFITS */}
      <section style={{ ...band, borderTop: `1px solid ${T.line}` }}>
        <div style={{ ...S.wrap, textAlign: 'center' }}>
          <p style={S.label}>Why you'll love it</p>
          <h2 style={{ ...S.h2, marginTop: 14 }}>Skin that <span style={S.it}>actually glows.</span></h2>
          <div className="benefit-grid" style={benefitGrid}>
            {BENEFITS.map(([h, p], i) => (
              <div key={i} style={benefitCard}>
                <div style={{ fontFamily: T.serif, fontSize: 24, color: T.clay, marginBottom: 16 }}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 26, marginBottom: 8, lineHeight: 1.05 }}>{h}</div>
                <p style={{ fontSize: 15, color: T.soft, margin: 0 }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section style={{ ...band, background: T.blush }}>
        <div style={{ ...S.wrap, textAlign: 'center' }}>
          <p style={S.label}>What to expect</p>
          <h2 style={{ ...S.h2, marginTop: 14 }}>The glow-up timeline.</h2>
          <div className="timeline-grid" style={timelineGrid}>
            {TIMELINE.map(([when, h, p], i) => (
              <div key={i} style={timelineCard}>
                <div style={S.label}>{when}</div>
                <div style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 27, margin: '14px 0 6px' }}>{h}</div>
                <p style={{ fontSize: 14, color: T.soft, margin: 0 }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECEIPTS */}
      {RECEIPTS.length > 0 && (
        <section style={band}>
          <div style={{ ...S.wrap, textAlign: 'center' }}>
            <p style={S.label}>The receipts</p>
            <h2 style={{ ...S.h2, marginTop: 14 }}>Real people. <span style={S.it}>Real glow-ups.</span></h2>
            <p style={{ fontSize: 17, color: T.soft, maxWidth: '48ch', margin: '18px auto 0' }}>
              We're not here to gatekeep results.
              <br />
              <small style={{ fontSize: 13, fontStyle: 'italic' }}>Individual results vary — but the hype is real.</small>
            </p>
            <div className="receipts-grid" style={receiptsGrid}>
              {RECEIPTS.map((src, i) => (
                <div key={i} style={receiptCard}><img src={src} alt="Before and after" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} /></div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW TO */}
      <section style={{ ...band, background: T.ink, color: T.oat }}>
        <div style={{ ...S.wrap, textAlign: 'center' }}>
          <p style={{ ...S.label, color: T.blush }}>The ritual</p>
          <h2 style={{ ...S.h2, marginTop: 14, color: T.oat }}>How to <span style={{ ...S.it, color: T.blush }}>scrub it.</span></h2>
          <div className="how-grid" style={howGrid}>
            {HOW_TO_USE.map(([h, p], i) => (
              <div key={i} style={howCard}>
                <div style={{ fontFamily: T.serif, fontSize: 44, color: T.blush, lineHeight: 0.8 }}>{i + 1}</div>
                <div style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 26, margin: '14px 0 6px' }}>{h}</div>
                <p style={{ fontSize: 14, color: 'rgba(244,237,227,0.78)', margin: 0 }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" style={{ ...band, background: T.shell }}>
        <div style={{ ...S.wrap, textAlign: 'center' }}>
          <p style={S.label}>Loved by thousands</p>
          <h2 style={{ ...S.h2, marginTop: 14 }}>
            {reviewData.count > 0 ? (
              <><span style={{ color: T.honey }}>★★★★★</span> {reviewData.average.toFixed(1)} from {reviewData.count}+</>
            ) : (
              'Be the first to review.'
            )}
          </h2>

          {reviewData.reviews.length > 0 && (
            <div className="rev-grid" style={revGrid}>
              {reviewData.reviews.slice().reverse().slice(0, 3).map((r) => (
                <div key={r.id} style={revCard}>
                  <div style={{ color: T.honey, letterSpacing: '1px', marginBottom: 18 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  <p style={{ fontFamily: T.serif, fontSize: 23, lineHeight: 1.25, marginBottom: 20 }}>"{r.text}"</p>
                  <cite style={{ fontStyle: 'normal', fontSize: 13, color: T.soft }}>— {r.author}, Verified Buyer</cite>
                </div>
              ))}
            </div>
          )}

          <div style={reviewFormWrap}>
            <p style={{ ...S.label, marginBottom: 16 }}>Write a review</p>
            {reviewSubmitted ? (
              <p style={{ color: T.ink, fontSize: 14 }}>Thank you — your review has been submitted and will appear once it's approved.</p>
            ) : (
              <form onSubmit={handleReviewSubmit} style={{ textAlign: 'left', maxWidth: 420, margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                      style={starBtn}
                      aria-label={`${n} star${n === 1 ? '' : 's'}`}
                    >
                      {n <= reviewForm.rating ? '★' : '☆'}
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Share your experience…"
                  value={reviewForm.text}
                  onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                  style={reviewTextarea}
                  required
                />
                <input
                  placeholder="Your name"
                  value={reviewForm.author}
                  onChange={(e) => setReviewForm({ ...reviewForm, author: e.target.value })}
                  style={{ ...reviewInput, marginTop: 12 }}
                />
                {reviewError && <p style={{ color: '#a13d2b', fontSize: 13, marginTop: 12 }}>{reviewError}</p>}
                <button type="submit" disabled={reviewSubmitting} style={{ ...S.btnFill, width: '100%', marginTop: 16, opacity: reviewSubmitting ? 0.6 : 1 }}>
                  {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ ...band, background: T.shell }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <p style={S.label}>Good to know</p>
          <h2 style={{ ...S.h2, marginTop: 14 }}>The real questions.</h2>
          <div style={{ marginTop: 30, textAlign: 'left' }}>
            {FAQS.map(([q, a], i) => (
              <AccordionRow key={i} title={q} open={openFaq === i} onToggle={() => toggleFaq(i)}>
                <p style={{ fontSize: 15, color: T.soft, margin: 0 }}>{a}</p>
              </AccordionRow>
            ))}
          </div>
        </div>
      </section>

      {/* RELATED */}
      {related.length > 0 && (
        <section style={{ ...band, borderTop: `1px solid ${T.line}` }}>
          <div style={{ ...S.wrap, textAlign: 'center' }}>
            <p style={S.label}>Shop the full collection</p>
            <h2 style={{ ...S.h2, marginTop: 12 }}>More to <span style={S.it}>discover.</span></h2>
            <div className="related-grid" style={relatedGrid}>
              {related.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`} className="related-item" style={relatedCard}>
                  <div style={relatedImg}><ProductVisual id={p.id} images={p.images} alt={p.name} width={104} /></div>
                  <div style={relatedText}>
                    <div style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 18 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: T.soft, marginTop: 4 }}>${p.price}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CLOSING */}
      <section style={closing}>
        <p style={{ ...S.label, color: T.oat }}>One tub away</p>
        <h2 style={{ ...S.h2, marginTop: 16, color: '#fff', fontSize: 'clamp(44px,7vw,76px)' }}>
          Your booty called. <span style={{ ...S.it, color: T.blush }}>It wants the scrub.</span>
        </h2>
        <p style={{ fontSize: 18, margin: '16px 0 34px', color: 'rgba(255,255,255,0.9)' }}>Soft, smooth, glowing, confident.</p>
        <button onClick={handleAdd} style={{ ...S.btnFill, padding: '0 52px' }}>Add to cart — ${unitPrice}</button>
        <p style={{ marginTop: 18, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)' }}>
          Free shipping over $50
        </p>
      </section>

      <Marquee />
      <Footer />

      <CartDrawer {...c} onClose={() => c.setOpen(false)} />

      {/* Floating add-to-cart bar */}
      <div style={stickyBar}>
        <div className="sticky-bar-inner" style={stickyBarInner}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 18, color: T.oat, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(244,237,227,0.7)', marginTop: 2 }}>${unitPrice}</div>
          </div>
          <div className="sticky-bar-actions" style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <div style={stickyQtyWrap}>
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} style={stickyQtyBtn} aria-label="Decrease quantity">−</button>
              <span style={{ ...qtyValue, color: T.oat }}>{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} style={stickyQtyBtn} aria-label="Increase quantity">+</button>
            </div>
            <button onClick={handleAdd} style={stickyAddBtn}>Add to cart</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pdp-grid { grid-template-columns: 1fr 1fr; }
        .benefit-grid { grid-template-columns: repeat(3, 1fr); }
        .timeline-grid { grid-template-columns: repeat(3, 1fr); }
        .how-grid { grid-template-columns: repeat(3, 1fr); }
        .rev-grid { grid-template-columns: repeat(3, 1fr); }
        .receipts-grid { grid-template-columns: repeat(3, 1fr); }
        .related-grid { grid-template-columns: repeat(4, 1fr); }
        .related-item:nth-child(n + 2) { border-left: 1px solid ${T.line}; }
        .thumb-col { flex-direction: column; }
        .sticky-bar-inner { padding: 0 32px; }
        @media (max-width: 880px) {
          .benefit-grid { grid-template-columns: 1fr; }
          .timeline-grid { grid-template-columns: 1fr; }
          .how-grid { grid-template-columns: 1fr; }
          .rev-grid { grid-template-columns: 1fr; }
          .receipts-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 680px) {
          .pdp-grid { grid-template-columns: 1fr; }
          .pdp-gallery { flex-direction: column; }
          .thumb-col { flex-direction: row; }
          .related-grid { grid-template-columns: 1fr; }
          .related-item { border-left: none; }
          .related-item:nth-child(n + 2) { border-left: none; border-top: 1px solid ${T.line}; }
          .sticky-bar-inner { padding: 0 16px; gap: 12px; }
          .sticky-bar-actions { gap: 10px; }
        }
      `}</style>
    </div>
  );
}

const grid = { display: 'grid', gap: 60, alignItems: 'start' };
const gallery = { display: 'flex', gap: 14, position: 'sticky', top: 100, alignSelf: 'start' };
const imgSide = { position: 'relative', background: T.blush, borderRadius: 28, aspectRatio: '4/5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flex: 1, minWidth: 0, boxShadow: T.shadow };
const imageBadge = {
  position: 'absolute', top: 14, right: 14, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
  color: '#fff', background: T.clay, padding: '6px 12px', zIndex: 1, fontFamily: T.sans, fontWeight: 600, borderRadius: 30,
};
const thumbCol = { display: 'flex', gap: 12, flexShrink: 0 };
const thumbBtn = { width: 72, height: 72, borderRadius: 16, padding: 0, border: '2px solid', cursor: 'pointer', overflow: 'hidden', background: T.blush, flexShrink: 0, transition: '.25s', boxShadow: T.shadowSm };
const infoCol = {};
const pdpRating = {
  display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, color: T.soft, marginBottom: 20,
  fontFamily: T.sans, width: 'fit-content',
};
const pdpTitle = { fontFamily: T.serif, fontWeight: 400, fontSize: 'clamp(40px,5vw,60px)', lineHeight: 0.98, marginBottom: 16 };
const pdpDesc = { fontSize: 17, color: T.soft, maxWidth: '42ch', marginBottom: 24, lineHeight: 1.6 };
const pdpPrice = { fontFamily: T.serif, fontWeight: 400, fontSize: 30, marginBottom: 20 };
const qtyWrap = { display: 'flex', alignItems: 'center', border: `1px solid ${T.line}`, borderRadius: 50, background: T.shell, height: 56 };
const qtyBtn = { width: 44, height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: T.ink };
const qtyValue = { width: 30, textAlign: 'center', fontSize: 14, fontWeight: 500 };
const badgeRow = { fontSize: 13, color: T.soft, marginTop: 4, marginBottom: 8 };

const upsellCard = {
  display: 'flex', alignItems: 'center', gap: 14, border: `1px solid ${T.line}`, borderRadius: 20,
  padding: '16px', marginTop: 24, background: T.shell,
};
const upsellVisual = { width: 54, height: 54, flexShrink: 0, overflow: 'hidden', background: T.blush, borderRadius: 12 };
const upsellAddBtn = {
  fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', border: 'none', background: T.ink, color: T.oat,
  padding: '10px 18px', borderRadius: 30, cursor: 'pointer', fontFamily: T.sans, fontWeight: 600,
};

const band = { padding: '90px 0' };

const accordionRow = { borderBottom: `1px solid ${T.line}` };
const accordionHeader = { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.serif, fontSize: 20, color: T.ink, textAlign: 'left' };
const accordionIcon = { fontSize: 20, color: T.clay, fontFamily: T.sans, fontWeight: 300 };
const accordionBody = { overflow: 'hidden', transition: 'max-height 0.35s ease, opacity 0.3s ease, padding-bottom 0.35s ease' };

const benefitGrid = { display: 'grid', gap: 20, marginTop: 56, textAlign: 'left' };
const benefitCard = { background: T.shell, borderRadius: 24, padding: '38px 32px', boxShadow: T.shadowSm };

const timelineGrid = { display: 'grid', gap: 24, marginTop: 56, textAlign: 'left' };
const timelineCard = { background: T.oat, borderRadius: 24, padding: '36px 32px' };

const howGrid = { display: 'grid', gap: 30, marginTop: 54, textAlign: 'left' };
const howCard = { paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.2)' };

const receiptsGrid = { display: 'grid', gap: 18, marginTop: 54 };
const receiptCard = { borderRadius: 20, overflow: 'hidden', boxShadow: T.shadowSm, background: T.shell };

const revGrid = { display: 'grid', gap: 22, marginTop: 54, textAlign: 'left' };
const revCard = { background: T.oat, borderRadius: 24, padding: 34 };
const reviewFormWrap = { marginTop: 56, paddingTop: 40, borderTop: `1px solid ${T.line}`, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' };
const starBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 26, color: T.honey, lineHeight: 1, padding: 4 };
const reviewInput = {
  width: '100%', height: 48, padding: '0 16px', border: `1px solid ${T.line}`, background: T.shell, borderRadius: 12,
  fontFamily: T.sans, fontSize: 14, color: T.ink, outline: 'none', boxSizing: 'border-box',
};
const reviewTextarea = {
  width: '100%', minHeight: 100, padding: '14px 16px', border: `1px solid ${T.line}`, background: T.shell, borderRadius: 12,
  fontFamily: T.sans, fontSize: 14, color: T.ink, outline: 'none', boxSizing: 'border-box', resize: 'vertical',
};

const relatedGrid = { display: 'grid', marginTop: 50, border: `1px solid ${T.line}`, borderRadius: 20, overflow: 'hidden' };
const relatedCard = { textAlign: 'center', display: 'block', textDecoration: 'none', color: 'inherit' };
const relatedImg = { aspectRatio: '1/1', display: 'block', width: '100%', overflow: 'hidden', background: T.blush };
const relatedText = { padding: '16px 20px 40px' };

const ticker = { borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, overflow: 'hidden', padding: '16px 0', background: T.shell };
const tickerTrack = { display: 'inline-block', whiteSpace: 'nowrap', fontFamily: T.serif, fontSize: 22, color: T.ink, paddingLeft: '100%' };

const closing = { background: T.clay, color: T.oat, textAlign: 'center', padding: '120px 32px' };

const stickyBar = {
  position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 150,
  background: T.ink, boxShadow: '0 -1px 0 rgba(0,0,0,0.6)',
  padding: '14px 0',
};
const stickyBarInner = {
  maxWidth: T.maxw, margin: '0 auto',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
};
const stickyQtyWrap = { display: 'flex', alignItems: 'center', border: `1px solid ${T.dline}`, borderRadius: 50, height: 40 };
const stickyQtyBtn = { width: 32, height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: T.oat };
const stickyAddBtn = {
  ...S.btnFill, background: T.oat, color: T.ink, height: 40, padding: '0 22px',
  whiteSpace: 'nowrap', flexShrink: 0,
};
