// Shared frame for the editorial pages (/questions, /rituals, /stories):
// header, cart drawer, an intro banner, footer and the section styles
// from HomeSections.

import React from 'react';
import Header from './Header';
import CartDrawer from './CartDrawer';
import Footer from './Footer';
import Seo from './Seo';
import { HomeSectionsStyles } from './HomeSections';
import { useCart } from '../lib/useCart';
import { T, S } from '../lib/theme';

export default function PageShell({ seo, icon, eyebrow, title, intro, children }) {
  const c = useCart();
  return (
    <div>
      <Seo {...seo} />
      <Header cartCount={c.count} onCartClick={() => c.setOpen(true)} />
      <section style={{ padding: '70px 0 40px', textAlign: 'center' }}>
        <div style={S.wrap}>
          {icon && <img src={icon} alt="" style={{ width: 96, height: 96, margin: '0 auto 16px', display: 'block' }} />}
          <p style={S.label}>{eyebrow}</p>
          <h1 style={{ ...S.h2, fontSize: 'clamp(38px,5.6vw,64px)', marginTop: 14 }}>{title}</h1>
          {intro && <p style={{ color: T.soft, fontSize: 16, marginTop: 16, maxWidth: '50ch', marginLeft: 'auto', marginRight: 'auto' }}>{intro}</p>}
        </div>
      </section>
      {typeof children === 'function' ? children(c) : children}
      <Footer />
      <CartDrawer {...c} onClose={() => c.setOpen(false)} />
      <HomeSectionsStyles />
    </div>
  );
}
