import React from 'react';
import Link from 'next/link';
import { PRODUCTS } from '../lib/products';
import { T, S } from '../lib/theme';

// Link columns so the bottom of every page offers somewhere else to go —
// products, discovery pages, and help — rather than just policy links.
const COLUMNS = [
  {
    heading: 'Shop',
    links: [
      ['/shop', 'All products'],
      ...PRODUCTS.filter((p) => p.category !== 'accessory').map((p) => [`/product/${p.id}`, p.name]),
    ],
  },
  {
    heading: 'Let’s talk',
    links: [
      ['/questions', 'Ask us anything'],
      ['/rituals', 'Shower rituals'],
      ['/stories', 'Real stories'],
      ['/quiz', 'Find my routine'],
      ['/booty-acne', 'Booty acne guide'],
    ],
  },
  {
    heading: 'Help',
    links: [
      ['/#faq', 'FAQ'],
      ['/shipping', 'Shipping'],
      ['/returns', 'Returns'],
      ['/terms', 'Terms & Conditions'],
      ['/privacy', 'Privacy Policy'],
    ],
  },
];

export default function Footer() {
  return (
    <footer style={footer}>
      <div className="footer-grid" style={{ ...S.wrap, ...grid }}>
        <div>
          <img src="/images/anese_logo_transparent.png" alt="anese" style={{ height: 56, width: 'auto', marginLeft: -8 }} />
          <p style={{ fontFamily: T.serif, fontSize: 24, lineHeight: 1.15, margin: '14px 0 10px', maxWidth: '18ch' }}>
            Skincare that hypes you up, <span style={{ fontStyle: 'italic' }}>never tears you down.</span>
          </p>
          <p style={{ fontSize: 13, color: T.soft }}>
            Questions? We actually like them. <a href="mailto:help@prettysbrands.com" style={{ textDecoration: 'underline' }}>help@prettysbrands.com</a>
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <div style={heading}>{col.heading}</div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {col.links.map(([href, label]) => (
                <li key={href} style={{ marginBottom: 10 }}>
                  <Link href={href} className="footer-link" style={{ fontSize: 14, color: T.ink }}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div style={{ ...S.wrap, borderTop: `1px solid ${T.line}`, marginTop: 40, paddingTop: 20 }}>
        <small style={{ color: T.soft, fontSize: 11 }}>© {new Date().getFullYear()} ANESE</small>
      </div>
      <style jsx>{`
        .footer-grid { grid-template-columns: 1.4fr 1fr 1fr 1fr; }
        :global(.footer-link:hover) { text-decoration: underline; text-underline-offset: 3px; }
        @media (max-width: 760px) {
          .footer-grid { grid-template-columns: 1fr 1fr; }
          .footer-grid > div:first-child { grid-column: 1 / -1; }
        }
      `}</style>
    </footer>
  );
}

const footer = { borderTop: `1px solid ${T.line}`, padding: '56px 0 28px', background: T.white };
const grid = { display: 'grid', gap: 36 };
const heading = { fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.ink, marginBottom: 16 };
