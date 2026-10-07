import React from 'react';
import Link from 'next/link';
import PageShell from '../components/PageShell';
import NewsletterSignup from '../components/NewsletterSignup';
import { RitualCards } from '../components/HomeSections';
import { HOW_TO } from '../lib/brandContent';
import { T, S } from '../lib/theme';

export default function RitualsPage() {
  return (
    <PageShell
      seo={{
        title: 'Shower Rituals | ANESE',
        description: 'Everyday shower routines, slightly upgraded — the 2-minute Tuesday, the Sunday reset, the post-gym rinse and more.',
        path: '/rituals',
      }}
      icon="/images/anese-cloud-icon.png"
      eyebrow="Everyday showers, slightly upgraded"
      title={<>The shower is the only meeting <span style={S.it}>we never cancel.</span></>}
      intro="No 10-step routine. Just a few small rituals that fit the showers you're already taking."
      image={{ src: '/images/anese-rituals-sunlit.jpg', alt: 'A woman with her hair wrapped in a pink towel, moisturizing her legs after a shower', position: '20% 30%' }}
    >
      <section style={{ ...S.wrap, paddingBottom: 90 }}>
        <RitualCards detailed />
      </section>

      <section style={{ padding: '90px 0', background: T.ink, color: T.white, textAlign: 'center' }}>
        <div style={S.wrap}>
          <p style={{ ...S.label, color: T.white }}>The basics</p>
          <h2 style={{ ...S.h2, color: T.white, marginTop: 12 }}>How to <span style={{ ...S.it, color: T.white }}>scrub it.</span></h2>
          <div className="howto-grid" style={howGrid}>
            {HOW_TO.map(([h, p], i) => (
              <div key={h}>
                <div style={{ fontFamily: T.serif, fontSize: 32, lineHeight: 0.8 }}>{i + 1}</div>
                <h3 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 20, margin: '14px 0 6px' }}>{h}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', maxWidth: '30ch', margin: '0 auto' }}>{p}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 44 }}>
            <Link href="/product/that-booty-tho" style={{ ...S.btnFill, textDecoration: 'none' }}>Shop That Booty Tho.</Link>
          </div>
        </div>
      </section>

      <section style={{ padding: '90px 0', textAlign: 'center' }}>
        <div style={S.wrap}>
          <p style={S.label}>Shower Thoughts</p>
          <h2 style={{ ...S.h2, marginTop: 12 }}>A new ritual in your inbox. <span style={S.it}>No guilt trips.</span></h2>
          <p style={{ color: T.soft, fontSize: 15, margin: '16px auto 28px', maxWidth: '44ch' }}>One honest skin email a week, plus 15% off your first order.</p>
          <NewsletterSignup />
        </div>
      </section>
      <style jsx>{`
        .howto-grid { grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 760px) { .howto-grid { grid-template-columns: 1fr; gap: 34px !important; } }
      `}</style>
    </PageShell>
  );
}

const howGrid = { display: 'grid', gap: 44, marginTop: 50 };
