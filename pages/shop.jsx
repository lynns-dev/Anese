import React from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import CartDrawer from '../components/CartDrawer';
import ProductVisual from '../components/ProductVisual';
import Marquee from '../components/Marquee';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { PRODUCTS } from '../lib/products';
import { useCart } from '../lib/useCart';
import { useAllReviews } from '../lib/useReviews';
import { T, S } from '../lib/theme';

export default function ShopPage() {
  const c = useCart();
  const reviews = useAllReviews();
  return (
    <div>
      <Seo
        title="Shop Booty Skincare | ANESE — That Booty Tho & More"
        description="Shop ANESE's booty skincare collection, starting with That Booty Tho — the cult-favorite scrub for butt, thighs, and hips. Free shipping over $50."
        path="/shop"
      />
      <Header cartCount={c.count} onCartClick={() => c.setOpen(true)} />

      {/* BANNER — plain text header, no background image */}
      <section style={banner}>
        <div style={{ ...S.wrap, textAlign: 'center' }}>
          <img src="/images/anese-cloud-recline-icon.png" alt="" style={bannerIcon} />
          <p style={S.label}>The collection</p>
          <h1 style={{ ...S.h2, fontSize: 'clamp(38px,5.6vw,64px)', marginTop: 14 }}>
            Shop <span style={S.it}>ANESE.</span>
          </h1>
          <p style={{ color: T.soft, fontSize: 15, marginTop: 14, maxWidth: '46ch', marginLeft: 'auto', marginRight: 'auto' }}>
            A small, considered lineup of booty and body care — made to buff, smooth, and moisturize the spots most routines skip.
          </p>
        </div>
      </section>

      <section style={{ ...S.wrap, padding: '50px 0 64px' }}>
        <div className="shop-grid" style={grid}>
          {PRODUCTS.filter((p) => p.id !== 'scent-trio').map((p) => (
            <div key={p.id} style={card}>
              <Link href={`/product/${p.id}`} style={imgWrap}>
                {p.badge && <span style={badge}>{p.badge}</span>}
                <ProductVisual id={p.id} images={p.images} alt={p.name} width={p.id === 'puff' ? 130 : 120} />
              </Link>
              <div style={cardText}>
                <Link href={`/product/${p.id}`} style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 16 }}>{p.name}</Link>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.soft, margin: '6px 0' }}>{p.tagline}</div>
                {reviews[p.id]?.count > 0 && (
                  <div style={{ ...ratingRow, fontSize: 12, marginTop: 0, marginBottom: 10 }}>
                    <span style={{ letterSpacing: '1.5px', color: T.ink }}>{'★'.repeat(Math.round(reviews[p.id].average))}{'☆'.repeat(5 - Math.round(reviews[p.id].average))}</span>
                    {' '}{reviews[p.id].average.toFixed(1)} ({reviews[p.id].count})
                  </div>
                )}
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 14 }}>
                  ${p.price}
                </div>
                <button style={{ ...S.btnFill, width: '100%', justifyContent: 'center' }} onClick={() => c.add(p)}>Add to cart</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Marquee />
      <Footer />

      <CartDrawer {...c} onClose={() => c.setOpen(false)} />

      <style jsx>{`
        .shop-grid { grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 960px) {
          .shop-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .shop-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

const banner = {
  padding: '64px 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const bannerIcon = { width: 100, height: 100, margin: '0 auto 18px', display: 'block' };
const grid = { display: 'grid', gap: 40 };
const card = { textAlign: 'center' };
const badge = { position: 'absolute', top: 14, right: 14, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.ink, background: 'rgba(252,251,247,0.92)', padding: '6px 10px', zIndex: 1 };
const imgWrap = { position: 'relative', aspectRatio: '1/1', display: 'block', overflow: 'hidden', width: '100%' };
const cardText = { padding: '20px 6px 0' };
const ratingRow = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: T.soft, marginTop: 8, fontFamily: T.sans };
