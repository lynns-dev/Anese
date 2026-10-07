import React from 'react';
import Header from '../components/Header';
import CartDrawer from '../components/CartDrawer';
import ProductGrid from '../components/ProductGrid';
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
          <h1 style={{ ...S.h2, fontSize: 'clamp(28px,3vw,36px)', marginTop: 14 }}>
            Shop <span style={S.it}>ANESE.</span>
          </h1>
          <p style={{ color: T.soft, fontSize: 15, marginTop: 14, maxWidth: '46ch', marginLeft: 'auto', marginRight: 'auto' }}>
            A small, considered lineup of booty and body care — made to buff, smooth, and moisturize the spots most routines skip.
          </p>
        </div>
      </section>

      <section style={{ padding: '40px 0 64px' }}>
        <ProductGrid products={PRODUCTS.filter((p) => p.id !== 'scent-trio')} onAdd={(p) => c.add(p)} reviews={reviews} />
      </section>

      <Marquee />
      <Footer />

      <CartDrawer {...c} onClose={() => c.setOpen(false)} />

    </div>
  );
}

const banner = {
  padding: '64px 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const bannerIcon = { width: 100, height: 100, margin: '0 auto 18px', display: 'block' };
