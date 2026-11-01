const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp, observation } = require('./helpers/app-harness.cjs');

test('one full render preserves team counts and earliest milestone evidence across repeated domain use', async () => {
  const app = await createApp();
  app.set('observations', [
    ...Array.from({ length: 50 }, (_, i) => observation('Matt', `Bird ${String(i).padStart(3, '0')}`)),
    observation('Matt', 'Bird 000', { id: 'earlier', date: '2024-01-01', location: 'First field' }),
    observation('Jeff', 'Bird 000'),
    observation('Alex', 'Bird 000'),
  ]);
  app.evaluate('render()');
  assert.equal(Number(app.element('#speciesCount').textContent), 50);
  assert.equal(Number(app.element('#observationCount').textContent), 53);
  assert.equal(Number(app.element('#sharedCount').textContent), 1);
  assert.equal(Number(app.element('#teamLifeListerScore').textContent), 52);
  assert.equal(app.element('#teamSpeciesTable').children.length, 50);
  assert.equal(app.element('#teamTargetsTable').children.length, 49);
  assert.equal(app.element('#speciesTable').children.length, 53);
  assert.deepEqual(app.read('calculateMilestoneBirdBadges("matt").map(b => [b.milestone_number, b.species_common_name, b.date_seen])'), [
    [1, 'Bird 000', '2024-01-01'], [50, 'Bird 049', '2026-01-01'],
  ]);
  assert.equal(app.evaluate('renderDataCache'), null);
});

test('later renders and direct calculations observe replacements and in-place observation changes', async () => {
  const app = await createApp();
  app.set('observations', [observation('Matt', 'Original Bird')]);
  app.evaluate('render()');
  assert.equal(Number(app.element('#teamLifeListerScore').textContent), 1);

  app.set('observations', [observation('Jeff', 'Shared Bird'), observation('Jeff', 'Other Bird')]);
  assert.equal(app.evaluate('getUniqueLifeListSpecies("Matt").length'), 0);
  assert.equal(app.evaluate('speciesGroups().length'), 2);
  app.evaluate('render()');
  assert.equal(Number(app.element('#observationCount').textContent), 2);
  assert.equal(Number(app.element('#teamLifeListerScore').textContent), 2);

  app.set('newRows', [observation('Matt', 'Shared Bird'), observation('Alex', 'Shared Bird')]);
  app.evaluate('observations.push(...newRows)');
  assert.equal(app.evaluate('getUniqueLifeListSpecies("  mAtT  ").length'), 1);
  assert.equal(app.evaluate('speciesGroups().filter(group => group.members.size === 3).length'), 1);
  app.evaluate('render()');
  assert.equal(Number(app.element('#observationCount').textContent), 4);
  assert.equal(Number(app.element('#sharedCount').textContent), 1);
  assert.equal(Number(app.element('#teamLifeListerScore').textContent), 4);

  app.evaluate('observations[0].species = "Changed Bird"');
  assert.equal(app.evaluate('speciesGroups().length'), 3);
  app.evaluate('render()');
  assert.equal(Number(app.element('#speciesCount').textContent), 3);
  assert.equal(Number(app.element('#sharedCount').textContent), 0);

  app.evaluate('observations.length = 0');
  assert.equal(app.evaluate('getUniqueLifeListSpecies("Jeff").length'), 0);
  assert.equal(app.evaluate('speciesGroups().length'), 0);
  app.evaluate('render()');
  assert.equal(Number(app.element('#teamLifeListerScore').textContent), 0);
});

test('a failed DOM render releases its calculations before subsequent data changes', async () => {
  const app = await createApp();
  app.set('observations', [observation()]);
  const table = app.element('#speciesTable');
  const appendChild = table.appendChild;
  table.appendChild = () => { throw new Error('DOM fixture failure'); };
  assert.throws(() => app.evaluate('render()'), /DOM fixture failure/);
  assert.equal(app.evaluate('renderDataCache'), null);
  table.appendChild = appendChild;
  app.set('observations', [observation('Alex', 'New Bird'), observation('Alex', 'Another Bird')]);
  app.evaluate('render()');
  assert.equal(Number(app.element('#speciesCount').textContent), 2);
  assert.equal(Number(app.element('#teamLifeListerScore').textContent), 2);
  assert.equal(app.evaluate('getUniqueLifeListSpecies("Matt").length'), 0);
});

test('date formatting retains local calendar output and a bounded cache across many dates', async () => {
  const app = await createApp();
  const dates = Array.from({ length: 600 }, (_, i) => new Date(Date.UTC(2024, 0, i + 1)).toISOString().slice(0, 10));
  app.set('dateFixture', dates);
  const expected = dates.map(value => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }));
  assert.deepEqual(app.read('dateFixture.map(formatDate)'), expected);
  assert.ok(app.evaluate('displayDateCache.size <= DISPLAY_DATE_CACHE_LIMIT'));
  assert.equal(app.evaluate('displayDateCache.has(dateFixture[0])'), false);
  assert.equal(app.evaluate('formatDate(dateFixture[0])'), expected[0]);
  assert.equal(app.evaluate('formatDate(dateFixture[0])'), expected[0]);
  assert.equal(app.evaluate('formatDate("not-a-date")'), 'not-a-date');
  assert.equal(app.evaluate('formatDate("")'), '');
});
