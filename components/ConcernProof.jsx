import React from 'react';
import { CONCERN_PHOTOS } from '../lib/concernProof';

export default function ConcernProof({ concern }) {
  const [data, setData] = React.useState({ reviews: [], count: 0 });
  const [limit, setLimit] = React.useState(6);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [retry, setRetry] = React.useState(0);
  React.useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    Promise.all(Array.from({ length: limit / 6 }, (_, page) => fetch(`/api/concern-reviews?concern=${concern}&offset=${page * 6}`, { signal: controller.signal, cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error('Unavailable'); return r.json(); })))
      .then((pages) => { if (active) setData({ reviews: pages.flatMap((p) => p.reviews), count: pages[0].count }); })
      .catch((e) => { if (active && e.name !== 'AbortError') setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [concern, limit, retry]);
  const [selectedPhoto, setSelectedPhoto] = React.useState(0);
  const photos = CONCERN_PHOTOS[concern];
  const photo = photos[selectedPhoto];
  const subject = concern === 'spots' ? 'dark spots and marks' : 'butt acne and bumps';
  return <section className="concern-evidence" aria-labelledby="concern-evidence-title">
    <div className="concern-section-heading"><p className="concern-label">That Booty Tho. / Customer experiences</p><h2 id="concern-evidence-title">The {subject} conversation.</h2><p>Reviews mentioning this concern, pulled from our published That Booty Tho. feed. Customers’ own words, with their full context.</p></div>
    <figure className="concern-before-after">
      <img className="concern-comparison" src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" />
      <div className="concern-photo-picker" role="group" aria-label="Choose a customer comparison">{photos.map((item, index) => <button type="button" className="concern-photo-choice" key={item.src} aria-pressed={selectedPhoto === index} aria-label={`Show comparison ${index + 1} of ${photos.length}: ${item.caption}`} onClick={() => setSelectedPhoto(index)}><img src={item.src} alt="" width={item.width} height={item.height} loading="lazy" /><span>Photo {index + 1}</span></button>)}</div>
      <figcaption><strong>{photo.caption}</strong><br />Customer comparisons, shown as supplied. Timing and full routine aren’t documented; lighting and pose differ. Individual experiences, not clinical evidence or promised results.<br /><a className="concern-full-photo" href={photo.src} target="_blank" rel="noreferrer">View full-size comparison ↗</a></figcaption>
    </figure>
    <div className="concern-review-heading"><h3>What customers shared</h3><p>Some reviewers used other products too. Their experiences don’t establish that this scrub treats acne or fades pigmentation.</p></div>
    <div aria-live="polite" aria-busy={loading}>
      {loading && data.reviews.length === 0 && <p>Loading concern-specific reviews…</p>}
      {error && <p>We couldn’t load the latest reviews. <button type="button" className="concern-text-button" onClick={() => setRetry((n) => n + 1)}>Try again</button></p>}
      {!loading && !error && data.count === 0 && <p>No published reviews matching this concern are available yet.</p>}
      <div className="concern-review-grid">{data.reviews.map((r) => <article className="concern-review" key={r.id || `${r.author}:${r.text}`}><p className="concern-rating" aria-label={`${r.rating} out of 5 stars`}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</p><blockquote>“{r.text}”</blockquote><p className="concern-review-author">— {r.author || 'Anonymous'}</p></article>)}</div>
      {data.reviews.length > 0 && <p className="concern-review-count">Showing {data.reviews.length} of {data.count} matching published reviews.</p>}
      {data.reviews.length < data.count && <button type="button" className="concern-more" disabled={loading} onClick={() => setLimit((n) => n + 6)}>{loading ? 'Loading…' : 'Read more reviews'}</button>}
    </div>
  </section>;
}
