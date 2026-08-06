import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { T } from '../lib/theme';

export default function Header({ cartCount = 0, onCartClick, overlay = false, scrolled = false }) {
  const router = useRouter();
  const active = (p) => router.pathname === p;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const closeMenu = () => setMenuOpen(false);

  const transparent = overlay && !scrolled;
  const linkColor = transparent ? T.white : T.ink;

  return (
    <header
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
            <Link href="/shop" style={{ ...styles.navLink, color: linkColor, opacity: active('/shop') ? 1 : 0.7 }}>Shop</Link>
            <Link href="/quiz" style={{ ...styles.navLink, color: linkColor, opacity: active('/quiz') ? 1 : 0.7 }}>Find My Routine</Link>
            <a href="/#before-after" style={{ ...styles.navLink, color: linkColor }}>Before & After</a>
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
            src={transparent ? '/images/anese-logo-white-transparent.png' : '/images/anese_logo_transparent.png'}
            alt="anese"
            style={styles.logoImg}
          />
        </Link>
        <div style={{ ...styles.side, justifyContent: 'flex-end' }}>
          <a href="/#reviews" className="reviews-link" style={{ ...styles.navLink, color: linkColor }}>Reviews</a>
          <button onClick={onCartClick} style={{ ...styles.cartBtn, color: linkColor }} aria-label="Open cart">
            Cart{cartCount > 0 ? ` (${cartCount})` : ''}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu" style={styles.mobileMenu}>
          <Link href="/shop" onClick={closeMenu} style={styles.mobileMenuLink}>Shop</Link>
          <Link href="/quiz" onClick={closeMenu} style={styles.mobileMenuLink}>Find My Routine</Link>
          <a href="/#before-after" onClick={closeMenu} style={styles.mobileMenuLink}>Before & After</a>
          <a href="/#reviews" onClick={closeMenu} style={styles.mobileMenuLink}>Reviews</a>
        </div>
      )}

      <style jsx>{`
        .desktop-links { display: flex; }
        .hamburger-btn { display: none; }
        @media (max-width: 680px) {
          .desktop-links { display: none; }
          .hamburger-btn { display: flex; }
          .reviews-link { display: none; }
        }
        .mobile-menu > :global(a:not(:last-child)) { border-bottom: 1px solid ${T.line}; }
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
  desktopLinks: { gap: 30, alignItems: 'center' },
  navLink: {
    fontFamily: T.sans, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase',
    transition: 'color .35s ease',
  },
  // 48x48 hit area (Material/WCAG minimum) around the same small visual
  // icon — the icon itself stays 22x16, centered, so the header doesn't
  // look any different, but the actual tappable region is much bigger.
  hamburgerBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 48, height: 48, margin: '-16px -13px', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
  },
  hamburgerIcon: {
    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5,
    width: 22, height: 16,
  },
  hamburgerLine: { display: 'block', width: '100%', height: 1, transition: 'background .35s ease' },
  cartBtn: {
    fontFamily: T.sans, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase',
    background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color .35s ease',
  },
  logoLink: { flex: '0 0 auto' },
  logoImg: { height: 64, width: 'auto', display: 'block' },
  mobileMenu: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    background: T.white, borderBottom: `1px solid ${T.line}`,
    display: 'flex', flexDirection: 'column', padding: '4px 40px',
  },
  // display:block + vertical padding (not just gap between them) gives each
  // link a >=48px-tall tap target instead of just its 13px text line.
  mobileMenuLink: {
    display: 'block', padding: '16px 0',
    fontFamily: T.sans, fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.ink,
  },
};
