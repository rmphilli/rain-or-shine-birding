const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createApp, observation, root } = require('./helpers/app-harness.cjs');

test('CSV handles BOM, CRLF, commas, escaped quotes, multiline fields, and blank rows', async () => {
  const app = await createApp();
  app.set('csvFixture', '\uFEFFCommon Name,Location,Count\r\n"Northern Cardinal","Park, \"\"North\"\"\nTrail",X\r\n\r\nBlue Jay,Yard,2');
  assert.deepEqual(app.read('parseCsv(csvFixture)'), [
    { 'Common Name': 'Northern Cardinal', Location: 'Park, "North"\nTrail', Count: 'X' },
    { 'Common Name': 'Blue Jay', Location: 'Yard', Count: '2' },
  ]);
});

test('header aliases normalize member, location, coordinates, missing values and discard species-less rows', async () => {
  const app = await createApp();
  app.set('csvFixture', 'English Name,Latin Name,Observation Date,How Many,Lat,Lon,Site,Checklist ID\nblue jay,Cyanocitta cristata,2026-01-02,X,0,-89,Backyard,S1\n,,,,,,,\nNorthern Cardinal,,,,bad,,,');
  const rows = app.read('normalizeRows(parseCsv(csvFixture), "  mAtT ", "alias.csv")');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].member, 'Matt'); assert.equal(rows[0].species, 'Blue Jay');
  assert.equal(rows[0].scientific, 'Cyanocitta cristata'); assert.equal(rows[0].latitude, 0);
  assert.equal(rows[0].longitude, -89); assert.equal(rows[0].count, 'X');
  assert.equal(rows[0].date, '2026-01-02'); assert.equal(rows[0].checklist, 'S1');
  assert.equal(rows[1].latitude, null); assert.equal(rows[1].location, 'Unlisted place');
});

test('real upload handler replaces only the selected member and persists the local collection', async () => {
  const app = await createApp();
  app.set('observations', [observation('Jeff', 'Old Jeff Bird'), observation('Alex', 'Blue Jay')]);
  await app.importCsv('Jeff', 'Species,Date\nNorthern Cardinal,2026-01-02');
  assert.deepEqual(app.read('observations.map(o => [o.member, o.species])'), [['Alex', 'Blue Jay'], ['Jeff', 'Northern Cardinal']]);
  assert.equal(JSON.parse(app.saved.get('rainOrShineBirdingData')).length, 2);
  assert.equal(app.calls.length, 0);
});

test('empty/header-only/missing-species imports preserve existing rows and report failure', async () => {
  for (const csv of ['', 'Species,Date', 'Wrong,Date\nBird,2026-01-01']) {
    const app = await createApp();
    app.set('observations', [observation()]);
    await app.importCsv('Matt', csv);
    assert.equal(app.read('observations.length'), 1);
    assert.match(app.element('#syncStatus').textContent, /Import failed/);
  }
});

test('the three checked-in sample CSVs produce 12 observations, 7 species, 12 life-list score and 1 shared species', async () => {
  const app = await createApp();
  for (const [i, member] of ['Jeff', 'Alex', 'Matt'].entries()) {
    await app.importCsv(member, fs.readFileSync(path.join(root, `samples/sample-birder-${i + 1}.csv`), 'utf8'));
  }
  assert.equal(app.read('observations.length'), 12);
  assert.equal(app.read('speciesGroups().length'), 7);
  assert.equal(app.read('getTeamLifeListerScore()'), 12);
  assert.equal(Number(app.element('#sharedCount').textContent), 1);
});

test('species identity merges known aliases and excludes ineligible taxa without deleting observations', async () => {
  const app = await createApp();
  app.set('observations', [
    observation('Matt', 'Heron', { scientific: 'Ardea herodias' }),
    observation('Matt', 'Heron group', { scientific: 'Ardea herodias (herodias Group)' }),
    observation('Alex', 'Goose', { scientific: 'Anser sp. (Domestic type)' }),
    observation('Jeff', 'Hummingbird sp.', { scientific: 'Trochilidae sp.' }),
  ]);
  assert.equal(app.read('speciesGroups().length'), 1);
  assert.equal(app.read('getUniqueLifeListSpecies("Matt").length'), 1);
  assert.equal(app.read('observations.length'), 4);
});

