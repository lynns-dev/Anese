import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Header from '../components/Header';
import CartDrawer from '../components/CartDrawer';
import Footer from '../components/Footer';
import Seo, { SITE_URL } from '../components/Seo';
import { getFeaturedProducts } from '../lib/products';
import { useCart } from '../lib/useCart';
import { useAllReviews } from '../lib/useReviews';
import { T, S } from '../lib/theme';
import {
  ConcernExplorer, IngredientExplorer, UgcVideoStrip, DemoSteps, RitualCards, MythFacts, QuizBand, Faq, HOME_FAQS, Lightbox, HomeSectionsStyles,
} from '../components/HomeSections';
import AskBox from '../components/AskBox';
import NewsletterSignup from '../components/NewsletterSignup';
import ProductGrid from '../components/ProductGrid';
import { ANNOUNCEMENTS, HOW_TO } from '../lib/brandContent';

// Minimal line-art icons for the trust badges — matching the site's thin-
// stroke aesthetic (see ProductVisual's SVG fallbacks) rather than emoji
// or generic checkmarks, so the badges read as designed, not default.
const iconProps = { width: 44, height: 44, viewBox: '0 0 24 24', fill: 'none', stroke: T.ink, strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
function ChatIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 5.5h16v10H10l-4.5 3.5v-3.5H4z" />
      <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" />
    </svg>
  );
}
function JarIcon() {
  return (
    <svg {...iconProps}>
      <rect x="5" y="4" width="14" height="4" rx="1" />
      <path d="M6 8h12v10.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 18.5z" />
      <path d="M9 13h6" />
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
      name: ['Shop', 'That Booty Tho', 'Ask Us Anything', 'Shower Rituals', 'Real Stories'],
      url: [`${SITE_URL}/shop`, `${SITE_URL}/product/that-booty-tho`, `${SITE_URL}/questions`, `${SITE_URL}/rituals`, `${SITE_URL}/stories`],
    },
  ],
};

const BANNER_MESSAGES = ANNOUNCEMENTS;

