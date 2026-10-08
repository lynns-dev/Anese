// "Shower Thoughts" newsletter signup. Same signup as the popup
// (lib/useSignup.js -> /api/email/signup): email AND mobile, both required.
// The email joins the marketing list and gets the welcome series; the mobile
// number is an SMS opt-in. The WELCOME15 code is then shown right here.

import React from 'react';
import Link from 'next/link';
import { T } from '../lib/theme';
import { useSignup } from '../lib/useSignup';
import SignupCode from './SignupCode';

// Kept word-for-word in sync with SMS_CONSENT_TEXT in lib/email/smsStore.js,
// which is what gets stored as the consent record.
const SMS_DISCLOSURE =
  'By entering your number, you agree to receive recurring automated marketing text messages from ANESE at this number. '
  + 'Consent is not a condition of purchase. Message frequency varies. Message and data rates may apply. '
  + 'Reply STOP to cancel, HELP for help.';

export default function NewsletterSignup() {
  const { email, setEmail, phone, setPhone, submitting, error, done, submit } = useSignup({ source: 'newsletter', leadName: 'Newsletter form' });

  if (done) {
    return (
      <div className="fade-in" style={{ marginTop: 8 }}>
        <p style={{ fontFamily: T.serif, fontSize: 21, margin: '0 0 12px' }}>{done.already ? 'Welcome back.' : "You're in."}</p>
        <SignupCode done={done} center />
      </div>
    );
  }

  return (
    <>
      <form style={form} onSubmit={submit} noValidate>
        <div style={row}>
          <input type="email" required placeholder="Your email" aria-label="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
        </div>
        <div style={row}>
          <input type="tel" required placeholder="Mobile number" aria-label="Mobile number" autoComplete="tel-national" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={input} />
          <button type="submit" style={submitBtn} disabled={submitting}>{submitting ? '…' : 'Reveal my code'}</button>
        </div>
      </form>
      {error && <p role="alert" style={{ fontSize: 13, marginTop: 10, color: '#a13d2b' }}>{error}</p>}
      <p style={legal}>
        {SMS_DISCLOSURE} See our <Link href="/terms" style={legalLink}>Terms</Link> and <Link href="/privacy" style={legalLink}>Privacy Policy</Link>.
      </p>
    </>
  );
}

const form = { display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 420, margin: '0 auto' };
const row = { display: 'flex', borderBottom: `1px solid ${T.ink}` };
const input = { flex: 1, minWidth: 0, border: 'none', background: 'transparent', padding: '14px 4px', fontFamily: T.sans, fontSize: 15, outline: 'none', color: T.ink };
const submitBtn = { border: 'none', background: 'none', fontFamily: T.sans, fontWeight: 700, fontSize: 13, letterSpacing: '0.04em', cursor: 'pointer', color: T.ink, padding: '0 4px', whiteSpace: 'nowrap' };
const legal = { fontSize: 10.5, lineHeight: 1.55, color: T.soft, maxWidth: 420, margin: '14px auto 0' };
const legalLink = { color: T.soft, textDecoration: 'underline' };
