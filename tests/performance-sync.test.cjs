const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp, response, observation } = require('./helpers/app-harness.cjs');

function cloud(app) {
  const data = { observations: [{ id: 'remote', member_name: 'Matt', species_common_name: 'Northern Cardinal', date_seen: '2026-01-01', location_name: 'Original marsh', import_id: 'revision-1' }], badges: [] };
  app.respond(async (url, options) => {
    if (options.method === 'POST') {
      assert.match(url, /user_milestone_badges/);
      data.badges = JSON.parse(options.body);
      return response(data.badges);
    }
    if (url.includes('/observations?')) return response(data.observations);
    if (url.includes('/user_milestone_badges?')) return response(data.badges);
    return response([]);
  });
  return data;
}

test('unchanged background and forced refresh retain table nodes and avoid cache writes or badge upserts', async () => {
  const app = await createApp(); app.configureCloud(); cloud(app);
  await app.evaluate('syncRemoteData()'); await app.settle();
  const row = app.element('#speciesTable').children[0];
  assert.ok(row);
  const writes = [];
  app.saved.set = function(key, value) { writes.push(key); return Map.prototype.set.call(this, key, value); };
  const posts = app.calls.filter(call => call.options.method === 'POST').length;
  await app.evaluate('syncRemoteData({quiet:true})'); await app.settle();
  await app.evaluate('syncRemoteData({force:true})'); await app.settle();
  assert.equal(app.element('#speciesTable').children[0], row);
  assert.equal(app.calls.filter(call => call.options.method === 'POST').length, posts);
  assert.deepEqual(writes, []);
  assert.match(app.element('#syncStatus').textContent, /Shared flock current/);
});

test('same-sized cloud edits still replace rendered content and persist corrected metadata', async () => {
  const app = await createApp(); app.configureCloud(); const data = cloud(app);
  await app.evaluate('syncRemoteData()'); await app.settle();
  const row = app.element('#speciesTable').children[0];
  data.observations = data.observations.map(row => ({ ...row, location_name: 'Corrected marsh' }));
  await app.evaluate('syncRemoteData({quiet:true})'); await app.settle();
  assert.notEqual(app.element('#speciesTable').children[0], row);
  assert.match(app.element('#speciesTable').children[0].innerHTML, /Corrected marsh/);
  assert.equal(JSON.parse(app.saved.get('rainOrShineBirdingData'))[0].location, 'Corrected marsh');
});

test('simultaneous unchanged badge syncs share one write and subsequent calls send nothing', async () => {
  const app = await createApp(); app.configureCloud(); app.set('sharedDataLoaded', true);
  app.set('observations', [observation()]); app.evaluate('calculateMilestoneBirdBadges("matt")');
  let release;
  app.respond(async () => { await new Promise(resolve => { release = resolve; }); return response([]); });
  const pending = app.evaluate('Promise.all([syncMilestoneBadges(), syncMilestoneBadges()])');
  await app.settle(); assert.equal(app.calls.length, 1);
  release(); await pending;
  await app.evaluate('syncMilestoneBadges()');
  assert.equal(app.calls.length, 1);
});

test('badge edits made during a write are synchronized after that write completes', async () => {
  const app = await createApp(); app.configureCloud(); app.set('sharedDataLoaded', true);
  app.set('observations', [observation()]); app.evaluate('calculateMilestoneBirdBadges("matt")');
  let release; const titles = [];
  app.respond(async (url, options) => {
    titles.push(JSON.parse(options.body)[0].badge_title);
    if (titles.length === 1) await new Promise(resolve => { release = resolve; });
    return response([]);
  });
  const first = app.evaluate('syncMilestoneBadges()'); await app.settle();
  app.evaluate('userMilestoneBadges[0].badge_title = "Corrected milestone"');
  const second = app.evaluate('syncMilestoneBadges()');
  release(); await Promise.all([first, second]);
  assert.equal(titles.length, 2); assert.equal(titles[1], 'Corrected milestone');
});

test('failed shared badge write is handled for all waiting callers and can be retried later', async () => {
  const app = await createApp(); app.configureCloud(); app.set('sharedDataLoaded', true);
  app.set('observations', [observation()]); app.evaluate('calculateMilestoneBirdBadges("matt")');
  app.respond(async () => response({ message: 'offline' }, 503));
  await app.evaluate('Promise.all([syncMilestoneBadges(), syncMilestoneBadges()])');
  assert.equal(app.calls.length, 1); assert.match(app.element('#syncStatus').textContent, /Badge sync failed/);
  await app.evaluate('syncMilestoneBadges()'); assert.equal(app.calls.length, 2);
});

test('reference photos share in-flight requests and cached results across card rerenders', async () => {
  const app = await createApp();
  app.respond(async () => response({ thumbnail: { source: 'https://example.invalid/bird.png' }, content_urls: { desktop: { page: 'https://example.invalid/bird' } } }));
  await app.evaluate('Promise.all([loadTargetBirdPhoto({species:"Blue Jay"}, document.querySelector("#photoOne")), loadTargetBirdPhoto({species:"Blue Jay"}, document.querySelector("#photoTwo"))])');
  await app.evaluate('loadTargetBirdPhoto({species:"Blue Jay"}, document.querySelector("#photoThree"))');
  assert.equal(app.calls.length, 1);
  for (const id of ['#photoOne', '#photoTwo', '#photoThree']) assert.equal(app.element(id).children[0].src, 'https://example.invalid/bird.png');
});

test('unavailable reference photos can recover on a later render', async () => {
  const app = await createApp(); let requests = 0;
  app.respond(async () => ++requests === 1 ? response({}, 503) : response({ thumbnail: { source: 'https://example.invalid/bird.png' } }));
  await app.evaluate('loadTargetBirdPhoto({species:"Blue Jay"}, document.querySelector("#photo"))');
  assert.equal(app.element('#photo').children.length, 0);
  await app.evaluate('loadTargetBirdPhoto({species:"Blue Jay"}, document.querySelector("#photo"))');
  assert.equal(app.calls.length, 2); assert.equal(app.element('#photo').children.length, 1);
});
