// "Shower Thoughts" newsletter signup. Adds the email straight to the
// marketing list (/api/email/subscribe, lib/email/), which sends the
// welcome series with the WELCOME15 code.

import React from 'react';
import { T } from '../lib/theme';
import { rememberIdentity } from '../lib/identity';

export default function NewsletterSignup() {
  const [email, setEmail] = React.useState('');
  const [state, setState] = React.useState('idle'); // idle | sending | done
  const [error, setError] = React.useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || state === 'sending') return;
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/email/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      rememberIdentity({ email });
      setState('done');
    } catch (err) {
      setError(err.message);
      setState('idle');
    }
  };

  if (state === 'done') {
    return <p className="fade-in" style={{ fontFamily: T.serif, fontSize: 21, marginTop: 8 }}>You're in. Check your inbox for 15% off.</p>;
  }

  return (
    <>
      <form style={form} onSubmit={submit}>
        <input type="email" required placeholder="Your email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
        <button type="submit" style={submitBtn} disabled={state === 'sending'}>{state === 'sending' ? '…' : "I'm in"}</button>
      </form>
      {error && <p style={{ fontSize: 13, marginTop: 10, color: '#a13d2b' }}>{error}</p>}
    </>
  );
}

const form = { display: 'flex', maxWidth: 420, margin: '0 auto', borderBottom: `1px solid ${T.ink}` };
const input = { flex: 1, minWidth: 0, border: 'none', background: 'transparent', padding: '14px 4px', fontFamily: T.sans, fontSize: 15, outline: 'none', color: T.ink };
const submitBtn = { border: 'none', background: 'none', fontFamily: T.sans, fontWeight: 700, fontSize: 13, letterSpacing: '0.04em', cursor: 'pointer', color: T.ink, padding: '0 4px' };
