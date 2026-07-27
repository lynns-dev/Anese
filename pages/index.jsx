import React from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import CartDrawer from '../components/CartDrawer';
import ProductVisual from '../components/ProductVisual';
import Marquee from '../components/Marquee';
import Footer from '../components/Footer';
import { getFeaturedProducts } from '../lib/products';
import { useCart } from '../lib/useCart';
import { useAllReviews } from '../lib/useReviews';
import { T, S } from '../lib/theme';

const BANNER_MESSAGES = ['Free shipping $50+', '15% off with code FIRST15'];

const BENEFITS = [
  ['Smoother texture', "Walnut grain buffs away rough, uneven, dull skin — what's left feels like a compliment."],
  ['Lit-from-within glow', 'Shea, jojoba & rosehip hydrate while you exfoliate, so you rinse off glowing, not stripped.'],
  ['Made for the booty', 'Formulated for butt, thighs & hips — the spots most body scrubs completely ignore.'],
];

const GALLERY_IMAGES = [
  '/images/anese-before-after-1.jpg',
  '/images/anese-before-after-2.jpg',
  '/images/anese-before-after-3.jpg',
  '/images/anese-before-after-4.jpg',
];

export default function HomePage() {
  const c = useCart();
  const featured = getFeaturedProducts();
  const reviewsByProduct = useAllReviews();
  const siteReviews = React.useMemo(() => {
    const all = Object.values(reviewsByProduct).flatMap((r) => r.reviews || []);
    const count = all.length;
    const average = count === 0 ? 0 : Math.round((all.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10;
    const recommendPct = count === 0 ? 0 : Math.round((all.filter((r) => r.rating >= 4).length / count) * 100);
    return { all, count, average, recommendPct };
  }, [reviewsByProduct]);
  const [bannerIndex, setBannerIndex] = React.useState(0);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const id = setInterval(() => {
      setBannerIndex((i) => (i + 1) % BANNER_MESSAGES.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div>
      <div style={announce}>
        <div
          style={{
            display: 'flex',
            width: `${BANNER_MESSAGES.length * 100}%`,
            transform: `translateX(-${(100 / BANNER_MESSAGES.length) * bannerIndex}%)`,
            transition: 'transform 0.6s ease',
          }}
        >
          {BANNER_MESSAGES.map((msg, i) => (
            <span key={i} style={{ width: `${100 / BANNER_MESSAGES.length}%` }}>{msg}</span>
          ))}
        </div>
      </div>
      {/* HERO */}
      <section style={heroWrap}>
        <Header cartCount={c.count} onCartClick={() => c.setOpen(true)} overlay scrolled={scrolled} />
        <div style={heroBg}>
          <div style={heroScrim} />
          <div style={heroContent}>
            <span style={{ ...S.label, display: 'block', marginBottom: 26, color: T.blush }}>Walnut grain body scrub</span>
            <h1 style={heroH1}>Skin so soft it's <span style={{ ...S.it, color: T.blush }}>basically a flex.</span></h1>
            <p style={heroSub}>The scrub that's not here to "fix" your body — just to make it feel ridiculously good. Your booty's new hype girl.</p>
            {siteReviews.count > 0 && (
              <div style={hrate}>
                <span style={{ letterSpacing: '2px', color: T.honey }}>{'★'.repeat(Math.round(siteReviews.average))}{'☆'.repeat(5 - Math.round(siteReviews.average))}</span>
                {' '}{siteReviews.average.toFixed(1)} · {siteReviews.count} review{siteReviews.count === 1 ? '' : 's'}
              </div>
            )}
            <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
              <button style={heroBtn} onClick={() => c.add(featured[0])}>Shop — ${featured[0]?.price}</button>
              <a href="#shop" style={heroLink}>Meet the scrub</a>
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

      {/* COLLECTION */}
      <section id="shop" style={band}>
        <div style={{ ...S.wrap, textAlign: 'center' }}>
          <p style={S.label}>The collection</p>
          <h2 style={{ ...S.h2, marginTop: 12 }}>Glow that's <span style={S.it}>earned in the shower.</span></h2>
          <div className="col-grid" style={colGrid}>
            {featured.map((p) => (
              <div key={p.id} className="col-item" style={pcard}>
                <Link href={`/product/${p.id}`} style={pimg}>
                  {p.badge && <span style={badge}>{p.badge}</span>}
                  <ProductVisual id={p.id} images={p.images} alt={p.name} width={104} />
                </Link>
                <div style={pcardText}>
                  <Link href={`/product/${p.id}`} style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 19 }}>{p.name}</Link>
                  <div style={pnotes}>{p.tagline}</div>
                  <div style={{ fontSize: 13 }}>${p.price} · {p.size}</div>
                  <button style={{ ...S.btnFill, width: '100%', marginTop: 18 }} onClick={() => c.add(p)}>Add to cart</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40 }}><Link href="/shop" style={S.link}>View all</Link></div>
        </div>
      </section>

      {/* BENEFITS */}
      <section style={{ ...band, background: T.shell, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
        <div style={{ ...S.wrap, textAlign: 'center' }}>
          <p style={S.label}>Why you'll love it</p>
          <h2 style={{ ...S.h2, marginTop: 12 }}>Skin that <span style={S.it}>actually glows.</span></h2>
          <div className="ben-grid" style={benGrid}>
            {BENEFITS.map(([h, p], i) => (
              <div key={i} style={benCard}>
                <div style={{ fontFamily: T.serif, fontSize: 24, color: T.clay, marginBottom: 16 }}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 26, marginBottom: 8, lineHeight: 1.05 }}>{h}</div>
                <p style={{ fontSize: 15, color: T.soft, margin: 0 }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section style={band}>
        <div style={{ ...S.wrap, textAlign: 'center' }}>
          <p style={S.label}>As worn</p>
          <h2 style={{ ...S.h2, marginTop: 12 }}>Real skin, <span style={S.it}>real glow.</span></h2>
          <div className="gal-grid" style={galGrid}>
            {GALLERY_IMAGES.map((src, i) => (
              <div key={i} style={galCard}>
                <img src={src} alt="Anese customer" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" style={{ ...band, background: T.shell, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
        <div style={{ ...S.wrap, textAlign: 'center' }}>
          <p style={S.label}>The verdict</p>
          <h2 style={{ ...S.h2, marginTop: 12 }}>Loved by <span style={S.it}>thousands.</span></h2>
          {siteReviews.count === 0 ? (
            <p style={{ color: T.soft, fontSize: 14, marginTop: 42 }}>No reviews yet — be the first to share yours on any product page.</p>
          ) : (
            <>
              <div style={{ marginTop: 42 }}>
                <div style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 56, lineHeight: 1 }}>{siteReviews.average.toFixed(1)}</div>
                <div style={{ color: T.honey, letterSpacing: '3px', fontSize: 14, margin: '6px 0 4px' }}>{'★'.repeat(Math.round(siteReviews.average))}{'☆'.repeat(5 - Math.round(siteReviews.average))}</div>
                <div style={{ fontSize: 12, color: T.soft }}>{siteReviews.count} review{siteReviews.count === 1 ? '' : 's'} · {siteReviews.recommendPct}% recommend</div>
              </div>
              <div className="rev-grid" style={revGrid}>
                {siteReviews.all.slice().reverse().slice(0, 3).map((r) => (
                  <div key={r.id} style={rev}>
                    <div style={{ color: T.honey, letterSpacing: '1.5px', fontSize: 12, marginBottom: 14 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                    <p style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 19, lineHeight: 1.4, marginBottom: 16 }}>"{r.text}"</p>
                    <cite style={{ fontStyle: 'normal', fontSize: 12, color: T.soft }}>— {r.author}, Verified Buyer</cite>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* RITUAL */}
      <section style={{ ...band, background: T.ink, color: T.oat, textAlign: 'center' }}>
        <div style={S.wrap}>
          <p style={{ ...S.label, color: T.blush }}>The ritual</p>
          <h2 style={{ ...S.h2, color: T.oat, marginTop: 12 }}>How to <span style={{ ...S.it, color: T.blush }}>scrub it.</span></h2>
          <div className="rit-grid" style={ritGrid}>
            {[
              ['1', 'Hop in the shower', "On wet skin, scoop two moist fingers' worth onto your target area."],
              ['2', 'Massage in circles', 'Work it into booty, thighs, hips — wherever you want the glow.'],
              ['3', 'Rinse & repeat', "2–3x a week. A small scoop goes a long way."],
            ].map(([n, h, p], i) => (
              <div key={i}>
                <div style={{ fontFamily: T.serif, fontSize: 44, color: T.blush, lineHeight: 0.8 }}>{n}</div>
                <h4 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 24, margin: '14px 0 6px' }}>{h}</h4>
                <p style={{ fontSize: 14, color: 'rgba(244,237,227,0.78)', maxWidth: '32ch', margin: '0 auto' }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section style={{ ...band, textAlign: 'center' }}>
        <p style={S.label}>The list</p>
        <h2 style={{ ...S.h2, marginTop: 12 }}>One tub away, <span style={S.it}>told softly.</span></h2>
        <p style={{ color: T.soft, fontSize: 15, margin: '16px auto 28px', maxWidth: '40ch' }}>Early access, restock alerts, 15% off your first order.</p>
        <form style={newsForm} onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="Email address" aria-label="email" style={newsInput} />
          <button type="submit" style={newsSubmit}>Subscribe</button>
        </form>
      </section>

      <Marquee />
      <Footer />

      <CartDrawer {...c} onClose={() => c.setOpen(false)} />

      <style jsx>{`
        .col-grid { grid-template-columns: repeat(4, 1fr); }
        .ben-grid { grid-template-columns: repeat(3, 1fr); }
        .gal-grid { grid-template-columns: repeat(4, 1fr); }
        .rev-grid { grid-template-columns: repeat(3, 1fr); }
        .rit-grid { grid-template-columns: repeat(3, 1fr); }

        @media (max-width: 880px) {
          .col-grid { grid-template-columns: repeat(2, 1fr); }
          .ben-grid { grid-template-columns: 1fr; }
          .gal-grid { grid-template-columns: 1fr 1fr; }
          .rev-grid { grid-template-columns: 1fr; }
          .rit-grid { grid-template-columns: 1fr; gap: 34px; }
        }
        @media (max-width: 680px) {
          .col-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

const announce = { textAlign: 'center', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.oat, background: T.ink, padding: '10px 20px', overflow: 'hidden' };
const heroWrap = { position: 'relative' };
const heroBg = {
  position: 'relative', height: '88vh', minHeight: 560,
  backgroundImage: 'url(/images/anese-lifestyle-hero.png)', backgroundSize: 'cover', backgroundPosition: 'center 40%',
  display: 'flex', alignItems: 'flex-end',
};
const heroScrim = {
  position: 'absolute', inset: 0,
  background: 'linear-gradient(100deg, rgba(46,38,32,0.7) 0%, rgba(46,38,32,0.38) 42%, rgba(46,38,32,0.05) 68%)',
};
const heroContent = { position: 'relative', maxWidth: T.maxw, width: '100%', margin: '0 auto', padding: '0 32px 72px', color: T.oat };
const heroH1 = { fontFamily: T.serif, fontWeight: 400, fontSize: 'clamp(40px,6.5vw,78px)', lineHeight: 0.98, marginBottom: 20, color: T.oat, maxWidth: '17ch' };
const heroSub = { fontSize: 17, color: 'rgba(244,237,227,0.9)', maxWidth: '40ch', marginBottom: 26 };
const hrate = { display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'rgba(244,237,227,0.9)', marginBottom: 30 };
const heroBtn = { ...S.btnFill, background: T.oat, color: T.ink };
const heroLink = { ...S.link, color: T.oat, borderBottom: 'none' };
const ticker = { borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, overflow: 'hidden', padding: '16px 0', background: T.shell };
const tickerTrack = { display: 'inline-block', whiteSpace: 'nowrap', fontFamily: T.serif, fontSize: 22, color: T.ink, paddingLeft: '100%' };
const band = { padding: '90px 0' };
const colGrid = { display: 'grid', marginTop: 50, gap: 24 };
const pcard = { textAlign: 'center', background: T.shell, borderRadius: 20, overflow: 'hidden', boxShadow: T.shadowSm };
const badge = { position: 'absolute', top: 14, left: 14, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', background: T.clay, padding: '5px 10px', zIndex: 1, borderRadius: 30, fontWeight: 600 };
const pimg = { position: 'relative', aspectRatio: '1/1', display: 'block', overflow: 'hidden', width: '100%', background: T.blush };
const pcardText = { padding: '20px 24px 28px' };
const pnotes = { fontSize: 12, color: T.soft, margin: '6px 0 6px' };
const benGrid = { display: 'grid', gap: 20, marginTop: 56, textAlign: 'left' };
const benCard = { background: T.oat, borderRadius: 24, padding: '38px 32px' };
const galGrid = { display: 'grid', gap: 16, marginTop: 50 };
const galCard = { borderRadius: 20, overflow: 'hidden', aspectRatio: '4/5', boxShadow: T.shadowSm };
const revGrid = { display: 'grid', gap: 22, marginTop: 48, textAlign: 'left' };
const rev = { padding: '30px 28px', background: T.oat, borderRadius: 20 };
const ritGrid = { display: 'grid', gap: 44, marginTop: 54 };
const newsForm = { display: 'flex', maxWidth: 420, margin: '0 auto', borderBottom: `1px solid ${T.ink}`, alignItems: 'center' };
const newsInput = { flex: 1, height: 52, border: 'none', background: 'transparent', color: T.ink, padding: '0 4px', fontSize: 15, fontFamily: T.sans, outline: 'none' };
const newsSubmit = { background: 'none', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.sans, color: T.clayDeep };
