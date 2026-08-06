import React from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import CartDrawer from '../components/CartDrawer';
import ProductVisual from '../components/ProductVisual';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { getProductById } from '../lib/products';
import { useCart } from '../lib/useCart';
import { T, S } from '../lib/theme';

// A short "build your routine" quiz — recommends one product (or the
// bundle) instead of leaving a first-time shopper to guess between 5 SKUs.
// Answers map to a product id via GOAL_MAP/SIZE_MAP below rather than any
// scoring system — small catalog, so a simple decision tree beats a
// points-based quiz that would be overkill here.
const GOAL_STEP = {
  question: "What's your main goal?",
  options: [
    { label: 'Buff away rough, bumpy texture', value: 'texture' },
    { label: 'Deep moisture, silky finish', value: 'moisture' },
    { label: 'A light everyday scent + smoothing', value: 'scent' },
    { label: 'The full routine — scrub + serum', value: 'routine' },
  ],
};

// Only shown when the shopper picks "texture" — the one goal with two
// product sizes to choose between; every other goal maps straight to a
// single product with no second question.
const SIZE_STEP = {
  question: 'How much do you go through?',
  options: [
    { label: 'Just enough for me', value: 'that-booty-tho' },
    { label: "I'll stock up — give me the bigger jar", value: 'that-booty-tho-6oz' },
  ],
};

const GOAL_TO_PRODUCT = {
  moisture: 'cream-dream-set',
  scent: 'hold-my-drink',
  routine: 'glazed-set',
};

export default function QuizPage() {
  const c = useCart();
  const [goal, setGoal] = React.useState(null);
  const [resultId, setResultId] = React.useState(null);

  const handleGoal = (value) => {
    setGoal(value);
    if (value !== 'texture') setResultId(GOAL_TO_PRODUCT[value]);
  };

  const handleSize = (id) => setResultId(id);

  const restart = () => {
    setGoal(null);
    setResultId(null);
  };

  const result = resultId ? getProductById(resultId) : null;

  return (
    <div>
      <Seo
        title="Build Your Routine | ANESE"
        description="Answer two quick questions and we'll match you with the right ANESE product for your skin goals."
        path="/quiz"
      />
      <Header cartCount={c.count} onCartClick={() => c.setOpen(true)} />

      <section style={{ maxWidth: 640, margin: '0 auto', padding: '70px 32px 100px', textAlign: 'center' }}>
        <p style={S.label}>Build your routine</p>
        <h1 style={{ ...S.h2, marginTop: 14, fontSize: 'clamp(34px,5vw,52px)' }}>
          Not sure where to <span style={S.it}>start?</span>
        </h1>

        {!result && !goal && (
          <div style={{ marginTop: 44 }}>
            <p style={{ fontSize: 15, color: T.soft, marginBottom: 28 }}>{GOAL_STEP.question}</p>
            <div style={optionGrid}>
              {GOAL_STEP.options.map((o) => (
                <button key={o.value} style={optionBtn} onClick={() => handleGoal(o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!result && goal === 'texture' && (
          <div style={{ marginTop: 44 }}>
            <p style={{ fontSize: 15, color: T.soft, marginBottom: 28 }}>{SIZE_STEP.question}</p>
            <div style={optionGrid}>
              {SIZE_STEP.options.map((o) => (
                <button key={o.value} style={optionBtn} onClick={() => handleSize(o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
            <button onClick={restart} style={{ ...S.link, marginTop: 30, display: 'inline-block' }}>← Start over</button>
          </div>
        )}

        {result && (
          <div style={{ marginTop: 44 }}>
            <p style={{ ...S.label, marginBottom: 18 }}>Your match</p>
            <div style={resultCard}>
              <div style={resultImg}>
                <ProductVisual id={result.id} images={result.images} alt={result.name} width={110} />
              </div>
              <div style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 26, marginTop: 20 }}>{result.name}</div>
              <div style={{ fontSize: 14, color: T.soft, margin: '8px 0 4px' }}>{result.tagline}</div>
              <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 20, color: T.ink, margin: '14px 0 22px' }}>${result.price}</div>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button style={S.btnFill} onClick={() => c.add(result)}>Add to cart</button>
                <Link href={`/product/${result.id}`} style={S.btnOutline}>See details</Link>
              </div>
            </div>
            <button onClick={restart} style={{ ...S.link, marginTop: 30, display: 'inline-block' }}>← Retake the quiz</button>
          </div>
        )}
      </section>

      <Footer />
      <CartDrawer {...c} onClose={() => c.setOpen(false)} />
    </div>
  );
}

const optionGrid = { display: 'grid', gap: 12 };
const optionBtn = {
  width: '100%', textAlign: 'left', padding: '18px 22px', border: `1px solid ${T.line}`, background: T.white,
  fontFamily: T.sans, fontSize: 15, color: T.ink, cursor: 'pointer', borderRadius: 12, transition: 'border-color .2s, background .2s',
};
const resultCard = { border: `1px solid ${T.line}`, borderRadius: 24, padding: '36px 32px', background: T.shell };
const resultImg = { width: 140, height: 140, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' };
