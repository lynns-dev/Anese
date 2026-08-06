import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Header from '../components/Header';
import CartDrawer from '../components/CartDrawer';
import ProductVisual from '../components/ProductVisual';
import Footer from '../components/Footer';
import Seo, { SITE_URL } from '../components/Seo';
import { getFeaturedProducts } from '../lib/products';
import { useCart } from '../lib/useCart';
import { useAllReviews } from '../lib/useReviews';
import { T, S } from '../lib/theme';

// Minimal line-art icons for the trust badges — matching the site's thin-
// stroke aesthetic (see ProductVisual's SVG fallbacks) rather than emoji
// or generic checkmarks, so the badges read as designed, not default.
const iconProps = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: T.ink, strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
function AwardIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="5.5" />
      <path d="M8.5 12.5 7 21l5-2.5L17 21l-1.5-8.5" />
    </svg>
  );
}
function ShieldCheckIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 2.5 4.5 5.5V11c0 5 3.2 8.4 7.5 10.5 4.3-2.1 7.5-5.5 7.5-10.5V5.5L12 2.5Z" />
      <path d="M8.5 12 11 14.5l4.5-5" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="7" width="12" height="9" />
      <path d="M14 10h4l3.5 3.5V16h-7.5" />
      <circle cx="6.5" cy="18.5" r="1.6" />
      <circle cx="17" cy="18.5" r="1.6" />
    </svg>
  );
}

// SiteNavigationElement + WebSite structured data — the standard signal
// Google uses (alongside actual site structure/click-through data) to
// decide which pages to show as sitelinks under a search result. Shop and
// That Booty Tho are listed first since those are the two pages requested
// as the priority "top links" — order here reflects intended priority,
// though Google ultimately chooses sitelinks itself; nothing in Search
// guarantees a specific page appears.
const HOME_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', name: 'ANESE', url: SITE_URL },
    {
      '@type': 'SiteNavigationElement',
      name: ['Shop', 'That Booty Tho', 'Before & After'],
      url: [`${SITE_URL}/shop`, `${SITE_URL}/product/that-booty-tho`, `${SITE_URL}/#before-after`],
    },
  ],
};

const BANNER_MESSAGES = ['Free shipping $50+', '15% off with code FIRST15'];

const BENEFITS = [
  ['Smoother texture', "Walnut grain buffs away rough, uneven, dull skin — what's left feels like a compliment."],
  ['Lit-from-within glow', 'Shea, jojoba & rosehip hydrate while you exfoliate, so you rinse off glowing, not stripped.'],
  ['Made for the booty', 'Formulated for butt, thighs & hips — the spots most body scrubs completely ignore.'],
];

