import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { T } from '../lib/theme';
import { getFeaturedProducts } from '../lib/products';

const megaProducts = getFeaturedProducts().slice(0, 4);

// overlayTone: 'light' = white text/logo over a dark photo; 'dark' = ink
// text/logo over a light photo (the transparent state only).
export default function Header({ cartCount = 0, onCartClick, overlay = false, scrolled = false, overlayTone = 'light' }) {
  const router = useRouter();
  const active = (p) => router.pathname === p;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const closeMenu = () => setMenuOpen(false);

  const transparent = overlay && !scrolled;
  const lightText = transparent && overlayTone !== 'dark';
  const linkColor = lightText ? T.white : T.ink;

  return (
    <header
      className={transparent && !lightText ? 'hdr-glow' : undefined}
      style={{
        ...styles.header,
        position: overlay ? (scrolled ? 'fixed' : 'absolute') : 'sticky',
        background: transparent ? 'transparent' : 'rgba(255,255,255,0.96)',
        backdropFilter: transparent ? 'none' : 'blur(10px)',
        borderBottom: transparent ? '1px solid transparent' : `1px solid ${T.line}`,
        transition: 'background .35s ease, border-color .35s ease',
      }}
    >
      <div style={styles.nav}>
        <div style={styles.side}>
          <div className="desktop-links" style={styles.desktopLinks}>
            {/* Hover mega menu: product tiles plus quick routes into the
                shop, so the top nav itself is somewhere to browse. */}
            <div className="shop-nav">
              <Link href="/shop" style={{ ...styles.navLink, color: linkColor, opacity: active('/shop') ? 1 : 0.7 }}>Shop</Link>
              <div className="shop-mega" style={styles.mega}>
                <div style={styles.megaInner}>
                  <div style={styles.megaLinks}>
                    <div style={styles.megaHeading}>Shop</div>
                    <Link href="/shop" style={styles.megaLink}>All products</Link>
                    <Link href="/product/that-booty-tho" style={styles.megaLink}>Bestseller: That Booty Tho.</Link>
                    <Link href="/product/glazed-set" style={styles.megaLink}>Sets &amp; bundles</Link>
                    <div style={{ ...styles.megaHeading, marginTop: 18 }}>Not sure?</div>
                    <Link href="/quiz" style={styles.megaLink}>Find my routine</Link>
                    <Link href="/questions" style={styles.megaLink}>Ask us anything</Link>
                    <Link href="/booty-acne" style={styles.megaLink}>Booty acne guide</Link>
                  </div>
                  <div style={styles.megaProducts}>
                    {megaProducts.map((p) => (
                      <Link key={p.id} href={`/product/${p.id}`} className="mega-card" style={styles.megaCard}>
                        <span style={styles.megaImgWrap}>
                          <img src={p.images[0]} alt="" style={styles.megaImg} />
                        </span>
                        <span style={styles.megaName}>{p.name}</span>
                        <span style={styles.megaPrice}>${p.price}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Link href="/questions" style={{ ...styles.navLink, color: linkColor, opacity: active('/questions') ? 1 : 0.7 }}>Ask Us Anything</Link>
            <Link href="/rituals" style={{ ...styles.navLink, color: linkColor, opacity: active('/rituals') ? 1 : 0.7 }}>Shower Rituals</Link>
            <Link href="/stories" style={{ ...styles.navLink, color: linkColor, opacity: active('/stories') ? 1 : 0.7 }}>Real Stories</Link>
          </div>
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen((o) => !o)}
            style={styles.hamburgerBtn}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <span style={styles.hamburgerIcon}>
              <span style={{ ...styles.hamburgerLine, background: linkColor }} />
              <span style={{ ...styles.hamburgerLine, background: linkColor }} />
              <span style={{ ...styles.hamburgerLine, background: linkColor }} />
            </span>
          </button>
        </div>
        <Link href="/" style={styles.logoLink}>
          <img
            src={lightText ? '/images/anese-logo-white-transparent.png' : '/images/anese_logo_transparent.png'}
            alt="anese"
            style={styles.logoImg}
          />
        </Link>
        <div style={{ ...styles.side, justifyContent: 'flex-end' }}>
          <Link href="/quiz" className="quiz-link" style={{ ...styles.navLink, color: linkColor, opacity: active('/quiz') ? 1 : 0.7 }}>Find My Routine</Link>
          <button onClick={onCartClick} style={{ ...styles.cartBtn, color: linkColor }} aria-label="Open cart">
            Cart{cartCount > 0 ? ` (${cartCount})` : ''}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu" style={styles.mobileMenu}>
          <Link href="/shop" onClick={closeMenu} style={styles.mobileMenuLink}>Shop</Link>
          <Link href="/questions" onClick={closeMenu} style={styles.mobileMenuLink}>Ask Us Anything</Link>
          <Link href="/rituals" onClick={closeMenu} style={styles.mobileMenuLink}>Shower Rituals</Link>
          <Link href="/stories" onClick={closeMenu} style={styles.mobileMenuLink}>Real Stories</Link>
          <Link href="/quiz" onClick={closeMenu} style={styles.mobileMenuLink}>Find My Routine</Link>
        </div>
      )}

      <style jsx>{`
        .desktop-links { display: flex; }
        .hamburger-btn { display: none; }
        .mobile-menu { display: none; }
        /* Fully transparent over a light photo: a faint white glow keeps the
           dark nav text readable where it crosses busier parts of the image. */
        .hdr-glow :global(a), .hdr-glow :global(button) {
          text-shadow: 0 0 2px rgba(255,255,255,0.9), 0 0 12px rgba(255,255,255,0.85);
          opacity: 1 !important;
        }
        .hdr-glow :global(.shop-mega) :global(a) { text-shadow: none; }
        .desktop-links :global(a), :global(.quiz-link) { white-space: nowrap; }
        @media (max-width: 1020px) {
          .desktop-links { display: none; }
          .hamburger-btn { display: flex; }
          :global(.quiz-link) { display: none; }
          .mobile-menu { display: flex; }
        }
        .mobile-menu > :global(a:not(:last-child)) { border-bottom: 1px solid ${T.line}; }
        .shop-mega { opacity: 0; visibility: hidden; transform: translateY(-4px); transition: opacity .2s ease .12s, transform .2s ease .12s, visibility 0s linear .32s; }
        .shop-nav:hover .shop-mega, .shop-nav:focus-within .shop-mega { opacity: 1; visibility: visible; transform: none; transition-delay: 0s; }
        .mega-card img { transition: transform .4s ease; }
        .mega-card:hover img { transform: scale(1.05); }
      `}</style>
    </header>
  );
}

