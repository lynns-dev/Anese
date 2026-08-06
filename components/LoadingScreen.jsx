import React from 'react';
import { T } from '../lib/theme';

// The three illustration icons used across the site (tiger, cloud-burst,
// cloud-recline) — reused here rather than a generic spinner, so even the
// loading state feels like ANESE instead of a default browser wait state.
const ICONS = [
  '/images/anese-tiger-icon.png',
  '/images/anese-cloud-icon.png',
  '/images/anese-cloud-recline-icon.png',
];

// Shown during route transitions (see _app.jsx's router event wiring).
// "Shuffle" here is a staggered scale/opacity bounce per icon rather than
// literal position-swapping — reads as lively motion without the layout
// jitter actual position-swapping would cause on every animation frame.
export default function LoadingScreen() {
  return (
    <div style={overlay} role="status" aria-live="polite" aria-label="Loading">
      <div style={row}>
        {ICONS.map((src, i) => (
          <img key={src} src={src} alt="" className="loading-icon" style={{ ...icon, animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <style jsx>{`
        .loading-icon {
          animation: loading-shuffle 1s ease-in-out infinite;
        }
        @keyframes loading-shuffle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.55; }
          40% { transform: translateY(-14px) scale(1.12); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .loading-icon { animation: none; }
        }
      `}</style>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, zIndex: 999,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: T.white,
};
const row = { display: 'flex', alignItems: 'center', gap: 20 };
const icon = { width: 56, height: 56, display: 'block' };
