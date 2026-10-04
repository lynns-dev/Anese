// Interactive homepage sections: shop-by-concern explorer, ingredient
// explorer, customer video strip, quiz band, FAQ accordion, and a gallery
// lightbox. Kept out of pages/index.jsx so the page itself stays a readable
// list of sections.
//
// Copy here only describes what the products are and how they're used —
// no invented reviews, press, customer counts, or medical claims.

import React from 'react';
import Link from 'next/link';
import { getProductById } from '../lib/products';
import { T, S } from '../lib/theme';
import { QUESTION_TOPICS, RITUALS, MYTHS, DEMO_STEPS } from '../lib/brandContent';

// ---------- Things people ask us ----------

export function ConcernExplorer({ onAdd }) {
  const [active, setActive] = React.useState(0);
  const topic = QUESTION_TOPICS[active];
  const product = getProductById(topic.product);

  return (
    <div>
      <div className="concern-tabs" role="tablist" aria-label="Questions people ask" style={concernTabs}>
        {QUESTION_TOPICS.map((t, i) => (
          <button
            key={t.tab}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            style={{ ...concernTab, ...(i === active ? concernTabActive : {}) }}
          >
            {t.tab}
          </button>
        ))}
      </div>

      {product && (
        <div key={topic.tab} className="concern-panel fade-in" role="tabpanel" style={concernPanel}>
          <Link href={`/product/${product.id}`} style={concernImgWrap}>
            <img src={product.images[0]} alt={product.name} style={concernImg} />
          </Link>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 32, lineHeight: 1.1, margin: '0 0 14px' }}>
              &ldquo;{topic.question}&rdquo;
            </h3>
            <p style={{ fontSize: 15, color: T.ink, marginBottom: 16 }}>{topic.answer}</p>
            <p style={{ fontSize: 14, marginBottom: 14 }}>
              <strong style={{ fontWeight: 700 }}>Try:</strong> {product.name} — ${product.price}
              {topic.productNote && <span style={{ color: T.soft }}>. {topic.productNote}</span>}
            </p>
            <p style={{ fontSize: 13, color: T.soft, marginBottom: 22, paddingLeft: 12, borderLeft: `2px solid ${T.clay}` }}>
              <strong style={{ fontWeight: 600 }}>Honest tip:</strong> {topic.tip}
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button style={{ ...S.btnFill, height: 50 }} onClick={() => onAdd(product)}>Add to shower</button>
              {topic.more && <Link href={topic.more.href} style={S.link}>{topic.more.label}</Link>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Ingredient explorer ----------

const INGREDIENTS = [
  { name: 'Walnut grain', in: 'That Booty Tho.', what: 'The scrubby part.', does: 'Buffs rough, dull surface skin so it feels smoother.' },
  { name: 'Shea butter', in: 'That Booty Tho.', what: 'The cushion.', does: 'Softens skin while you scrub, so it never feels raw.' },
  { name: 'Jojoba oil', in: 'That Booty Tho.', what: 'The lightweight one.', does: 'Hydrates without feeling heavy.' },
  { name: 'Rosehip oil', in: 'That Booty Tho.', what: 'The glow-getter.', does: 'Helps skin look radiant and even.' },
  { name: 'Sugar + coconut', in: 'Hold my Drink.', what: 'The vacation.', does: 'Polishes away flakes and leaves skin soft and sweet-smelling.' },
  { name: 'Cocoa butter', in: 'Cream Dream Set', what: 'The cozy one.', does: 'Rich moisture, whipped light, no greasy finish.' },
];

export function IngredientExplorer() {
  const [active, setActive] = React.useState(0);
  const ing = INGREDIENTS[active];
  return (
    <div className="ing-layout" style={ingLayout}>
      <ul style={ingList}>
        {INGREDIENTS.map((x, i) => (
          <li key={x.name}>
            <button
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              aria-pressed={i === active}
              style={{ ...ingBtn, ...(i === active ? ingBtnActive : {}) }}
            >
              <span>{x.name}</span>
              <span aria-hidden="true" style={{ fontSize: 18, opacity: i === active ? 1 : 0.25 }}>→</span>
            </button>
          </li>
        ))}
      </ul>
      <div key={ing.name} className="fade-in" style={ingCard}>
        <p style={{ ...S.label, fontSize: 10 }}>Found in {ing.in}</p>
        <h3 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 44, lineHeight: 1, margin: '14px 0 18px' }}>{ing.name}</h3>
        <p style={{ fontSize: 15, color: T.soft, marginBottom: 14 }}>{ing.what}</p>
        <p style={{ fontSize: 17, lineHeight: 1.55, color: T.ink }}>{ing.does}</p>
      </div>
    </div>
  );
}

// ---------- Customer videos ----------

// Plays each clip muted while it's on screen and pauses it when it scrolls
// away, so four ~8MB videos aren't all streaming at once.
function InViewVideo({ src }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.play().catch(() => {});
      else el.pause();
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      style={videoItem}
    />
  );
}

