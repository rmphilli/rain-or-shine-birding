const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp, observation } = require('./helpers/app-harness.cjs');

function ledgerRows(count) {
  return Array.from({ length: count }, (_, i) => observation('Matt', `Ledger Bird ${String(i).padStart(3, '0')}`));
}

function visibleSpecies(app) {
  return app.element('#speciesTable').children.map(row => row.innerHTML.match(/<strong>([^<]+)<\/strong>/)[1]);
}

test('ledger pages mount at most 100 rows and cover the complete ordered ledger once', async () => {
  const app = await createApp();
  const rows = ledgerRows(237);
  app.set('observations', [...rows].reverse());
  app.evaluate('renderSpeciesTable()');
  assert.equal(app.element('#speciesTable').children.length, 100);
  assert.equal(app.element('#ledgerPageStatus').textContent, 'Showing 1–100 of 237 ledger entries. Page 1 of 3.');
  assert.equal(app.element('#ledgerPrevious').disabled, true);
  assert.equal(app.element('#ledgerNext').disabled, false);
  const collected = visibleSpecies(app);
  app.element('#ledgerTableWrap').scrollTop = 500;
  await app.element('#ledgerNext').dispatch('click');
  assert.equal(app.element('#ledgerTableWrap').scrollTop, 0);
  assert.equal(app.element('#speciesTable').children.length, 100);
  collected.push(...visibleSpecies(app));
  await app.element('#ledgerNext').dispatch('click');
  assert.equal(app.element('#speciesTable').children.length, 37);
  assert.equal(app.element('#ledgerPageStatus').textContent, 'Showing 201–237 of 237 ledger entries. Page 3 of 3.');
  assert.equal(app.element('#ledgerNext').disabled, true);
  collected.push(...visibleSpecies(app));
  assert.deepEqual(collected, rows.map(row => row.species));
  assert.equal(new Set(collected).size, 237);
  assert.equal(app.evaluate('observations.length'), 237);
  await app.element('#ledgerNext').dispatch('click');
  assert.equal(app.element('#speciesTable').children.length, 37);
});

test('global ledger search finds later-page observations and retains aggregated X counts and member pills', async () => {
  const app = await createApp();
  const rows = ledgerRows(237);
  rows[211] = observation('Jeff', 'Ledger Bird 211', { count: 'X', location: 'Hidden marsh' });
  app.set('observations', [...rows, { ...rows[211], id: 'second-observation', count: '2' }]);
  app.evaluate('renderSpeciesTable()');
  assert.equal(visibleSpecies(app).includes('Ledger Bird 211'), false);
  app.element('#speciesSearch').value = 'hidden MARSH';
  await app.element('#speciesSearch').dispatch('input');
  assert.deepEqual(visibleSpecies(app), ['Ledger Bird 211']);
  assert.match(app.element('#speciesTable').children[0].innerHTML, /class="pill">Jeff<\/span>/);
  assert.match(app.element('#speciesTable').children[0].innerHTML, /<td>2\+<\/td>/);
  assert.equal(app.element('#ledgerPageStatus').textContent, 'Showing 1–1 of 1 ledger entries. Page 1 of 1.');
  assert.equal(app.element('#ledgerPrevious').disabled, true);
  assert.equal(app.element('#ledgerNext').disabled, true);
  assert.equal(app.evaluate('observations.length'), 238);
});

test('search resets the ledger page and changed data clamps it without losing the final row', async () => {
  const app = await createApp();
  const rows = ledgerRows(250);
  app.set('observations', rows);
  app.evaluate('renderSpeciesTable()');
  await app.element('#ledgerNext').dispatch('click');
  await app.element('#ledgerNext').dispatch('click');
  assert.match(app.element('#ledgerPageStatus').textContent, /Page 3 of 3/);
  app.element('#speciesSearch').value = 'Ledger';
  await app.element('#speciesSearch').dispatch('input');
  assert.match(app.element('#ledgerPageStatus').textContent, /Showing 1–100.*Page 1 of 3/);
  await app.element('#ledgerNext').dispatch('click');
  await app.element('#ledgerNext').dispatch('click');
  app.set('observations', rows.slice(0, 101));
  app.evaluate('renderSpeciesTable()');
  assert.deepEqual(visibleSpecies(app), ['Ledger Bird 100']);
  assert.equal(app.element('#ledgerPageStatus').textContent, 'Showing 101–101 of 101 ledger entries. Page 2 of 2.');
  assert.equal(app.element('#ledgerPrevious').disabled, false);
  assert.equal(app.element('#ledgerNext').disabled, true);
  await app.element('#ledgerPrevious').dispatch('click');
  assert.equal(app.element('#speciesTable').children.length, 100);
  assert.equal(app.element('#ledgerPrevious').disabled, true);
});

test('empty results and exact one-page lists keep the existing empty state and correct paging boundaries', async () => {
  const app = await createApp();
  app.set('observations', ledgerRows(100));
  app.evaluate('renderSpeciesTable()');
  assert.equal(app.element('#speciesTable').children.length, 100);
  assert.equal(app.element('#ledgerPageStatus').textContent, 'Showing 1–100 of 100 ledger entries. Page 1 of 1.');
  assert.equal(app.element('#tableEmpty').style.display, 'none');
  assert.equal(app.element('#ledgerNext').disabled, true);
  app.element('#speciesSearch').value = 'No matching bird';
  await app.element('#speciesSearch').dispatch('input');
  assert.equal(app.element('#speciesTable').children.length, 0);
  assert.equal(app.element('#tableEmpty').style.display, 'block');
  assert.equal(app.element('#ledgerPageStatus').textContent, 'Showing 0–0 of 0 ledger entries. Page 0 of 0.');
  assert.equal(app.element('#ledgerPrevious').disabled, true);
  assert.equal(app.element('#ledgerNext').disabled, true);
  app.set('observations', []);
  app.element('#speciesSearch').value = '';
  await app.element('#speciesSearch').dispatch('input');
  assert.equal(app.element('#speciesTable').children.length, 0);
  assert.equal(app.element('#tableEmpty').style.display, 'block');
});

test('ledger paging and search leave other panels, local data, and cloud writes untouched', async () => {
  const app = await createApp();
  app.set('observations', ledgerRows(201));
  app.evaluate('renderSpeciesTable()');
  const panelSelectors = ['#memberBreakdown', '#profileTrophyCase', '#birderTypeBadges', '#teamSpeciesTable', '#teamTargetsTable'];
  const panelChildren = panelSelectors.map(selector => app.element(selector).children);
  const savedBefore = [...app.saved.entries()];
  const observationsBefore = app.read('observations');
  app.configureCloud();
  app.set('sharedDataLoaded', true);
  await app.element('#ledgerNext').dispatch('click');
  await app.element('#ledgerPrevious').dispatch('click');
  app.element('#speciesSearch').value = 'Ledger Bird 200';
  await app.element('#speciesSearch').dispatch('input');
  await app.settle();
  panelSelectors.forEach((selector, i) => assert.strictEqual(app.element(selector).children, panelChildren[i]));
  assert.deepEqual([...app.saved.entries()], savedBefore);
  assert.deepEqual(app.read('observations'), observationsBefore);
  assert.equal(app.calls.length, 0);
});