test('team union, all-three overlap and sum of personal lists are distinct; targets identify missing members', async () => {
  const app = await createApp();
  app.set('observations', [
    ...['Matt', 'Jeff', 'Alex'].map(m => observation(m)),
    observation('Matt', 'Blue Jay'), observation('Jeff', 'Blue Jay'),
    observation('Matt', 'Robin'), observation('Matt', 'Robin', { id: 'duplicate-robin' }),
  ]);
  app.evaluate('renderStats()');
  assert.equal(Number(app.element('#speciesCount').textContent), 3);
  assert.equal(Number(app.element('#sharedCount').textContent), 1);
  assert.equal(Number(app.element('#observationCount').textContent), 7);
  assert.equal(app.read('getTeamLifeListerScore()'), 6);
  assert.deepEqual(app.read('getTeamTargetSpecies().map(t => [t.species, t.neededBy])'), [['Blue Jay', ['Alex']], ['Robin', ['Alex', 'Jeff']]]);
});

test('observation ledger aggregates counts per member/species/date/place and preserves unknown X', async () => {
  const app = await createApp();
  app.set('observations', [observation('Matt', 'Robin', { count: '2' }), observation('Matt', 'Robin', { count: 'X' }), observation('Jeff', 'Robin', { count: '' })]);
  assert.deepEqual(app.read('aggregateObservationLedger().map(o => [o.member, o.totalCount])'), [['Matt', '2+'], ['Jeff', '1']]);
});

test('Matt override applies only at canonical 233; canonical data, badges and other members remain unchanged', async () => {
  const app = await createApp();
  const rows = Array.from({ length: 234 }, (_, i) => observation('Matt', `Bird ${String(i).padStart(3, '0')}`));
  for (const count of [232, 233, 234]) {
    app.set('observations', rows.slice(0, count));
    assert.equal(app.read('getMemberLifeListCount(" matt ")'), count === 233 ? 232 : count);
    assert.equal(app.read('getTeamLifeListerScore()'), count === 233 ? 232 : count);
    assert.equal(app.read('getUniqueLifeListSpecies("Matt").length'), count);
    assert.equal(app.read('speciesGroups().length'), count);
  }
  app.set('observations', rows.slice(0, 233).map(o => ({ ...o, member: 'Jeff' })));
  assert.equal(app.read('getMemberLifeListCount("Jeff")'), 233);
});

test('badges award first species and every 50th, with deterministic earliest-date ordering', async () => {
  const app = await createApp();
  const rows = Array.from({ length: 101 }, (_, i) => observation('Matt', `Bird ${String(i).padStart(3, '0')}`));
  app.set('observations', rows.reverse().concat(observation('Matt', 'Bird 000', { date: '2025-01-01', location: 'First place' })));
  const badges = app.read('calculateMilestoneBirdBadges("matt")');
  assert.deepEqual(badges.map(b => b.milestone_number), [1, 50, 100]);
  assert.deepEqual(badges.map(b => b.species_common_name), ['Bird 000', 'Bird 049', 'Bird 099']);
  assert.equal(badges[0].date_seen, '2025-01-01'); assert.equal(badges[0].location_name, 'First place');
  assert.equal(app.read('calculateMilestoneBirdBadges("unknown").length'), 0);
});

test('recalculating badges is idempotent and preserves original award timestamps', async () => {
  const app = await createApp(); app.set('observations', [observation()]);
  app.evaluate('calculateMilestoneBirdBadges("matt"); userMilestoneBadges[0].awarded_at = "2020-01-01T00:00:00Z"');
  app.evaluate('calculateMilestoneBirdBadges("matt"); calculateMilestoneBirdBadges("matt")');
  assert.equal(app.read('userMilestoneBadges.length'), 1);
  assert.equal(app.read('userMilestoneBadges[0].awarded_at'), '2020-01-01T00:00:00Z');
});

test('KNOWN LIMITATION: shrinking a life list hides but does not delete historical badge records', async () => {
  const app = await createApp();
  app.set('observations', Array.from({ length: 50 }, (_, i) => observation('Matt', `Bird ${i}`)));
  app.evaluate('calculateMilestoneBirdBadges("matt")');
  app.set('observations', [observation()]);
  assert.deepEqual(app.read('calculateMilestoneBirdBadges("matt").map(b => b.milestone_number)'), [1]);
  assert.equal(app.read('userMilestoneBadges.some(b => b.milestone_number === 50)'), true);
});
