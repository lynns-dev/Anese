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
import { useVariant, exposeExperiment } from '../lib/experiments';

export default function ShopPage() {
  const c = useCart();
  const reviews = useAllReviews();
  const concernVariant = useVariant('shop_concern_navigation');
  const compareVariant = useVariant('shop_product_comparison');
  const [concern, setConcern] = React.useState('all');
  React.useEffect(() => { exposeExperiment('shop_concern_navigation'); exposeExperiment('shop_product_comparison'); }, []);
  const products = PRODUCTS.filter((p) => p.id !== 'scent-trio' && p.id !== 'cloud-slippers');
  const concerns = { texture: ['that-booty-tho','hold-my-drink','glazed-set'], bumps: ['that-booty-tho','glazed-set'], spots: ['booty-glaze','glazed-set'], dryness: ['cream-dream-set','booty-glaze'] };
  const shown = concernVariant === 'concerns' && concern !== 'all' ? products.filter(p => concerns[concern]?.includes(p.id)) : products;
  return (
    <div>
      <Seo
        title="Shop Booty Skincare | ANESE — That Booty Tho & More"
        description="Shop ANESE's booty skincare collection, starting with That Booty Tho — the cult-favorite scrub for butt, thighs, and hips. Free shipping on every order."
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
        {concernVariant === 'concerns' && <div style={{ ...S.wrap, marginBottom: 28 }}>
          <p style={{ ...S.label, marginBottom: 12 }}>Shop by concern</p>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            {[['all','Shop all'],['texture','Rough texture'],['bumps','Bumps'],['spots','Dark spots'],['dryness','Dryness']].map(([id,label]) =>
              <button key={id} type="button" aria-pressed={concern === id} onClick={() => setConcern(id)} style={{ cursor:'pointer', border:'1px solid #d9c8bd', borderRadius:30, padding:'10px 16px', background:concern===id?'#29201d':'transparent', color:concern===id?'#fff':'#29201d' }}>{label}</button>
            )}
          </div>
        </div>}
        {compareVariant === 'compare' && <div style={{ ...S.wrap, marginBottom: 30 }}>
          <h2 style={{ ...S.h2, fontSize: 28, marginBottom: 14 }}>Find your routine.</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:12 }}>
            {[['that-booty-tho','EXFOLIATE','Buff away rough texture'],['booty-glaze','SMOOTH','Finish with a glowy serum'],['glazed-set','THE FULL ROUTINE','Scrub + serum together']].map(([id,step,detail]) => {
              const p = PRODUCTS.find(item => item.id === id);
              return p && <a key={id} href={'/product/' + id} style={{ display:'block', border:'1px solid #e4d7ce', padding:18, color:'inherit', textDecoration:'none', background:'#faf5f0' }}>
                <span style={{ fontSize:11, letterSpacing:1.4 }}>{step}</span>
                <div style={{ fontFamily:T.serif, fontSize:21, marginTop:8 }}>{p.name}</div>
                <p style={{ fontSize:13, margin:'8px 0 12px' }}>{detail}</p>
                <strong style={{ fontSize:14 }}>${p.price} · View product →</strong>
              </a>;
            })}
          </div>
        </div>}
        <ProductGrid products={shown} onAdd={(p) => c.add(p)} reviews={reviews} />
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
