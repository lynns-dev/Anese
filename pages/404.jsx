import React from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { T, S } from '../lib/theme';

export default function NotFound() {
  return (
    <div>
      <Seo title="Page not found | ANESE" path="/404" />
      <Header />
      <section style={{ maxWidth: 640, margin: '0 auto', padding: '120px 32px', textAlign: 'center' }}>
        <p style={S.label}>404</p>
        <h1 style={{ ...S.h2, fontSize: 'clamp(36px,5vw,58px)', margin: '16px 0 18px' }}>
          This page wandered off. <span style={S.it}>Like our motivation on leg day.</span>
        </h1>
        <p style={{ color: T.soft, fontSize: 16, marginBottom: 32 }}>Let's get you somewhere useful.</p>
        <div style={{ display: 'flex', gap: 22, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/" style={{ ...S.btnFill, textDecoration: 'none' }}>Back home</Link>
          <Link href="/shop" style={S.link}>Shop</Link>
          <Link href="/questions" style={S.link}>Ask us anything</Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
