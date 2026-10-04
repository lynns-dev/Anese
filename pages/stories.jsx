import React from 'react';
import PageShell from '../components/PageShell';
import AskBox from '../components/AskBox';
import { Lightbox } from '../components/HomeSections';
import { T, S } from '../lib/theme';

const CUSTOMER_PHOTOS = [
  '/images/anese-before-after-1.jpg',
  '/images/anese-before-after-2.jpg',
  '/images/anese-before-after-3.jpg',
  '/images/anese-before-after-4.jpg',
];

// Written stories go here once customers share them through the form below
// and tick the permission box (they land in the admin Inbox). Format:
// { quote, name, age, product, frequency, since }
const STORIES = [];

export default function StoriesPage() {
  const [lightboxIndex, setLightboxIndex] = React.useState(null);
  const close = React.useCallback(() => setLightboxIndex(null), []);
  return (
    <PageShell
      seo={{
        title: 'Real Stories | ANESE',
        description: 'Real ANESE customers, real showers, in their own words — shared with permission.',
        path: '/stories',
      }}
      icon="/images/anese-cloud-recline-icon.png"
      eyebrow="Real people, real showers"
      title={<>Their words. <span style={S.it}>Shared with permission.</span></>}
      intro="No actors, no scripts — just customers who said yes."
    >
      <section style={{ ...S.wrap, paddingBottom: 70 }}>
        {STORIES.length > 0 ? (
          <div className="story-grid" style={storyGrid}>
            {STORIES.map((st) => (
              <figure key={st.quote} style={storyCard}>
                <blockquote style={{ fontFamily: T.serif, fontSize: 24, lineHeight: 1.3, margin: 0 }}>&ldquo;{st.quote}&rdquo;</blockquote>
                <figcaption style={{ fontSize: 13, marginTop: 18 }}>
                  <strong>{st.name}{st.age ? `, ${st.age}` : ''}</strong> · Uses {st.product} {st.frequency} · {st.since}
                  <div style={{ color: T.soft, fontStyle: 'italic', marginTop: 4 }}>Shared with permission</div>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div style={{ ...storyCard, textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
            <p style={{ fontFamily: T.serif, fontSize: 28, lineHeight: 1.25 }}>We're collecting stories right now.</p>
            <p style={{ fontSize: 15, color: T.soft, marginTop: 10 }}>
              Want yours to be one of the first? Tell us about your shower routine below — the good, the meh, all of it.
            </p>
          </div>
        )}
      </section>

      <section style={{ ...S.wrap, paddingBottom: 90, textAlign: 'center' }}>
        <p style={S.label}>Customer photos</p>
        <h2 style={{ ...S.h2, marginTop: 12 }}>Real skin, <span style={S.it}>in real life.</span></h2>
        <p style={{ fontSize: 15, color: T.soft, marginTop: 12 }}>Unfiltered. Tap any photo to take a closer look.</p>
        <div className="photo-grid" style={photoGrid}>
          {CUSTOMER_PHOTOS.map((src, i) => (
            <button key={src} className="gal-card-btn" onClick={() => setLightboxIndex(i)} aria-label={`View photo ${i + 1}`} style={photoBtn}>
              <img src={src} alt="Anese customer" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      </section>

      <section id="share" style={{ padding: '90px 0', background: T.blush, textAlign: 'center' }}>
        <div style={S.wrap}>
          <p style={S.label}>Your turn</p>
          <h2 style={{ ...S.h2, marginTop: 12 }}>Tell us <span style={S.it}>your story.</span></h2>
          <p style={{ fontSize: 15, color: T.soft, marginTop: 14, maxWidth: '50ch', marginLeft: 'auto', marginRight: 'auto' }}>
            How do you use it? What's your shower like? We only share stories with your permission, and only with your first name.
          </p>
          <AskBox mode="story" />
        </div>
      </section>

      <Lightbox images={CUSTOMER_PHOTOS} index={lightboxIndex} onClose={close} onIndex={setLightboxIndex} />
      <style jsx>{`
        @media (max-width: 760px) {
          .story-grid { grid-template-columns: 1fr !important; }
          .photo-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </PageShell>
  );
}

const storyGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 };
const storyCard = { background: T.blush, padding: '34px 32px', margin: 0 };
const photoGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginTop: 40 };
const photoBtn = { overflow: 'hidden', aspectRatio: '4/5', padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', display: 'block', width: '100%' };
