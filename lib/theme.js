// Owner palette direction, November 15, 2026: peach-pink, muted blue-green,
// black and white. Pastels are surfaces; dark text keeps them legible.
export const T = {
  white: '#FFFFFF',
  paper: '#FFFFFF',
  oat: '#FFFFFF',
  shell: '#E6EFED',
  blush: '#F4D6CD',
  clay: '#C4D8D3',
  clayDeep: '#C4D8D3',
  honey: '#1C1C1B',
  ink: '#1C1C1B',
  soft: '#343B39',
  // Peach-pink announcement surface with dark text.
  sea: '#C4D8D3',
  coral: '#E8B5A7',
  // Primary buttons: a soft off-black (not pure #000) with white text.
  btn: '#1C1B1A',
  btnText: '#FFFFFF',
  line: 'rgba(28,28,27,0.14)',
  dline: 'rgba(244,237,227,0.2)',
  maxw: '1180px',
  // Claude-style type: a calm text serif for headlines (light italic — see
  // S.h2) + a plain, highly legible screen sans for labels and body.
  serif: "'Source Serif 4', Georgia, serif",
  sans: "'Inter', ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
    fontSize: 'clamp(28px,3vw,36px)', lineHeight: 1, letterSpacing: '-0.02em',
    color: T.ink,
  },
  // Accent words inside a (light italic) headline: same italic, a touch
  // heavier, so the emphasis still reads.
  it: { fontFamily: T.serif, fontStyle: 'italic', fontWeight: 500, color: T.ink },
  btnFill: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 56, padding: '0 30px',
    background: T.btn, color: T.btnText, border: 'none', cursor: 'pointer', borderRadius: 0,
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
