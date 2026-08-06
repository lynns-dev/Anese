import React from 'react';
import { T, S } from '../lib/theme';

// Animated "how it works over time" graphic — three stages (right away,
// 3-7 days, long-term) that loop continuously: a progress line sweeps
// left to right, each stage's texture circle morphs from bumpy dots
// (rough skin) to a smooth gradient (soft skin) as the line reaches it,
// and its label highlights. Pure CSS keyframes, no JS/canvas — cheap to
// run and respects prefers-reduced-motion.
const STAGES = [
  ['Right away', 'Instantly smoother'],
  ['3–7 days', 'Better texture'],
  ['Long-term', 'Consistently soft'],
];

// Scattered "bump" positions inside each texture circle — hand-placed
// rather than a grid so it reads as organic texture, not a pattern.
const BUMPS = [
  [30, 32], [50, 24], [68, 34], [24, 50], [50, 50], [76, 50],
  [32, 68], [50, 76], [68, 66],
];

export default function AnimatedResultsTimeline() {
  return (
    <div style={wrap}>
      <p style={{ ...S.label, textAlign: 'center' }}>See it happen</p>
      <h3 style={heading}>How the glow-up <span style={S.it}>actually plays out.</span></h3>

      <div className="art-row" style={row}>
        {STAGES.map(([when, headline], i) => (
          <div key={when} className={`art-stage art-stage-${i}`} style={stageCol}>
            <svg viewBox="0 0 100 100" width={72} height={72} style={{ display: 'block', margin: '0 auto' }}>
              <circle cx="50" cy="50" r="46" fill="none" stroke={T.line} strokeWidth="1.5" />
              <circle className="art-smooth" cx="50" cy="50" r="46" fill={T.blush} />
              {BUMPS.map(([cx, cy], b) => (
                <circle key={b} className="art-bump" cx={cx} cy={cy} r="4.2" fill={T.ink} />
              ))}
            </svg>
            <div className="art-when" style={artWhen}>{when}</div>
            <div style={{ fontSize: 13, color: T.soft, marginTop: 2 }}>{headline}</div>
          </div>
        ))}
        <div className="art-line" style={lineTrack} aria-hidden="true">
          <div className="art-line-fill" style={lineFill} />
        </div>
      </div>

      <style jsx>{`
        .art-bump { animation: art-bump-fade 9s ease infinite; }
        .art-smooth { opacity: 0; animation: art-smooth-fade 9s ease infinite; }
        .art-when { transition: color 0.4s ease; }
        .art-line-fill { animation: art-line-sweep 9s ease infinite; }

        .art-stage-0 .art-bump { animation-delay: 0s; }
        .art-stage-1 .art-bump { animation-delay: -3s; }
        .art-stage-2 .art-bump { animation-delay: -6s; }
        .art-stage-0 .art-smooth { animation-delay: 0s; }
        .art-stage-1 .art-smooth { animation-delay: -3s; }
        .art-stage-2 .art-smooth { animation-delay: -6s; }
        .art-stage-0 .art-when { animation: art-label-glow 9s ease infinite; animation-delay: 0s; }
        .art-stage-1 .art-when { animation: art-label-glow 9s ease infinite; animation-delay: -3s; }
        .art-stage-2 .art-when { animation: art-label-glow 9s ease infinite; animation-delay: -6s; }

        /* Bumps: full texture at this stage's start, faded smooth by its end. */
        @keyframes art-bump-fade {
          0% { opacity: 1; }
          28% { opacity: 1; }
          33% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes art-smooth-fade {
          0% { opacity: 0; }
          28% { opacity: 0; }
          33% { opacity: 1; }
          100% { opacity: 1; }
        }
        @keyframes art-label-glow {
          0% { color: ${T.ink}; font-weight: 700; }
          31% { color: ${T.ink}; font-weight: 700; }
          34% { color: ${T.soft}; font-weight: 400; }
          100% { color: ${T.soft}; font-weight: 400; }
        }
        @keyframes art-line-sweep {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .art-bump, .art-smooth, .art-when, .art-line-fill { animation: none; }
          .art-smooth { opacity: 1; }
          .art-bump { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

const wrap = { marginTop: 28, paddingTop: 28, borderTop: `1px solid ${T.line}` };
const heading = { fontFamily: T.serif, fontWeight: 400, fontSize: 22, textAlign: 'center', marginTop: 8, marginBottom: 30 };
const row = { position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 };
const stageCol = { textAlign: 'center', position: 'relative', zIndex: 1 };
const artWhen = { fontSize: 13, fontWeight: 700, marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.08em' };
const lineTrack = { position: 'absolute', top: 36, left: '16.6%', right: '16.6%', height: 2, background: T.line, zIndex: 0 };
const lineFill = { height: '100%', background: T.ink };
