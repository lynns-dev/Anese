// Full-bleed product grid in the Glossier / Rhode style: edge-to-edge
// tiles on a soft neutral background, name + price in small type
// underneath, a second photo on hover and a quick-add button that slides
// up over the tile (always visible on touch screens, which can't hover).
// Used by the homepage collection and /shop.

import React from 'react';
import Link from 'next/link';
import { PRODUCT_ONE_LINERS } from '../lib/brandContent';
import { T } from '../lib/theme';

const TILE_BG = '#F0E6DC'; // warm, soft cream-beige

export default function ProductGrid({ products, onAdd, reviews = {} }) {
  return (
    <div className="pgrid">
      {products.map((p) => {
        const hoverImg = p.images?.[1];
        const r = reviews[p.id];
        return (
          <div key={p.id} className="pgrid-item">
            <div className="pgrid-tile">
              <Link href={`/product/${p.id}`} className="pgrid-link" aria-label={p.name}>
                {p.badge && <span className="pgrid-badge">{p.badge}</span>}
                <img src={p.images?.[0]} alt={p.name} className="pgrid-img" />
                {hoverImg && <img src={hoverImg} alt="" aria-hidden="true" className="pgrid-img-hover" />}
              </Link>
              <button type="button" className="pgrid-add" onClick={() => onAdd(p)} aria-label={`Add ${p.name} to cart`}>
                <span className="pgrid-add-full">Add to shower — ${p.price}</span>
                <span className="pgrid-add-plus" aria-hidden="true">+</span>
              </button>
            </div>
            <Link href={`/product/${p.id}`} className="pgrid-text">
              <span className="pgrid-row">
                <span className="pgrid-name">{p.name}</span>
                <span className="pgrid-price">${p.price}</span>
              </span>
              <span className="pgrid-line">{PRODUCT_ONE_LINERS[p.id] || p.tagline}</span>
              {r?.count > 0 && (
                <span className="pgrid-rating">
                  {'★'.repeat(Math.round(r.average))}{'☆'.repeat(5 - Math.round(r.average))} <span>({r.count})</span>
                </span>
              )}
            </Link>
          </div>
        );
      })}

      <style jsx>{`
        .pgrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 3px;
          width: 100%;
        }
        .pgrid-tile {
          position: relative;
          aspect-ratio: 4 / 5;
          background: ${TILE_BG};
          overflow: hidden;
        }
        .pgrid :global(.pgrid-link) { position: absolute; inset: 0; display: block; }
        .pgrid-img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: contain; padding: 10%; box-sizing: border-box;
          /* Product shots on white backgrounds blend into the tile colour. */
          mix-blend-mode: multiply;
          transition: transform .6s ease, opacity .45s ease;
        }
        .pgrid-img-hover {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; opacity: 0; transition: opacity .45s ease;
        }
        .pgrid-tile:hover .pgrid-img { transform: scale(1.04); }
        .pgrid-tile:hover .pgrid-img-hover { opacity: 1; }
        .pgrid-badge {
          position: absolute; top: 14px; left: 14px; z-index: 2;
          font-family: ${T.sans}; font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase;
          color: ${T.ink}; background: ${T.white}; padding: 5px 10px; border-radius: 999px;
        }
        .pgrid-add {
          position: absolute; left: 12px; right: 12px; bottom: 12px; z-index: 3;
          height: 46px; border: none; cursor: pointer;
          background: ${T.ink}; color: ${T.white};
          font-family: ${T.sans}; font-size: 13px; font-weight: 600; letter-spacing: 0.02em;
          opacity: 0; transform: translateY(10px); transition: opacity .3s ease, transform .3s ease;
        }
        .pgrid-tile:hover .pgrid-add, .pgrid-add:focus-visible { opacity: 1; transform: none; }
        .pgrid-add-plus { display: none; }
        .pgrid :global(.pgrid-text) {
          display: flex; flex-direction: column; gap: 4px;
          padding: 14px 16px 30px; color: ${T.ink}; text-align: left;
        }
        .pgrid-row { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
        .pgrid-name { font-family: ${T.sans}; font-size: 14px; font-weight: 600; }
        .pgrid-price { font-family: ${T.sans}; font-size: 14px; }
        .pgrid-line { font-family: ${T.sans}; font-size: 13px; color: ${T.soft}; opacity: 0.8; }
        .pgrid-rating { font-size: 12px; letter-spacing: 1px; }
        .pgrid-rating span { letter-spacing: 0; opacity: 0.7; }

        /* Touch screens can't hover: a small round + in the corner instead
           of a bar covering the product. */
        @media (hover: none) {
          .pgrid-add {
            opacity: 1; transform: none; left: auto; right: 10px; bottom: 10px;
            width: 40px; height: 40px; border-radius: 50%; padding: 0;
            font-size: 22px; font-weight: 400; line-height: 1;
          }
          .pgrid-add-full { display: none; }
          .pgrid-add-plus { display: inline; }
        }
        @media (max-width: 900px) {
          .pgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .pgrid :global(.pgrid-text) { padding: 12px 12px 24px; }
          .pgrid-name, .pgrid-price { font-size: 13px; }
          .pgrid-line { font-size: 12px; }
        }
      `}</style>
    </div>
  );
}
