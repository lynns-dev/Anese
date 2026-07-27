// ANESE design tokens — warm, body-positive skincare (oat/clay/blush)
export const T = {
  white: '#FBF7F0',
  paper: '#F4EDE3',
  oat: '#F4EDE3',
  shell: '#FBF7F0',
  blush: '#EBD6C7',
  clay: '#C2856A',
  clayDeep: '#A66C53',
  honey: '#B8995A',
  ink: '#2E2620',
  soft: '#6E6055',
  line: 'rgba(46,38,32,0.12)',
  dline: 'rgba(244,237,227,0.2)',
  maxw: '1180px',
  serif: "'Instrument Serif', serif",
  sans: "'Figtree', sans-serif",
  shadow: '0 14px 40px rgba(46,38,32,0.10)',
  shadowSm: '0 8px 24px rgba(46,38,32,0.07)',
};

// Shared style fragments reused across pages
export const S = {
  label: {
    fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase',
    color: T.clayDeep, fontWeight: 600,
  },
  h2: {
    fontFamily: T.serif, fontWeight: 400,
    fontSize: 'clamp(38px,5vw,60px)', lineHeight: 1, letterSpacing: '-0.01em',
    color: T.ink,
  },
  it: { fontFamily: T.serif, fontStyle: 'italic', fontWeight: 400, color: T.clay },
  btnFill: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 56, padding: '0 30px',
    background: T.ink, color: T.oat, border: 'none', cursor: 'pointer', borderRadius: 50,
    fontFamily: T.sans, fontWeight: 600, fontSize: 15, letterSpacing: '0.01em', transition: 'background .25s',
  },
  btnOutline: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 56, padding: '0 30px',
    background: 'transparent', color: T.ink, border: `1px solid ${T.line}`, cursor: 'pointer', borderRadius: 50,
    fontFamily: T.sans, fontWeight: 600, fontSize: 15, letterSpacing: '0.01em',
    transition: 'all .2s',
  },
  link: {
    fontSize: 13, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer',
  },
  wrap: { maxWidth: T.maxw, margin: '0 auto', padding: '0 32px' },
};
