import React from 'react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import Seo from './Seo';
import SaleCallout from './SaleCallout';
import { getProductById } from '../lib/products';
import { useCart } from '../lib/useCart';
import { fbTrack } from '../lib/fbPixel';
import { T } from '../lib/theme';

const COPY = {
  spots: {
    path: '/butt-scrub-dark-spots', label: 'The dark-spot conversation',
    headline: 'Butt scrub. Dark spots on your mind?',
    intro: 'Dark spots on your mind? Start with what a scrub can do: buff away dead surface skin and leave your booty feeling smoother.',
    question: 'Will this remove hyperpigmentation?',
    answer: 'We don’t have clinical evidence that this scrub removes hyperpigmentation or fades dark spots. It exfoliates rough surface texture. For persistent pigmentation, ask a dermatologist about suitable care.',
    note: 'Your skin tone isn’t a problem to solve. This is a rinse-off exfoliating step for butt, thighs, and hips.',
  },
  bumps: {
    path: '/butt-scrub-butt-acne', label: 'The butt-acne conversation',
    headline: 'Butt scrub. Butt acne on your mind?',
    intro: 'Searching for butt-acne care? Meet the exfoliating step for rough, intact skin: That Booty Tho. buffs away dead surface skin for a smoother feel.',
    question: 'Is this an acne treatment?',
    answer: 'No. That Booty Tho. is a cosmetic exfoliating scrub, not an acne treatment. Bumps can have different causes. Skip scrubbing active, inflamed, irritated, or broken skin; ask a dermatologist about persistent bumps.',
    note: 'No clear-skin promises. Just a straightforward scrub for the rough texture on your butt, thighs, and hips.',
  },
};

// Exact, product-specific excerpt from the existing imported review archive.
// No medical claims, outcome timelines, or other-product reviews are selected.
export const SCRUB_REVIEW = { author: 'Savannah', text: 'Such a great exfoliant product! The texture is perfect with a bit of warm water and goes so far.' };

