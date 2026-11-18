const test = require('node:test');
const assert = require('node:assert');
const { loadSeed } = require('../seed');

test('seed data contains unique dealer ids and required fields', () => {
  const seed = loadSeed();
  const ids = seed.dealers.map((dealer) => dealer.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'dealer ids must be unique');
  for (const dealer of seed.dealers) {
    for (const field of ['full_name', 'city', 'state', 'zip']) {
      assert.ok(dealer[field], `dealer ${dealer.id} missing ${field}`);
    }
  }
});

test('seed data includes Kansas dealers for Task 11', () => {
  const seed = loadSeed();
  const kansas = seed.dealers.filter((dealer) => dealer.state.toLowerCase() === 'kansas');
  assert.ok(kansas.length >= 2, 'expected at least two Kansas dealers');
});

test('every seeded review references an existing dealer', () => {
  const seed = loadSeed();
  const ids = new Set(seed.dealers.map((dealer) => dealer.id));
  for (const review of seed.reviews) {
    assert.ok(ids.has(review.dealer_id), `review references missing dealer ${review.dealer_id}`);
  }
});