export function UgcVideoStrip({ videos }) {
  return (
    <div className="video-strip" style={videoStrip}>
      {videos.map((src) => <InViewVideo key={src} src={src} />)}
    </div>
  );
}

export function DemoSteps() {
  return (
    <ol className="demo-steps" style={demoSteps}>
      {DEMO_STEPS.map(([h, p], i) => (
        <li key={h} style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: T.serif, fontSize: 22, marginBottom: 4 }}>
            <span style={{ color: T.soft, marginRight: 8 }}>{i + 1}.</span>{h}
          </div>
          <p style={{ fontSize: 14, color: T.soft, margin: 0 }}>{p}</p>
        </li>
      ))}
    </ol>
  );
}

// ---------- Shower rituals ----------

export function RitualCards({ detailed = false }) {
  return (
    <div className="ritual-grid" style={ritualGrid}>
      {RITUALS.map((r) => {
        const product = getProductById(r.product);
        return (
          <div key={r.name} style={ritualCard}>
            <h3 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 26, lineHeight: 1.1, marginBottom: 10 }}>{r.name}</h3>
            <p style={{ fontSize: 15, color: T.ink, marginBottom: detailed ? 18 : 0 }}>{r.line}</p>
            {detailed && (
              <>
                <ol style={{ paddingLeft: 18, margin: '0 0 18px', fontSize: 14, color: T.soft, lineHeight: 1.7 }}>
                  {r.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
                {product && <Link href={`/product/${product.id}`} style={S.link}>Uses {product.name}</Link>}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------- Myth vs. fact ----------

export function MythFacts() {
  return (
    <div className="myth-grid" style={mythGrid}>
      {MYTHS.map(([myth, fact]) => (
        <div key={myth} style={mythCard}>
          <p style={{ ...S.label, fontSize: 10, color: T.soft }}>Myth</p>
          <p style={{ fontSize: 16, textDecoration: 'line-through', textDecorationColor: T.clay, textDecorationThickness: 2, margin: '6px 0 18px' }}>{myth}</p>
          <p style={{ ...S.label, fontSize: 10 }}>Fact</p>
          <p style={{ fontFamily: T.serif, fontSize: 24, lineHeight: 1.2, marginTop: 6 }}>{fact}</p>
        </div>
      ))}
    </div>
  );
}

// ---------- Quiz band ----------

export function QuizBand() {
  return (
    <div className="quiz-band" style={quizBand}>
      <div style={quizImgWrap}>
        <img src="/images/anese-lifestyle-2.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
      </div>
      <div style={quizText}>
        <p style={S.label}>Not sure where to start?</p>
        <h2 style={{ ...S.h2, marginTop: 14, fontSize: 'clamp(34px,4.4vw,52px)' }}>
          Let's figure out <span style={S.it}>what feels right.</span>
        </h2>
        <p style={{ fontSize: 15, color: T.soft, margin: '18px 0 28px', maxWidth: '38ch' }}>
          Two quick questions, one honest recommendation. No 10-step routine, promise.
        </p>
        <Link href="/quiz" style={{ ...S.btnFill, textDecoration: 'none' }}>Take the quiz</Link>
      </div>
    </div>
  );
}

// ---------- FAQ ----------

export { FAQS as HOME_FAQS } from '../lib/brandContent';

export function Faq({ items }) {
  const [open, setOpen] = React.useState(0);
  return (
    <div style={{ maxWidth: 760, margin: '42px auto 0', textAlign: 'left', borderTop: `1px solid ${T.line}` }}>
      {items.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <div key={q} style={{ borderBottom: `1px solid ${T.line}` }}>
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              style={faqBtn}
            >
              <span>{q}</span>
              <span aria-hidden="true" style={{ fontSize: 22, fontWeight: 300, transition: 'transform .25s', transform: isOpen ? 'rotate(45deg)' : 'none' }}>+</span>
            </button>
            <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows .3s ease' }}>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: 15, color: T.soft, padding: '0 40px 22px 0', margin: 0 }}>{a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Gallery lightbox ----------

export function Lightbox({ images, index, onClose, onIndex }) {
  React.useEffect(() => {
    if (index == null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, images.length, onClose, onIndex]);

  if (index == null) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={onClose} style={lightbox}>
      <img src={images[index]} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '92vw', maxHeight: '86vh', objectFit: 'contain', display: 'block' }} />
      <button aria-label="Close" onClick={onClose} style={{ ...lbBtn, top: 18, right: 18, transform: 'none' }}>×</button>
      {images.length > 1 && (
        <>
          <button aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + images.length) % images.length); }} style={{ ...lbBtn, left: 18, top: '50%' }}>‹</button>
          <button aria-label="Next photo" onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % images.length); }} style={{ ...lbBtn, right: 18, top: '50%' }}>›</button>
        </>
      )}
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 12, letterSpacing: '0.14em' }}>
        {index + 1} / {images.length}
      </div>
    </div>
  );
}