const CONCERNS = [
  'Hyperpigmentation', 'Acne & breakouts', 'Keratosis pilaris', 'Stretch marks',
  'Bumpy or rough skin', 'Friction irritation',
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
      <Seo path="/" />
      <Head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_JSON_LD) }}
        />
      </Head>
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
        <div className="hero-bg" style={heroBg}>
          <div style={heroContent}>
            <span style={{ ...S.label, display: 'block', marginBottom: 26, color: T.white }}>Walnut grain body scrub</span>
            <h1 style={heroH1}>Award Winning <span style={{ ...S.it, color: T.white }}>Skincare</span> for your Butt</h1>
            <p style={heroSub}>Clean and effective skincare for your butt's unique skincare needs.</p>
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

      {/* TRUST BADGES — borrows the credibility signals competitors lean on
          (review volume, guarantee, free shipping) right where a first-time
          visitor lands, before they've scrolled to the dedicated reviews
          section further down. Custom minimal line icons (not emoji/generic
          checkmarks) so each badge reads as a deliberate card, not a list. */}
      <section style={trustBar}>
        <div className="trust-row" style={trustRow}>
          {siteReviews.count > 0 && (
            <div style={trustItem}>
              <AwardIcon />
              <div>
                <div style={trustItemTitle}>{siteReviews.average.toFixed(1)} rating</div>
                <div style={trustItemSub}>{siteReviews.count}+ reviews</div>
              </div>
            </div>
          )}
          <div style={trustItem}>
            <ShieldCheckIcon />
            <div>
              <div style={trustItemTitle}>30-day guarantee</div>
              <div style={trustItemSub}>Money back, no hassle</div>
            </div>
          </div>
          <div style={trustItem}>
            <TruckIcon />
            <div>
              <div style={trustItemTitle}>Free shipping</div>
              <div style={trustItemSub}>On orders over $50</div>
            </div>
          </div>
        </div>
      </section>

      {/* MADE FOR YOU — speaks directly to the specific skin concerns that
          bring someone to a booty-scrub site in the first place, instead of
          only generic "glow" language. */}
      <section style={{ ...band, padding: '80px 0', textAlign: 'center' }}>
        <div style={S.wrap}>
          <p style={S.label}>You're in the right place</p>
          <h2 style={{ ...S.h2, marginTop: 14 }}>
            We're made for you if <span style={S.it}>you deal with:</span>
          </h2>
          <div className="concerns-grid" style={concernsGrid}>
            {CONCERNS.map((c) => (
              <div key={c} style={concernChip}>{c}</div>
            ))}
          </div>
          <p style={{ fontSize: 14, color: T.soft, marginTop: 30 }}>
            ...and more. If it's on your butt, thighs, or hips, it's on our radar.
          </p>
        </div>
      </section>

      {/* TICKER */}
      <div style={ticker}>
        <div className="ticker-track" style={tickerTrack}>
          {['softer', 'smoother', 'glowier', 'touchable', 'confident', 'softer', 'smoother', 'glowier', 'touchable', 'confident'].map((w, i) => (
            <React.Fragment key={i}>
              <span>{w}</span><em style={{ color: T.ink, fontStyle: 'italic', margin: '0 22px' }}>✶</em>
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
                  <Link href={`/product/${p.id}`} style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 16 }}>{p.name}</Link>
                  <div style={{ ...pnotes, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em' }}>{p.tagline}</div>
                  {reviewsByProduct[p.id]?.count > 0 && (
                    <div style={{ ...ratingRow, fontSize: 12 }}>
                      <span style={{ letterSpacing: '1.5px', color: T.ink }}>{'★'.repeat(Math.round(reviewsByProduct[p.id].average))}{'☆'.repeat(5 - Math.round(reviewsByProduct[p.id].average))}</span>
                      {' '}{reviewsByProduct[p.id].average.toFixed(1)} ({reviewsByProduct[p.id].count})
                    </div>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>
                    ${p.price}
                  </div>
                  <button style={{ ...S.btnFill, width: '100%', marginTop: 18 }} onClick={() => c.add(p)}>Add to cart</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40 }}><Link href="/shop" style={S.link}>View all</Link></div>
        </div>
      </section>

      {/* LIFESTYLE DUO */}
      <section className="lifestyle-duo" style={{ ...S.wrap, ...lifestyleDuo }}>
        <div style={lifestyleCol}>
          <img src="/images/anese-lifestyle-1.png" alt="Anese lifestyle" style={lifestyleImg} />
        </div>
        <div style={lifestyleCol}>
          <img src="/images/anese-lifestyle-3.png" alt="Anese lifestyle" style={lifestyleImg} />
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
                <div style={{ fontFamily: T.serif, fontSize: 24, color: T.ink, marginBottom: 16 }}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 26, marginBottom: 8, lineHeight: 1.05 }}>{h}</div>
                <p style={{ fontSize: 15, color: T.soft, margin: 0 }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="before-after" style={band}>
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
          <p style={{ ...S.label, color: T.white }}>The ritual</p>
          <h2 style={{ ...S.h2, color: T.oat, marginTop: 12 }}>How to <span style={{ ...S.it, color: T.white }}>scrub it.</span></h2>
          <div className="rit-grid" style={ritGrid}>
            {[
              ['1', 'Hop in the shower', "On wet skin, scoop two moist fingers' worth onto your target area."],
              ['2', 'Massage in circles', 'Work it into booty, thighs, hips — wherever you want the glow.'],
              ['3', 'Rinse & repeat', "2–3x a week. A small scoop goes a long way."],
            ].map(([n, h, p], i) => (
              <div key={i}>
                <div style={{ fontFamily: T.serif, fontSize: 44, color: T.white, lineHeight: 0.8 }}>{n}</div>
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

      <Footer />

      <CartDrawer {...c} onClose={() => c.setOpen(false)} />

      <style jsx>{`
        .ticker-track { animation: anese-ticker 22s linear infinite; }
        @keyframes anese-ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .col-grid { grid-template-columns: repeat(4, 1fr); }
        .lifestyle-duo { grid-template-columns: 1fr 1fr; }
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
          .lifestyle-duo { grid-template-columns: 1fr; }
          .hero-bg { background-position: 18% 30% !important; }
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
const heroContent = { position: 'relative', maxWidth: T.maxw, width: '100%', margin: '0 auto', padding: '0 32px 72px', color: T.oat };
const heroH1 = { fontFamily: T.serif, fontWeight: 400, fontSize: 'clamp(40px,6.5vw,78px)', lineHeight: 0.98, marginBottom: 20, color: T.oat, maxWidth: '17ch' };
const heroSub = { fontSize: 17, color: 'rgba(244,237,227,0.9)', maxWidth: '40ch', marginBottom: 26 };
const hrate = { display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'rgba(244,237,227,0.9)', marginBottom: 30 };
const heroBtn = { ...S.btnFill, background: T.oat, color: T.ink };
const heroLink = { ...S.link, color: T.oat, borderBottom: 'none' };
const trustBar = { padding: '36px 32px', background: T.shell, borderBottom: `1px solid ${T.line}` };
const trustRow = { maxWidth: T.maxw, margin: '0 auto', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 16 };
const trustItem = {
  display: 'flex', alignItems: 'center', gap: 14, fontFamily: T.sans, color: T.ink,
  background: T.white, border: `1px solid ${T.line}`, borderRadius: 16, padding: '16px 22px',
  boxShadow: T.shadowSm, flex: '1 1 220px', maxWidth: 320,
};
const trustItemTitle = { fontSize: 15, fontWeight: 700 };
const trustItemSub = { fontSize: 12, color: T.soft, marginTop: 2 };
const concernsGrid = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 40 };
const concernChip = {
  fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.ink,
  background: T.shell, border: `1px solid ${T.line}`, borderRadius: 999, padding: '12px 22px',
};
const ticker = { borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, overflow: 'hidden', padding: '16px 0', background: T.shell };
const tickerTrack = { display: 'inline-block', whiteSpace: 'nowrap', fontFamily: T.serif, fontSize: 22, color: T.ink };
const band = { padding: '90px 0' };
const colGrid = { display: 'grid', marginTop: 50, gap: 24 };
const lifestyleDuo = { display: 'grid', gap: 24, paddingTop: 0, paddingBottom: 90 };
const lifestyleCol = { aspectRatio: '16/9', overflow: 'hidden', background: T.white };
const lifestyleImg = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
const pcard = { textAlign: 'center', overflow: 'hidden' };
const badge = { position: 'absolute', top: 14, left: 14, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', background: T.clay, padding: '5px 10px', zIndex: 1, borderRadius: 30, fontWeight: 600 };
const pimg = { position: 'relative', aspectRatio: '1/1', display: 'block', overflow: 'hidden', width: '100%', background: T.white };
const pcardText = { padding: '20px 24px 28px' };
const pnotes = { fontSize: 12, color: T.soft, margin: '6px 0 6px' };
const ratingRow = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: T.soft, marginBottom: 8, fontFamily: T.sans };
const benGrid = { display: 'grid', gap: 20, marginTop: 56, textAlign: 'left' };
const benCard = { background: T.oat, borderRadius: 24, padding: '38px 32px' };
const galGrid = { display: 'grid', gap: 16, marginTop: 50 };
const galCard = { overflow: 'hidden', aspectRatio: '4/5', boxShadow: T.shadowSm };
const revGrid = { display: 'grid', gap: 22, marginTop: 48, textAlign: 'left' };
const rev = { padding: '30px 28px', background: T.oat, borderRadius: 20 };
const ritGrid = { display: 'grid', gap: 44, marginTop: 54 };
const newsForm = { display: 'flex', maxWidth: 420, margin: '0 auto', borderBottom: `1px solid ${T.ink}`, alignItems: 'center' };
const newsInput = { flex: 1, height: 52, border: 'none', background: 'transparent', color: T.ink, padding: '0 4px', fontSize: 15, fontFamily: T.sans, outline: 'none' };
const newsSubmit = { background: 'none', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.sans, color: T.ink };
