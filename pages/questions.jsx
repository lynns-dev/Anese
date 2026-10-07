import React from 'react';
import Link from 'next/link';
import PageShell from '../components/PageShell';
import AskBox from '../components/AskBox';
import { MythFacts, Faq } from '../components/HomeSections';
import { getProductById } from '../lib/products';
import { QUESTION_TOPICS, FAQS } from '../lib/brandContent';
import { T, S } from '../lib/theme';

// "No Awkward Questions" — the question library. Starts with the questions
// we already answer on the homepage; answered inbox questions get added to
// QUESTION_TOPICS in lib/brandContent.js as they come in.
export default function QuestionsPage() {
  return (
    <PageShell
      seo={{
        title: 'No Awkward Questions | ANESE',
        description: 'Butt breakouts, bumpy skin, stretch marks, sensitive skin — straight, judgment-free answers to the skin questions people are shy to ask.',
        path: '/questions',
      }}
      icon="/images/anese-tiger-icon.png"
      eyebrow="No awkward questions"
      title={<>The questions you'd only ask <span style={S.it}>your best friend.</span></>}
      intro="Straight answers, no scare tactics. And if yours isn't here, ask — anonymous if you want."
    >
      {(c) => (
        <>
          <section style={{ ...S.wrap, paddingBottom: 70 }}>
            <div className="qa-grid" style={qaGrid}>
              {QUESTION_TOPICS.map((t) => {
                const product = getProductById(t.product);
                return (
                  <article key={t.question} style={qaCard}>
                    <h2 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 22, lineHeight: 1.15, marginBottom: 14 }}>&ldquo;{t.question}&rdquo;</h2>
                    <p style={{ fontSize: 15, marginBottom: 14 }}>{t.answer}</p>
                    <p style={{ fontSize: 13, color: T.soft, paddingLeft: 12, borderLeft: `2px solid ${T.clay}`, marginBottom: 18 }}>
                      <strong style={{ fontWeight: 600 }}>Honest tip:</strong> {t.tip}
                    </p>
                    {product && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${T.line}` }}>
                        <img src={product.images[0]} alt="" style={{ width: 56, height: 56, objectFit: 'contain', background: T.white }} />
                        <div style={{ flex: 1, fontSize: 14 }}>
                          <Link href={`/product/${product.id}`} style={{ fontWeight: 600 }}>{product.name}</Link>
                          <div style={{ color: T.soft }}>${product.price}</div>
                        </div>
                        <button onClick={() => c.add(product)} style={addBtn}>Add to shower</button>
                      </div>
                    )}
                    {t.more && <Link href={t.more.href} style={{ ...S.link, marginTop: 14, alignSelf: 'flex-start' }}>{t.more.label}</Link>}
                  </article>
                );
              })}
            </div>
          </section>

          <section style={{ padding: '90px 0', background: T.ink, color: T.white, textAlign: 'center' }}>
            <div style={S.wrap}>
              <p style={{ ...S.label, color: T.white }}>Your turn</p>
              <h2 style={{ ...S.h2, color: T.white, marginTop: 12 }}>Asking for a friend? <span style={{ ...S.it, color: T.white }}>We'll answer for your friend.</span></h2>
              <AskBox mode="question" dark />
            </div>
          </section>

          <section style={{ padding: '90px 0', textAlign: 'center' }}>
            <div style={S.wrap}>
              <p style={S.label}>The honest version</p>
              <h2 style={{ ...S.h2, marginTop: 12 }}>Straight answers. <span style={S.it}>No scare tactics.</span></h2>
              <MythFacts />
            </div>
          </section>

          <section style={{ padding: '0 0 90px', textAlign: 'center' }}>
            <div style={S.wrap}>
              <p style={S.label}>The practical stuff</p>
              <h2 style={{ ...S.h2, marginTop: 12 }}>Asked <span style={S.it}>&amp; answered.</span></h2>
              <Faq items={FAQS} />
            </div>
          </section>
          <style jsx>{`
            @media (max-width: 760px) { .qa-grid { grid-template-columns: 1fr !important; } }
          `}</style>
        </>
      )}
    </PageShell>
  );
}

const qaGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 };
const qaCard = { display: 'flex', flexDirection: 'column', background: T.blush, padding: '32px 30px' };
const addBtn = { ...S.btnFill, height: 40, padding: '0 16px', fontSize: 13 };