export default function ConcernLanding({ concern }) {
  const copy = COPY[concern];
  const product = getProductById('that-booty-tho');
  const cart = useCart();
  React.useEffect(() => {
    fbTrack('ViewContent', { content_ids: [product.id], content_name: product.name, content_type: 'product', value: product.price, currency: 'USD' });
  }, [product]);
  const add = () => cart.add(product, 1);
  const button = <button className="concern-buy" type="button" onClick={add}>Add butt scrub — ${product.price}</button>;
  return <>
    <Seo title={`Butt Scrub | ${copy.label} — ANESE`} description={copy.intro} path={copy.path} image={product.images[0]} />
    <Head><meta name="robots" content="noindex, nofollow" /></Head>
    <Header cartCount={cart.count} onCartClick={() => cart.setOpen(true)} />
    <main className="concern">
      <section className="concern-hero">
        <div className="concern-photo"><img src="/images/anese-hero-scrub-sink.webp" alt="That Booty Tho. butt scrub jar beside a bathroom sink" fetchPriority="high" /></div>
        <div className="concern-copy">
          <p className="concern-label">ANESE / {copy.label}</p>
          <h1>{copy.headline}</h1><p className="concern-intro">{copy.intro}</p>
          <p><strong>{product.name}</strong><br />Perfecting booty scrub · {product.size}</p>
          {button}
          <SaleCallout appliedDiscount={cart.appliedDiscount} onApply={cart.applyDiscount} style={{ marginTop: 14 }} />
          <a className="concern-link" href="/product/that-booty-tho">Full product details</a>
        </div>
      </section>
      <section className="concern-band"><p className="concern-label">Made for your booty routine</p><h2>A little grit. A good rinse.</h2><p>{copy.note}</p>
        <div className="concern-grid">
          <article><span>01 / EXFOLIATE</span><h3>Buff the surface.</h3><p>Finely milled walnut grain exfoliates dead surface skin and rough texture.</p></article>
          <article><span>02 / KEEP IT SIMPLE</span><h3>Scrub, then rinse.</h3><p>A rinse-off step for butt, thighs, and hips. No extra product required.</p></article>
          <article><span>03 / KNOW YOUR SKIN</span><h3>Gentle hands, always.</h3><p>Massage lightly on wet, intact skin. Avoid irritated or broken skin and stop if irritation occurs.</p></article>
        </div>
      </section>
      <section className="concern-proof">
        <img src={product.images[0]} alt="That Booty Tho. 4 oz scrub jar" loading="lazy" />
        <div><p className="concern-label">From the That Booty Tho. review archive</p><blockquote>“{SCRUB_REVIEW.text}”</blockquote><p>— {SCRUB_REVIEW.author}</p><p className="concern-small">One customer’s experience with this scrub. Individual experiences vary.</p></div>
      </section>
      <section className="concern-band concern-faq"><p className="concern-label">A little clarity</p><h2>Good questions. Honest answers.</h2>
        {[[copy.question, copy.answer], ['How do I use it?', product.usage + ' Use light pressure and follow your skin’s tolerance.'], ['When will I see results?', 'We don’t promise a timeline or changes to acne or dark spots. This scrub is for cosmetic exfoliation and a smoother skin feel.']].map(([q,a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
      </section>
      <section className="concern-end"><p className="concern-label">Your next shower, sorted.</p><h2>Meet your butt scrub.</h2><p>{product.name} · {product.size} · ${product.price}</p>{button}</section>
    </main>
    <Footer /><CartDrawer {...cart} onClose={() => cart.setOpen(false)} />
    <style jsx global>{`
      .concern{color:${T.ink};font-family:${T.sans}}.concern *{box-sizing:border-box}.concern-hero{display:grid;grid-template-columns:1fr 1fr;max-width:1440px;margin:auto}.concern-photo img{width:100%;height:100%;min-height:650px;object-fit:cover}.concern-copy{padding:70px 8%;align-self:center}.concern-label{font-size:11px;letter-spacing:.15em;text-transform:uppercase}.concern h1{font-family:${T.serif};font-weight:300;font-style:italic;font-size:clamp(42px,4.6vw,68px);line-height:1.04;margin:24px 0}.concern p{line-height:1.7}.concern-intro{font-size:18px}.concern-buy{width:100%;max-width:440px;min-height:56px;padding:15px 24px;background:${T.btn};color:white;border:0;font:600 15px ${T.sans};cursor:pointer}.concern-buy:focus-visible,.concern summary:focus-visible{outline:3px solid ${T.ink};outline-offset:4px}.concern-link{display:block;margin-top:18px;color:inherit;font-size:13px;text-underline-offset:4px}.concern-band{padding:74px max(24px,calc((100vw - 1120px)/2));background:${T.blush}}.concern h2{font-family:${T.serif};font-size:clamp(32px,4vw,46px);font-weight:300;font-style:italic;line-height:1.1;margin:18px 0}.concern-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:36px;margin-top:42px}.concern-grid span{font-size:11px;letter-spacing:.12em}.concern h3{font-size:20px;font-weight:500}.concern-proof{display:grid;grid-template-columns:1fr 1.3fr;gap:60px;max-width:1120px;margin:auto;padding:70px 24px;align-items:center}.concern-proof img{width:100%;max-height:430px;object-fit:contain}.concern blockquote{font:italic 300 clamp(26px,3vw,36px)/1.3 ${T.serif};margin:24px 0}.concern-small{font-size:12px}.concern-faq{background:white;padding-top:30px}.concern details{border-bottom:1px solid ${T.line};padding:22px 0}.concern summary{cursor:pointer;font-weight:500;line-height:1.5}.concern details p{max-width:780px}.concern-end{text-align:center;background:${T.blush};padding:65px 24px}.concern-end .concern-buy{margin-top:16px}@media(max-width:720px){.concern-hero{grid-template-columns:1fr}.concern-photo img{min-height:0;height:330px;object-position:center}.concern-copy{padding:30px 24px 44px}.concern h1{font-size:43px}.concern-grid{grid-template-columns:1fr;gap:22px}.concern-band{padding:48px 24px}.concern-proof{grid-template-columns:1fr;gap:14px;padding:36px 24px}.concern-proof img{height:250px}.concern-intro{font-size:16px}}
    `}</style>
  </>;
}
