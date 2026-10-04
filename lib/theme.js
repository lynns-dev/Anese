// ANESE design tokens — clean white, black text, pink only as a soft
// background highlight (never a border or text color).
export const T = {
  white: '#FFFFFF',
  paper: '#FFFFFF',
  oat: '#FFFFFF',
  shell: '#FFFFFF',
  blush: '#FBD9E4',
  clay: '#F5B8D3',
  clayDeep: '#F5B8D3',
  honey: '#2E2620',
  ink: '#2E2620',
  soft: '#2E2620',
  // Bright pinkish coral for the announcement bar and primary buttons —
  // always paired with ink text (white on coral is too low-contrast).
  coral: '#FF6F7D',
  line: 'rgba(46,38,32,0.12)',
  dline: 'rgba(244,237,227,0.2)',
  maxw: '1180px',
  // Thin, calligraphic display serif (headlines set in its light italic —
  // see S.h2) + an airy geometric sans for labels and body.
  serif: "'Cormorant Garamond', Georgia, serif",
  sans: "'Jost', sans-serif",
  shadow: 'none',
  shadowSm: 'none',
};

// Shared style fragments reused across pages
export const S = {
  label: {
    fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase',
    color: T.ink, fontWeight: 500,
  },
  h2: {
    fontFamily: T.serif, fontWeight: 300, fontStyle: 'italic',
    fontSize: 'clamp(42px,5.6vw,68px)', lineHeight: 1, letterSpacing: '-0.02em',
    color: T.ink,
  },
  // Accent words inside a (light italic) headline: same italic, a touch
  // heavier, so the emphasis still reads.
  it: { fontFamily: T.serif, fontStyle: 'italic', fontWeight: 500, color: T.ink },
  btnFill: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 56, padding: '0 30px',
    background: T.coral, color: T.ink, border: 'none', cursor: 'pointer', borderRadius: 0,
    fontFamily: T.sans, fontWeight: 600, fontSize: 15, letterSpacing: '0.01em', transition: 'background .25s',
  },
  btnOutline: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 56, padding: '0 30px',
    background: 'transparent', color: T.ink, border: `1px solid ${T.line}`, cursor: 'pointer', borderRadius: 0,
    fontFamily: T.sans, fontWeight: 600, fontSize: 15, letterSpacing: '0.01em',
    transition: 'all .2s',
  },
  link: {
    fontSize: 13, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer',
  },
  wrap: { maxWidth: T.maxw, margin: '0 auto', padding: '0 32px' },
};
