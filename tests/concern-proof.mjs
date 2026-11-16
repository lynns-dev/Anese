import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const context = vm.createContext({});
const proof = new vm.SourceTextModule(await fs.readFile('lib/concernProof.js', 'utf8'), { context });
await proof.link(() => {}); await proof.evaluate();
const { selectConcernReviews, CONCERN_PHOTOS } = proof.namespace;
const rows = [
  { id: 'marks', text: 'Dark spots on my booty. No change yet.', author: 'A', status: 'approved', rating: 3 },
  { id: 'bumps', text: 'I have butt acne and rough bumps.', author: 'B', status: 'approved', rating: 4 },
  { id: 'chest', text: 'Boobies scrub for chest acne and dark spots.', author: 'C', status: 'approved', rating: 5 },
  { id: 'face', text: 'Face acne and dark spots.', author: 'D', status: 'approved', rating: 5 },
  { id: 'soft', text: 'Very soft skin.', author: 'E', status: 'approved', rating: 5 },
  { id: 'pending', text: 'Butt acne.', author: 'F', status: 'pending', rating: 5 },
  { id: 'low', text: 'Butt acne.', author: 'G', status: 'approved', rating: 2 },
];
assert.deepEqual(Array.from(selectConcernReviews(rows, 'spots'), r=>r.id), ['marks']);
// Face-only matches must be excluded even when the concern is dark spots.
assert.deepEqual(Array.from(selectConcernReviews(rows.slice(0,5), 'bumps'), r=>r.id), ['bumps']);
assert.equal(selectConcernReviews([rows[0], rows[0]], 'spots').length, 1);
assert.equal(selectConcernReviews([{ text: 'Bumps in between and under the girls.' }], 'bumps').length, 0);
assert.equal(selectConcernReviews([{ text: 'Helped my dark spots.' }], 'spots').length, 0);
assert.equal(selectConcernReviews([{ text: 'Blemishes persist but I do enjoy the booty scrub, it has far more exfoliant.' }], 'bumps').length, 0);
assert.equal(selectConcernReviews([{ text: 'My butne is unchanged.' }], 'bumps').length, 1);
assert.equal(CONCERN_PHOTOS.spots[0].src, '/images/anese-proof-diana-spots.jpg');
assert.equal(CONCERN_PHOTOS.bumps[0].src, '/images/anese-before-after-3.jpg');
for (const photo of Object.values(CONCERN_PHOTOS).flat()) await fs.access('public'+photo.src);
const store = new vm.SyntheticModule(['getReviews'], function() { this.setExport('getReviews', async id => id === 'that-booty-tho' ? rows : []); }, { context });
const api = new vm.SourceTextModule(await fs.readFile('pages/api/concern-reviews.js', 'utf8'), { context });
await api.link(spec => spec.includes('reviewsStore') ? store : proof); await api.evaluate();
async function request(query, method='GET') {
  let code=200, body; const headers={};
  const res={setHeader:(k,v)=>headers[k]=v,status:n=>{code=n;return res},json:v=>{body=v;return res}};
  await api.namespace.default({query,method},res); return {code,body,headers};
}
let response=await request({concern:'spots'});
assert.equal(response.code,200); assert.equal(response.body.count,1); assert.equal(response.body.reviews[0].text,rows[0].text);
assert.equal(response.headers['Cache-Control'],'no-store');
response=await request({concern:'bumps'}); assert.equal(response.body.count,1); assert.equal(response.body.reviews[0].id,'bumps');
assert.equal((await request({concern:'wrong'})).code,400);
assert.equal((await request({concern:'spots',offset:'-1'})).code,400);
assert.equal((await request({concern:'spots'},'POST')).code,405);
assert.equal((await request({concern:'spots',offset:'6'})).body.reviews.length,0);
console.log('PASS: concern matching, unrelated-product exclusion, deduplication, exact review text, public eligibility, pagination, no-store, validation and issue-specific assets.');
