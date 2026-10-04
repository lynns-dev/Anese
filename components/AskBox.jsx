// The "Ask us anything" and "Share your story" forms. Both post to
// /api/ask, which drops the submission in the admin Inbox — nothing is
// published automatically. mode="question" | "story".

import React from 'react';
import { T, S } from '../lib/theme';

const COPY = {
  question: {
    placeholder: 'Okay so… is it normal that…',
    emailLabel: 'Want the answer in your inbox? (optional)',
    button: 'Send it',
    done: 'Got it. No judgment, just answers. Talk soon.',
  },
  story: {
    placeholder: 'What’s your shower routine like? What changed? Tell it your way.',
    emailLabel: 'Email (optional, in case we have a follow-up question)',
    button: 'Share my story',
    done: 'Thank you for sharing. We read every one.',
  },
};

export default function AskBox({ mode = 'question', dark = false }) {
  const copy = COPY[mode];
  const [text, setText] = React.useState('');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [permission, setPermission] = React.useState(false);
  const [website, setWebsite] = React.useState('');
  const [state, setState] = React.useState('idle'); // idle | sending | done
  const [error, setError] = React.useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setState('sending');
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: mode, text, name, email, permission, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again?');
      setState('done');
    } catch (err) {
      setError(err.message);
      setState('idle');
    }
  };

  const ink = dark ? T.white : T.ink;
  const line = dark ? 'rgba(255,255,255,0.35)' : T.line;

  if (state === 'done') {
    return (
      <div className="fade-in" style={{ ...box, borderColor: line, color: ink, textAlign: 'center', padding: '40px 28px' }}>
        <p style={{ fontFamily: T.serif, fontSize: 30, lineHeight: 1.15 }}>{copy.done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ ...box, borderColor: line, color: ink }}>
      <textarea
        required
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={copy.placeholder}
        aria-label={mode === 'story' ? 'Your story' : 'Your question'}
        rows={mode === 'story' ? 6 : 4}
        maxLength={2000}
        style={{ ...field, minHeight: mode === 'story' ? 150 : 110, resize: 'vertical', borderColor: line, color: ink }}
      />
      {mode === 'story' && (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First name (or a nickname — your call)"
          aria-label="First name"
          maxLength={80}
          style={{ ...field, borderColor: line, color: ink }}
        />
      )}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={copy.emailLabel}
        aria-label="Email"
        style={{ ...field, borderColor: line, color: ink }}
      />
      {/* Honeypot — hidden from people, irresistible to bots. */}
      <input
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
        name="website"
      />
      {mode === 'story' && (
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, textAlign: 'left', lineHeight: 1.5 }}>
          <input type="checkbox" required checked={permission} onChange={(e) => setPermission(e.target.checked)} style={{ marginTop: 3 }} />
          <span>It's okay for ANESE to share my story (with my first name only) on the website and social. We'll never use your last name or email.</span>
        </label>
      )}
      {mode === 'question' && (
        <p style={{ fontSize: 12, opacity: 0.75, textAlign: 'left', margin: 0 }}>
          Anonymous unless you add your email. Our favorite questions may be shared — never with your name.
        </p>
      )}
      {error && <p role="alert" style={{ fontSize: 13, color: dark ? '#ffd1d9' : '#a13d2b', margin: 0 }}>{error}</p>}
      <button
        type="submit"
        disabled={state === 'sending'}
        style={{
          ...S.btnFill, alignSelf: 'flex-start', height: 50,
          opacity: state === 'sending' ? 0.6 : 1,
        }}
      >
        {state === 'sending' ? 'Sending…' : copy.button}
      </button>
    </form>
  );
}

const box = {
  position: 'relative', display: 'flex', flexDirection: 'column', gap: 14,
  maxWidth: 620, margin: '36px auto 0', padding: 28, border: '1px solid', textAlign: 'left',
};
const field = {
  width: '100%', padding: '14px 16px', border: '1px solid', background: 'transparent',
  fontFamily: T.sans, fontSize: 15, outline: 'none', boxSizing: 'border-box',
};
