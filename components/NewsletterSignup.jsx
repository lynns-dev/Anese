// "Shower Thoughts" newsletter signup. Saves the email as a subscribed
// lead through /api/checkout-lead (lib/checkoutLeadsStore.js), so it shows
// up in the same leads export the email app syncs from.

import React from 'react';
import { T } from '../lib/theme';
import { getSessionId } from '../lib/session';

export default function NewsletterSignup() {
  const [email, setEmail] = React.useState('');
  const [done, setDone] = React.useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    fetch('/api/checkout-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), source: 'newsletter', status: 'subscribed', sessionId: getSessionId(), url: window.location.href }),
      keepalive: true,
    }).catch(() => {});
    setDone(true);
  };

  if (done) {
    return <p className="fade-in" style={{ fontFamily: T.serif, fontSize: 26, marginTop: 8 }}>You're in. First Shower Thought coming soon.</p>;
  }

  return (
    <form style={form} onSubmit={submit}>
      <input type="email" required placeholder="Your email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
      <button type="submit" style={submitBtn}>I'm in</button>
    </form>
  );
}

const form = { display: 'flex', maxWidth: 420, margin: '0 auto', borderBottom: `1px solid ${T.ink}` };
const input = { flex: 1, minWidth: 0, border: 'none', background: 'transparent', padding: '14px 4px', fontFamily: T.sans, fontSize: 15, outline: 'none', color: T.ink };
const submitBtn = { border: 'none', background: 'none', fontFamily: T.sans, fontWeight: 700, fontSize: 13, letterSpacing: '0.04em', cursor: 'pointer', color: T.ink, padding: '0 4px' };