const UGC_VIDEOS = [
  '/videos/anese-ugc-1.mp4',
  '/videos/anese-ugc-2.mp4',
  '/videos/anese-ugc-3.mp4',
  '/videos/anese-ugc-4.mp4',
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
  const [lightboxIndex, setLightboxIndex] = React.useState(null);
  const closeLightbox = React.useCallback(() => setLightboxIndex(null), []);

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
            <span key={i} className="announce-msg" style={{ width: `${100 / BANNER_MESSAGES.length}%` }}>
              <span className="announce-long">{msg.text}</span>
              <span className="announce-short">{msg.short}</span>
            </span>
          ))}
        </div>
      </div>
      {/* HERO */}
      <section style={heroWrap}>
        <Header cartCount={c.count} onCartClick={() => c.setOpen(true)} overlay overlayTone="dark" scrolled={scrolled} />
        <div className="hero-bg" style={heroBg}>
          <div style={heroContent}>
            <span style={{ ...S.label, display: 'block', marginBottom: 22 }}>Booty scrubs, serums &amp; body care</span>
            <h1 style={heroH1}>
              Butt skincare, <span style={S.it}>minus the awkward.</span>
            </h1>
            <p style={heroSub}>
              Gentle scrubs and body care for your butt, thighs and hips. No judgment, no complicated routine — just a little help figuring out what feels right for you.
            </p>
            <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/product/that-booty-tho" style={heroBtn}>Shop the scrub — ${featured[0]?.price}</Link>
              <a href="#ask" style={heroLink}>Got a question? Ask us</a>
            </div>
          </div>
        </div>
      </section>

      {/* REASSURANCE STRIP */}
      <section style={trustBar}>
        <div className="trust-row" style={trustRow}>
          <div style={trustItem}>
            <ChatIcon />
            <div>
              <div style={trustItemTitle}>No judgment, ever</div>
              <div style={trustItemSub}>Bumps, breakouts, texture: totally normal. Totally talkable.</div>
            </div>
          </div>
          <div style={trustItem}>
            <TruckIcon />
            <div>
              <div style={trustItemTitle}>Ships in 1 business day</div>
              <div style={trustItemSub}>Free on orders $50+</div>
            </div>
          </div>
          <div style={trustItem}>
            <JarIcon />
            <div>
              <div style={trustItemTitle}>Simple routine</div>
              <div style={trustItemSub}>One scoop, 2–3 times a week. That's it.</div>
            </div>
          </div>
        </div>
      </section>

      {/* THINGS PEOPLE ASK US — real questions, straight answers, and the
          product that fits each one. */}
      <section style={{ ...band, padding: '80px 0', textAlign: 'center' }}>
        <div style={S.wrap}>
          <img src="/images/anese-tiger-icon.png" alt="" style={concernIcon} />
          <p style={S.label}>You're not the only one</p>
          <h2 style={{ ...S.h2, marginTop: 14 }}>
            Things people <span style={S.it}>ask us about.</span>
          </h2>
          <p style={sectionIntro}>Real questions, straight answers. Tap one and we'll tell you what we'd tell a friend.</p>
          <ConcernExplorer onAdd={(p) => c.add(p)} />
          <p style={{ fontSize: 14, marginTop: 30 }}>
            Don't see your question? <a href="#ask" style={S.link}>Ask us. Anonymous if you want.</a>
          </p>
        </div>
      </section>

      {/* COLLECTION — full-bleed tiled grid */}
      <section id="shop" style={{ padding: '30px 0 90px' }}>
        <div style={{ ...S.wrap, textAlign: 'center', marginBottom: 44 }}>
          <p style={S.label}>The lineup</p>
          <h2 style={{ ...S.h2, marginTop: 12 }}>Small routine. <span style={S.it}>Big shower energy.</span></h2>
        </div>
        <ProductGrid products={featured} onAdd={(p) => c.add(p)} reviews={reviewsByProduct} />
        <div style={{ marginTop: 34, textAlign: 'center' }}><Link href="/shop" style={S.link}>Shop everything</Link></div>
      </section>

      {/* HONEST DEMO */}
      <section style={{ ...band, background: T.shell, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
        <div style={{ ...S.wrap, textAlign: 'center' }}>
          <p style={S.label}>No filters, slightly wet</p>
          <h2 style={{ ...S.h2, marginTop: 12 }}>What it <span style={S.it}>actually</span> looks like.</h2>
          <p style={sectionIntro}>How much to scoop, how it feels and how it rinses. Unedited, so there are no surprises.</p>
          <UgcVideoStrip videos={UGC_VIDEOS} />
          <DemoSteps />
          <div style={{ marginTop: 40 }}>
            <Link href="/product/that-booty-tho" style={S.btnOutline}>Shop That Booty Tho.</Link>
          </div>
        </div>
      </section>

      {/* SHOWER RITUALS */}
      <section style={band}>
        <div style={{ ...S.wrap, textAlign: 'center' }}>
          <img src="/images/anese-cloud-icon.png" alt="" style={concernIcon} />
          <p style={S.label}>Everyday showers, slightly upgraded</p>
          <h2 style={{ ...S.h2, marginTop: 12 }}>The shower is the only meeting <span style={S.it}>we never cancel.</span></h2>
          <RitualCards />
          <div style={{ marginTop: 36 }}><Link href="/rituals" style={S.link}>See all rituals</Link></div>
        </div>
      </section>

      {/* INGREDIENTS */}
      <section style={band}>
        <div style={{ ...S.wrap, textAlign: 'center' }}>
          <p style={S.label}>No secrets</p>
          <h2 style={{ ...S.h2, marginTop: 12 }}>Ingredients that <span style={S.it}>earn their spot.</span></h2>
          <p style={sectionIntro}>Short list, real reasons. Here's what each one does, in plain English.</p>
          <IngredientExplorer />
        </div>
      </section>

      {/* MYTH VS FACT */}
      <section style={{ ...band, paddingTop: 0 }}>
        <div style={{ ...S.wrap, textAlign: 'center' }}>
          <p style={S.label}>The honest version</p>
          <h2 style={{ ...S.h2, marginTop: 12 }}>Straight answers. <span style={S.it}>No scare tactics.</span></h2>
          <MythFacts />
        </div>
      </section>

      {/* GALLERY */}
      <section id="before-after" style={band}>
        <div style={{ ...S.wrap, textAlign: 'center' }}>
          <p style={S.label}>Real people, real showers</p>
          <h2 style={{ ...S.h2, marginTop: 12 }}>Real skin, <span style={S.it}>in real life.</span></h2>
          <p style={sectionIntro}>Customer photos, unfiltered. Tap any photo to take a closer look.</p>
          <div className="gal-grid" style={galGrid}>
            {GALLERY_IMAGES.map((src, i) => (
              <button key={i} className="gal-card-btn" onClick={() => setLightboxIndex(i)} aria-label={`View photo ${i + 1}`} style={galCard}>
                <img src={src} alt="Anese customer" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
            ))}
          </div>
          <div style={{ marginTop: 36, display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/stories" style={S.link}>Read more stories</Link>
            <Link href="/stories#share" style={S.link}>Share yours</Link>
          </div>
        </div>
      </section>

      {/* ASK US ANYTHING */}
      <section id="ask" style={{ ...band, background: T.ink, color: T.white, textAlign: 'center' }}>
        <div style={S.wrap}>
          <p style={{ ...S.label, color: T.white }}>No awkward questions</p>
          <h2 style={{ ...S.h2, color: T.white, marginTop: 12 }}>Asking for a friend? <span style={{ ...S.it, color: T.white }}>We'll answer for your friend.</span></h2>
          <p style={{ ...sectionIntro, color: 'rgba(255,255,255,0.8)' }}>
            Type it, send it, and we'll answer honestly. Anonymous if you want. Our favorites get shared (without your name) so the next person doesn't have to wonder.
          </p>
          <AskBox mode="question" dark />
          <div style={{ marginTop: 26 }}><Link href="/questions" style={{ ...S.link, color: T.white }}>Browse answered questions</Link></div>
        </div>
      </section>

      {/* QUIZ */}
      <section style={{ ...S.wrap, paddingTop: 90, paddingBottom: 90 }}>
        <QuizBand />
      </section>

      {/* REVIEWS */}
      <section id="reviews" style={{ ...band, background: T.shell, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
        <div style={{ ...S.wrap, textAlign: 'center' }}>
          <p style={S.label}>In their words</p>
          {siteReviews.count === 0 ? (
            <h2 style={{ ...S.h2, marginTop: 12 }}>Be the first to <span style={S.it}>say something.</span></h2>
          ) : (
            <h2 style={{ ...S.h2, marginTop: 12 }}>What customers <span style={S.it}>are saying.</span></h2>
          )}
          {siteReviews.count === 0 ? (
            <p style={{ color: T.soft, fontSize: 15, marginTop: 24 }}>No reviews yet. Tried it? Tell us how it went, honestly — the good, the meh, all of it. Leave yours on any product page.</p>
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
            {HOW_TO.map(([h, p], i) => [String(i + 1), h, p]).map(([n, h, p], i) => (
              <div key={i}>
                <div style={{ fontFamily: T.serif, fontSize: 44, color: T.white, lineHeight: 0.8 }}>{n}</div>
                <h4 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 24, margin: '14px 0 6px' }}>{h}</h4>
                <p style={{ fontSize: 14, color: 'rgba(244,237,227,0.78)', maxWidth: '32ch', margin: '0 auto' }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ ...band, textAlign: 'center' }}>
        <div style={S.wrap}>
          <p style={S.label}>Good questions</p>
          <h2 style={{ ...S.h2, marginTop: 12 }}>Asked <span style={S.it}>&amp; answered.</span></h2>
          <Faq items={HOME_FAQS} />
        </div>
      </section>

      {/* NEWSLETTER */}
      <section style={{ ...band, textAlign: 'center' }}>
        <div style={S.wrap}>
          <p style={S.label}>Shower Thoughts</p>
          <h2 style={{ ...S.h2, marginTop: 12 }}>One honest skin email a week. <span style={S.it}>No guilt trips.</span></h2>
          <p style={{ color: T.soft, fontSize: 15, margin: '16px auto 28px', maxWidth: '44ch' }}>Answers to real questions, new rituals and early access, plus 15% off your first order.</p>
          <NewsletterSignup />
        </div>
      </section>

      <Footer />

      <CartDrawer {...c} onClose={() => c.setOpen(false)} />
      <Lightbox images={GALLERY_IMAGES} index={lightboxIndex} onClose={closeLightbox} onIndex={setLightboxIndex} />
      <HomeSectionsStyles />

      <style jsx>{`
        .announce-msg { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 8px; box-sizing: border-box; }
        .announce-short { display: none; }
        @media (max-width: 640px) {
          .announce-long { display: none; }
          .announce-short { display: inline; }
          .announce-msg { letter-spacing: 0.14em; }
        }
        .gal-grid { grid-template-columns: repeat(4, 1fr); }
        .rev-grid { grid-template-columns: repeat(3, 1fr); }
        .rit-grid { grid-template-columns: repeat(3, 1fr); }

        @media (max-width: 880px) {
          .gal-grid { grid-template-columns: 1fr 1fr; }
          .rev-grid { grid-template-columns: 1fr; }
          .rit-grid { grid-template-columns: 1fr; gap: 34px; }
        }
        @media (max-width: 680px) {
          /* Phones: keep the model in frame and fade the bottom to white so
             the copy reads below her. */
          .hero-bg {
            align-items: flex-end !important;
            height: auto !important; min-height: 92vh !important;
            background-image: linear-gradient(to bottom, rgba(255,255,255,0) 38%, rgba(255,255,255,0.88) 64%, #fff 82%), url(/images/anese-hero-towel.jpg) !important;
            background-position: center, 72% center !important;
            background-size: cover, cover !important;
            background-repeat: no-repeat !important;
          }
        }
      `}</style>
    </div>
  );
}

const announce = { textAlign: 'center', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.ink, background: T.coral, fontWeight: 500, padding: '10px 20px', overflow: 'hidden' };
const heroWrap = { position: 'relative' };
const heroBg = {
  position: 'relative', height: '88vh', minHeight: 560,
  // Model on the right, plain white wall on the left — the copy sits on
  // the wall in dark text (see the dark overlayTone on the Header above).
  backgroundImage: 'url(/images/anese-hero-towel.jpg)', backgroundSize: 'cover', backgroundPosition: 'center',
  backgroundColor: '#f4efea',
  display: 'flex', alignItems: 'center',
};
const heroContent = { position: 'relative', maxWidth: T.maxw, width: '100%', margin: '0 auto', padding: '90px 32px 40px', color: T.ink };
const heroH1 = { fontFamily: T.serif, fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(40px,5.8vw,74px)', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 20, color: T.ink, maxWidth: '11ch' };
const heroSub = { fontSize: 17, color: T.ink, maxWidth: '38ch', marginBottom: 30 };
const sectionIntro = { fontSize: 15, color: T.soft, maxWidth: '52ch', margin: '16px auto 0' };
const heroBtn = { ...S.btnFill, textDecoration: 'none' };
const heroLink = { ...S.link, color: T.ink };
const trustBar = { padding: '36px 32px', background: T.shell, borderBottom: `1px solid ${T.line}` };
const trustRow = { maxWidth: T.maxw, margin: '0 auto', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 16 };
const trustItem = {
  display: 'flex', alignItems: 'center', gap: 14, fontFamily: T.sans, color: T.ink,
  background: T.white, border: `1px solid ${T.line}`, borderRadius: 16, padding: '16px 22px',
  boxShadow: T.shadowSm, flex: '1 1 220px', maxWidth: 320,
};
const trustItemTitle = { fontSize: 15, fontWeight: 700 };
const trustItemSub = { fontSize: 12, color: T.soft, marginTop: 2 };
const concernIcon = { width: 100, height: 100, margin: '0 auto 18px', display: 'block' };
const band = { padding: '90px 0' };
const galGrid = { display: 'grid', gap: 16, marginTop: 50 };
const galCard = { overflow: 'hidden', aspectRatio: '4/5', boxShadow: T.shadowSm, padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', display: 'block', width: '100%' };
const revGrid = { display: 'grid', gap: 22, marginTop: 48, textAlign: 'left' };
const rev = { padding: '30px 28px', background: T.oat, borderRadius: 20 };
const ritGrid = { display: 'grid', gap: 44, marginTop: 54 };