// Shared keyframes/responsive rules for everything above. Rendered once by
// the homepage.
export function HomeSectionsStyles() {
  return (
    <style jsx global>{`
      .fade-in { animation: home-fade .45s ease both; }
      @keyframes home-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      .concern-tabs button:hover { border-color: ${T.ink}; }
      .video-strip video { transition: transform .35s ease; }
      .video-strip video:hover { transform: scale(1.02); }
      .gal-card-btn img { transition: transform .5s ease; }
      .gal-card-btn:hover img { transform: scale(1.05); }
      @media (max-width: 860px) {
        .concern-panel { grid-template-columns: 1fr !important; }
        .ing-layout { grid-template-columns: 1fr !important; }
        .quiz-band { grid-template-columns: 1fr !important; }
        .ritual-grid, .myth-grid, .demo-steps { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        .video-strip { grid-template-columns: repeat(4, 62vw) !important; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 8px; }
        .video-strip video { scroll-snap-align: start; }
      }
      @media (max-width: 560px) {
        .ritual-grid, .myth-grid { grid-template-columns: 1fr !important; }
      }
      @media (max-width: 640px) {
        .concern-tabs { flex-wrap: nowrap !important; justify-content: flex-start !important; overflow-x: auto; padding-bottom: 6px; }
        .concern-tabs button { flex: 0 0 auto; }
      }
    `}</style>
  );
}

// ---------- styles ----------

const concernTabs = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 36 };
const concernTab = {
  fontFamily: T.sans, fontSize: 13, fontWeight: 500, color: T.ink, background: T.white,
  border: `1px solid ${T.line}`, borderRadius: 999, padding: '11px 20px', cursor: 'pointer',
  transition: 'background .2s, border-color .2s',
};
const concernTabActive = { background: T.blush, borderColor: T.blush, fontWeight: 700 };
const concernPanel = {
  display: 'grid', gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)', gap: 48, alignItems: 'center',
  maxWidth: 940, margin: '44px auto 0', padding: 32, background: T.white, border: `1px solid ${T.line}`,
};
const concernImgWrap = { display: 'block', background: T.white, aspectRatio: '1 / 1', overflow: 'hidden' };
const concernImg = { width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: 18, boxSizing: 'border-box' };

const ingLayout = { display: 'grid', gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.2fr)', gap: 40, marginTop: 48, textAlign: 'left', alignItems: 'stretch' };
const ingList = { listStyle: 'none', margin: 0, padding: 0, borderTop: `1px solid ${T.line}` };
const ingBtn = {
  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  fontFamily: T.serif, fontSize: 26, fontWeight: 400, color: T.ink, background: 'none', border: 'none',
  borderBottom: `1px solid ${T.line}`, padding: '16px 4px', cursor: 'pointer', textAlign: 'left', transition: 'padding .2s',
};
const ingBtnActive = { paddingLeft: 14, fontStyle: 'italic' };
const ingCard = { background: T.blush, padding: '44px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' };

const demoSteps = { listStyle: 'none', padding: 0, margin: '28px 0 0', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 };
const ritualGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginTop: 44, textAlign: 'left' };
const ritualCard = { background: T.white, border: `1px solid ${T.line}`, padding: '28px 24px' };
const mythGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginTop: 44, textAlign: 'left' };
const mythCard = { background: T.blush, padding: '28px 24px' };
const videoStrip = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginTop: 42 };
const videoItem = { width: '100%', aspectRatio: '9 / 16', objectFit: 'cover', display: 'block', background: T.blush };

const quizBand = { display: 'grid', gridTemplateColumns: '1fr 1fr', background: T.blush };
const quizImgWrap = { position: 'relative', minHeight: 420, overflow: 'hidden' };
const quizText = { padding: 'clamp(36px, 6vw, 72px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', textAlign: 'left' };

const faqBtn = {
  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20,
  fontFamily: T.sans, fontSize: 16, fontWeight: 600, color: T.ink, background: 'none', border: 'none',
  padding: '22px 0', cursor: 'pointer', textAlign: 'left',
};

const lightbox = {
  position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(20,16,14,0.92)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const lbBtn = {
  position: 'absolute', transform: 'translateY(-50%)', width: 48, height: 48, borderRadius: '50%',
  background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', fontSize: 28, lineHeight: 1, cursor: 'pointer',
};