const styles = {
  header: {
    top: 0, left: 0, right: 0, zIndex: 100,
  },
  nav: {
    maxWidth: T.maxw, margin: '0 auto', padding: '6px 40px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  side: { display: 'flex', gap: 30, flex: 1, alignItems: 'center' },
  desktopLinks: { gap: 26, alignItems: 'center' },
  mega: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
    background: T.white, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`,
  },
  megaInner: {
    maxWidth: T.maxw, margin: '0 auto', padding: '28px 40px 32px',
    display: 'grid', gridTemplateColumns: '220px 1fr', gap: 40,
  },
  megaLinks: { display: 'flex', flexDirection: 'column', gap: 10 },
  megaHeading: { fontFamily: T.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.ink, marginBottom: 2 },
  megaLink: { fontFamily: T.sans, fontSize: 14, color: T.ink },
  megaProducts: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 18 },
  megaCard: { display: 'flex', flexDirection: 'column', gap: 6, color: T.ink },
  megaImgWrap: { display: 'block', background: T.white, border: `1px solid ${T.line}`, aspectRatio: '1 / 1', overflow: 'hidden' },
  megaImg: { width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: 10, boxSizing: 'border-box' },
  megaName: { fontFamily: T.sans, fontSize: 13, fontWeight: 600, marginTop: 4 },
  megaPrice: { fontFamily: T.sans, fontSize: 13, color: T.soft },
  navLink: {
    fontFamily: T.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
    transition: 'color .35s ease',
  },
  // 48x48 hit area (Material/WCAG minimum) around the same small visual
  // icon — the icon itself stays 22x16, centered, so the header doesn't
  // look any different, but the actual tappable region is much bigger.
  hamburgerBtn: {
    alignItems: 'center', justifyContent: 'center',
    width: 48, height: 48, margin: '-16px -13px', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
  },
  hamburgerIcon: {
    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5,
    width: 22, height: 16,
  },
  hamburgerLine: { display: 'block', width: '100%', height: 1, transition: 'background .35s ease' },
  cartBtn: {
    fontFamily: T.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
    background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color .35s ease',
  },
  logoLink: { flex: '0 0 auto' },
  logoImg: { height: 64, width: 'auto', display: 'block' },
  mobileMenu: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    background: T.white, borderBottom: `1px solid ${T.line}`,
    flexDirection: 'column', padding: '4px 40px',
  },
  // display:block + vertical padding (not just gap between them) gives each
  // link a >=48px-tall tap target instead of just its 13px text line.
  mobileMenuLink: {
    display: 'block', padding: '16px 0',
    fontFamily: T.sans, fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.ink,
  },
};
