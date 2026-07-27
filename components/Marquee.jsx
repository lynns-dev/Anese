import React from 'react';
import { T } from '../lib/theme';

const DEFAULT_MESSAGES = ['Free shipping over $50', 'Cruelty-free', 'Clean beauty', 'Thousands of reviews'];

// Seamless scrolling marquee — repeats the message set 4x and animates
// exactly one set-width of translation so the loop point is invisible.
export default function Marquee({ messages = DEFAULT_MESSAGES }) {
  const loop = [...messages, ...messages, ...messages, ...messages];
  return (
    <div style={wrap}>
      <div className="marquee-track" style={track}>
        {loop.map((m, i) => (
          <span key={i} style={item}>{m}</span>
        ))}
      </div>
      <style jsx>{`
        .marquee-track { animation: anese-marquee 24s linear infinite; }
        @keyframes anese-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-25%); }
        }
      `}</style>
    </div>
  );
}

const wrap = { overflow: 'hidden', background: T.blush, borderTop: `1px solid ${T.line}` };
const track = { display: 'flex', width: 'max-content', whiteSpace: 'nowrap', padding: '14px 0' };
const item = {
  display: 'inline-flex', alignItems: 'center', color: T.ink, fontFamily: T.sans,
  fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 18px',
};
