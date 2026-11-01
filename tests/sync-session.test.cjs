const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp, response, observation } = require('./helpers/app-harness.cjs');

const pendingKey = 'rainOrShinePendingImports';
function remoteRow(member = 'Matt', species = 'Old Bird', revision = '00000000-0000-0000-0000-000000000001') {
  return { id: `${member}-${species}`, member_name: member, species_common_name: species,
    count_seen: '1', date_seen: '2026-01-01', latitude: null, longitude: null,
    location_name: 'Test field', source_name: 'fixture.csv', import_id: revision };
}
function cloud(app, rows, onWrite = async () => response(1)) {
  app.respond(async (url, options) => {
    if (options.method === 'GET') return response(url.includes('/observations?') ? rows : []);
    if (url.includes('/user_milestone_badges?')) return response([]);
    return onWrite(url, options);
  });
}

test('corrupt browser JSON starts with empty data and no stored sign-in', async () => {
  const app = await createApp({ storage: { rainOrShineBirdingData: '{broken', rainOrShineMilestoneBadges: '{broken', rainOrShineSupabaseSession: '{broken' } });
  assert.equal(app.read('observations.length'), 0); assert.equal(app.read('authSession'), null);
});

test('valid JSON with the wrong storage shape starts safely and preserves original stored evidence', async () => {
  const app = await createApp({ storage: { rainOrShineBirdingData: '{}', rainOrShineMilestoneBadges: 'null', [pendingKey]: '[]' } });
  assert.equal(app.read('observations.length'), 0);
  assert.equal(app.saved.get('rainOrShineBirdingData'), '{}');
});

test('Clear this device confirms, clears local data, and never sends a remote delete', async () => {
  const app = await createApp();
  app.set('observations', [observation()]); app.evaluate('saveObservations()');
  app.window.confirm = () => false;
  await app.element('#resetData').dispatch('click'); assert.equal(app.read('observations.length'), 1);
  app.window.confirm = () => true;
  await app.element('#resetData').dispatch('click');
  assert.equal(app.read('observations.length'), 0); assert.equal(app.read('userMilestoneBadges.length'), 0);
  assert.equal(app.saved.has('rainOrShineBirdingData'), false); assert.equal(app.calls.length, 0);
});

test('offline save keeps observations locally without attempting a cloud request', async () => {
  const app = await createApp(); app.set('observations', [observation()]);
  assert.equal(await app.evaluate('saveImport("Matt", "fixture.csv", observations)'), false);
  assert.equal(JSON.parse(app.saved.get('rainOrShineBirdingData')).length, 1); assert.equal(app.calls.length, 0);
});

test('cloud import loads latest lists then uses one guarded RPC with revision, X and source metadata', async () => {
  const app = await createApp(); app.configureCloud();
  app.set('observations', [observation('Matt', 'Robin', { count: 'X' })]);
  cloud(app, [remoteRow()], async (url, options) => {
    assert.match(url, /\/rpc\/replace_member_observations_guarded$/); assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer test-access');
    const body = JSON.parse(options.body);
    assert.equal(body.p_member_name, 'Matt'); assert.equal(body.p_observations[0].count_seen, 'X');
    assert.equal(body.p_observations[0].source_name, 'fixture.csv');
    assert.equal(body.p_expected_import_id, '00000000-0000-0000-0000-000000000001');
    return response(1);
  });
  assert.equal(await app.evaluate('saveImport("Matt", "fixture.csv", observations, {reloadAfterSave:false})'), true);
  assert.equal(app.calls.filter(call => call.options.method === 'GET').length, 3);
  assert.equal(app.calls.filter(call => call.url.includes('/rpc/')).length, 1);
  assert.deepEqual(JSON.parse(app.saved.get(pendingKey)), {});
});

test('failed cloud import retains the local upload and shows the sync failure', async () => {
  const app = await createApp(); app.configureCloud(); app.set('observations', [observation()]);
  cloud(app, [remoteRow()], async () => response({ message: 'database unavailable' }, 503));
  assert.equal(await app.evaluate('saveImport("Matt", "fixture.csv", observations)'), false);
  assert.equal(JSON.parse(app.saved.get('rainOrShineBirdingData')).length, 1);
  assert.match(app.element('#syncStatus').textContent, /Saved locally.*database unavailable/);
});

test('cloud reads all pages beyond the default 1000-row page', async () => {
  const app = await createApp(); app.configureCloud();
  app.respond(async (url, options) => {
    assert.match(url, /observations\?select=\*&order=id\.asc$/);
    return options.headers.Range === '0-999'
      ? response(Array.from({ length: 1000 }, (_, id) => ({ id })), 206, { 'content-range': '0-999/1002' })
      : response([{ id: 1000 }, { id: 1001 }], 206, { 'content-range': '1000-1001/1002' });
  });
  assert.equal((await app.evaluate('remoteSelect("observations")')).length, 1002);
  assert.deepEqual(app.calls.map(c => c.options.headers.Range), ['0-999', '1000-1999']);
});

test('pagination handles a 416 end-of-range without an infinite loop', async () => {
  const app = await createApp(); app.configureCloud();
  app.respond(async () => response({}, 416));
  assert.equal((await app.evaluate('remoteSelect("observations")')).length, 0);
  assert.equal(app.calls.length, 1);
});

test('empty cloud preserves the local recovery copy unless explicit replacement was requested', async () => {
  const app = await createApp(); app.configureCloud();
  app.set('observations', [observation()]); app.respond(async () => response([]));
  await app.evaluate('syncRemoteData()'); await app.settle();
  assert.equal(app.read('observations.length'), 1);
  await app.evaluate('syncRemoteData({force:true, preserveLocalWhenRemoteEmpty:false})'); await app.settle();
  assert.equal(app.read('observations.length'), 0);
});

test('concurrent cloud refreshes share one read cycle and replace cache with remote data', async () => {
  const app = await createApp(); app.configureCloud();
  app.respond(async url => {
    if (url.includes('/observations?')) return response([{ id: 'remote', member_name: 'Alex', species_common_name: 'Blue Jay', latitude: null, longitude: null }]);
    return response([]);
  });
  await app.evaluate('Promise.all([syncRemoteData(), syncRemoteData()])'); await app.settle();
  assert.equal(app.calls.filter(c => c.url.includes('/observations?')).length, 1);
  assert.equal(app.read('observations[0].id'), 'remote');
  assert.equal(JSON.parse(app.saved.get('rainOrShineBirdingData'))[0].member, 'Alex');
});

test('failed import survives nonempty cloud refresh and browser reload while other members refresh', async () => {
  const app = await createApp(); app.configureCloud(); app.set('observations', [observation()]);
  app.respond(async () => response({ message: 'offline' }, 503));
  await app.evaluate('saveImport("Matt", "fixture.csv", observations)');
  cloud(app, [remoteRow(), remoteRow('Alex', 'Blue Jay')]);
  await app.evaluate('syncRemoteData()'); await app.settle();
  assert.deepEqual(app.read('observations.map(row => [row.member, row.species])'), [['Alex', 'Blue Jay'], ['Matt', 'Northern Cardinal']]);
  assert.equal(JSON.parse(app.saved.get(pendingKey)).Matt.rows[0].species, 'Northern Cardinal');
  assert.match(app.element('#syncStatus').textContent, /Matt.*not been shared/);
  const reloaded = await createApp({ storage: Object.fromEntries(app.saved) });
  assert.deepEqual(reloaded.read('observations.map(row => [row.member, row.species])'), [['Alex', 'Blue Jay'], ['Matt', 'Northern Cardinal']]);
  assert.equal(reloaded.calls.length, 0);
});

test('badge synchronization is a separate upsert and reports its own failure', async () => {
  const app = await createApp(); app.configureCloud(); app.set('observations', [observation()]);
  app.set('sharedDataLoaded', true);
  app.evaluate('calculateMilestoneBirdBadges("matt")');
  app.respond(async (url, options) => {
    assert.match(url, /user_milestone_badges\?on_conflict=id$/);
    assert.equal(options.headers.Prefer, 'resolution=merge-duplicates,return=representation');
    return response({ message: 'badge failure' }, 500);
  });
  await app.evaluate('syncMilestoneBadges()');
  assert.match(app.element('#syncStatus').textContent, /Badge sync failed/);
  assert.equal(app.read('observations.length'), 1);
});

test('publish requires confirmation and stops on a failed member instead of continuing writes', async () => {
  const app = await createApp(); app.configureCloud();
  app.set('observations', [observation('Jeff'), observation('Matt')]);
  cloud(app, [remoteRow('Jeff'), remoteRow('Matt')], async () => response({ message: 'fail' }, 500));
  app.window.confirm = () => false;
  await app.evaluate('publishLocalDataToCloud()'); assert.equal(app.calls.filter(call => call.url.includes('/rpc/')).length, 0);
  app.window.confirm = () => true;
  await app.evaluate('publishLocalDataToCloud()');
  assert.equal(app.calls.filter(call => call.url.includes('/rpc/')).length, 1); assert.match(app.element('#syncStatus').textContent, /Publish failed/);
});

test('latest-cloud preflight failure keeps a real CSV upload and never attempts replacement', async () => {
  const app = await createApp(); app.configureCloud();
  app.set('observations', [observation('Alex', 'Blue Jay')]);
  app.respond(async () => response({ message: 'offline' }, 503));
  await app.importCsv('Jeff', 'Species,Date,Count\nHawaii Amakihi,2026-10-31,X', 'hawaii.csv');
  assert.deepEqual(app.read('observations.map(row => row.member)'), ['Alex', 'Jeff']);
  assert.equal(app.calls.filter(call => call.options.method === 'POST').length, 0);
  const saved = JSON.parse(app.saved.get(pendingKey)).Jeff;
  assert.equal(saved.sourceName, 'hawaii.csv'); assert.equal(saved.rows[0].count, 'X');
  assert.equal(app.inputs.find(input => input.dataset.member === 'Jeff').files[0].name, 'hawaii.csv');
  assert.equal(app.inputs.find(input => input.dataset.member === 'Jeff').disabled, false);
});

test('recovery refresh never auto-publishes; confirmed retry shows current counts and retains teammates', async () => {
  const first = await createApp();
  first.set('observations', [observation('Jeff', 'Hawaii Amakihi')]);
  await first.evaluate('saveImport("Jeff", "hawaii.csv", observations)');
  const app = await createApp({ storage: Object.fromEntries(first.saved) }); app.configureCloud();
  const rows = [remoteRow('Jeff'), remoteRow('Alex', 'Blue Jay'), remoteRow('Matt', 'Northern Cardinal')];
  let writes = 0;
  cloud(app, rows, async (url, options) => {
    writes += 1;
    const body = JSON.parse(options.body);
    assert.match(url, /guarded$/); assert.equal(body.p_member_name, 'Jeff');
    assert.equal(body.p_expected_import_id, rows.find(row => row.member_name === 'Jeff').import_id);
    const replacement = body.p_observations.map(row => ({ ...row, import_id: '00000000-0000-0000-0000-000000000002' }));
    rows.splice(0, rows.length, ...rows.filter(row => row.member_name !== 'Jeff'), ...replacement);
    return response(replacement.length);
  });
  await app.evaluate('syncRemoteData()');
  await app.window.dispatch('focus'); await app.window.dispatch('online'); await app.settle();
  assert.equal(writes, 0);
  let review;
  app.window.confirm = message => { review = message; return false; };
  await app.evaluate('publishLocalDataToCloud()');
  assert.match(review, /Jeff: replace 1 shared rows with 1 saved rows/);
  assert.equal(writes, 0); assert.ok(JSON.parse(app.saved.get(pendingKey)).Jeff);
  app.window.confirm = () => true;
  await app.evaluate('publishLocalDataToCloud()');
  assert.equal(writes, 1); assert.deepEqual(JSON.parse(app.saved.get(pendingKey)), {});
  assert.deepEqual(app.read('observations.map(row => [row.member, row.species]).sort()'),
    [['Alex', 'Blue Jay'], ['Jeff', 'Hawaii Amakihi'], ['Matt', 'Northern Cardinal']]);
  assert.equal(app.read('observations.find(row => row.member === "Jeff").importId'), '00000000-0000-0000-0000-000000000002');
});

test('a cloud change after retry confirmation stops replacement and retains the saved upload', async () => {
  const app = await createApp();
  app.set('observations', [observation()]); await app.evaluate('saveImport("Matt", "fixture.csv", observations)');
  app.configureCloud(); const rows = [remoteRow()]; cloud(app, rows);
  app.window.confirm = () => { rows[0].import_id = '00000000-0000-0000-0000-000000000002'; return true; };
  await app.evaluate('publishLocalDataToCloud()');
  assert.equal(app.calls.filter(call => call.url.includes('/rpc/')).length, 0);
  assert.ok(JSON.parse(app.saved.get(pendingKey)).Matt);
  assert.match(app.element('#syncStatus').textContent, /Publish failed/);
});

test('guarded conflict retains source rows and never falls back to the unguarded RPC', async () => {
  const app = await createApp(); app.configureCloud();
  app.set('observations', [observation()]);
  cloud(app, [remoteRow()], async () => response({ message: 'The shared list changed. Refresh and review again.' }, 409));
  assert.equal(await app.evaluate('saveImport("Matt", "fixture.csv", observations)'), false);
  assert.ok(JSON.parse(app.saved.get(pendingKey)).Matt);
  assert.equal(app.calls.filter(call => call.url.endsWith('/replace_member_observations')).length, 0);
  assert.match(app.element('#syncStatus').textContent, /shared list changed/);
});

test('a fresh smaller CSV requires full-list replacement confirmation and cancel retains the saved CSV', async () => {
  const app = await createApp(); app.configureCloud();
  cloud(app, [remoteRow('Jeff', 'Old Bird'), remoteRow('Jeff', 'Earlier Bird')]);
  let prompt;
  app.window.confirm = message => { prompt = message; return false; };
  await app.importCsv('Jeff', 'Species\nHawaii Amakihi', 'hawaii-only.csv');
  assert.match(prompt, /Jeff.*shared list has 2 rows.*CSV has 1 rows/);
  assert.match(prompt, /full life-list export/);
  assert.equal(app.calls.filter(call => call.url.includes('/rpc/')).length, 0);
  assert.equal(JSON.parse(app.saved.get(pendingKey)).Jeff.sourceName, 'hawaii-only.csv');
  assert.match(app.element('#syncStatus').textContent, /shared list unchanged/);
});

test('confirming a smaller CSV uses the guarded replacement with the reviewed cloud revision', async () => {
  const app = await createApp(); app.configureCloud(); app.set('observations', [observation('Jeff', 'Hawaii Amakihi')]);
  cloud(app, [remoteRow('Jeff', 'Old Bird'), remoteRow('Jeff', 'Earlier Bird')], async (url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.p_member_name, 'Jeff'); assert.equal(body.p_observations.length, 1);
    assert.equal(body.p_expected_import_id, '00000000-0000-0000-0000-000000000001');
    return response(1);
  });
  let confirmations = 0; app.window.confirm = () => { confirmations += 1; return true; };
  assert.equal(await app.evaluate('saveImport("Jeff", "hawaii-only.csv", observations, {reloadAfterSave:false})'), true);
  assert.equal(confirmations, 1);
  assert.equal(app.calls.filter(call => call.url.includes('/rpc/')).length, 1);
});

test('a newer local upload after review stops retry without replacing either cloud list', async () => {
  const app = await createApp();
  await app.importCsv('Jeff', 'Species\nHawaii Amakihi', 'first.csv');
  app.configureCloud(); cloud(app, [remoteRow('Jeff')]);
  app.window.confirm = () => {
    const entries = JSON.parse(app.saved.get(pendingKey));
    entries.Jeff.id = 'newer-tab-upload'; entries.Jeff.sourceName = 'newer.csv';
    app.saved.set(pendingKey, JSON.stringify(entries));
    return true;
  };
  await app.evaluate('publishLocalDataToCloud()');
  assert.equal(app.calls.filter(call => call.url.includes('/rpc/')).length, 0);
  assert.equal(JSON.parse(app.saved.get(pendingKey)).Jeff.sourceName, 'newer.csv');
  assert.match(app.element('#syncStatus').textContent, /saved upload changed/);
});

test('a confirmed save followed by reload failure reports it honestly and retains local rows', async () => {
  const app = await createApp(); app.configureCloud(); app.set('observations', [observation()]);
  let saved = false;
  app.respond(async (url, options) => {
    if (options.method === 'GET') return saved ? response({ message: 'read outage' }, 503) : response(url.includes('/observations?') ? [remoteRow()] : []);
    saved = true; return response(1);
  });
  assert.equal(await app.evaluate('saveImport("Matt", "fixture.csv", observations)'), true);
  assert.equal(JSON.parse(app.saved.get('rainOrShineBirdingData'))[0].species, 'Northern Cardinal');
  assert.deepEqual(JSON.parse(app.saved.get(pendingKey)), {});
  assert.match(app.element('#syncStatus').textContent, /Shared 1 Matt observations.*could not reload/);
});

test('refresh waits for an in-flight cloud replacement and cannot apply its older snapshot', async () => {
  const app = await createApp(); app.configureCloud(); app.set('observations', [observation()]);
  const rows = [remoteRow()]; let releaseWrite; let writes = 0;
  cloud(app, rows, async (url, options) => {
    writes += 1;
    await new Promise(resolve => { releaseWrite = resolve; });
    rows.splice(0, rows.length, ...JSON.parse(options.body).p_observations.map(row => ({ ...row, import_id: 'new-revision' })));
    return response(1);
  });
  const saving = app.evaluate('saveImport("Matt", "fixture.csv", observations, {reloadAfterSave:false})');
  await app.settle(); assert.equal(writes, 1);
  const readsBefore = app.calls.filter(call => call.options.method === 'GET').length;
  const refreshing = app.evaluate('syncRemoteData({force:true})'); await app.settle();
  assert.equal(app.calls.filter(call => call.options.method === 'GET').length, readsBefore);
  releaseWrite(); assert.equal(await saving, true); assert.equal(await refreshing, true);
  assert.equal(app.read('observations[0].species'), 'Northern Cardinal');
  assert.equal(app.read('observations[0].importId'), 'new-revision');
});

test('legacy browser cache displaced by a cloud refresh remains in a private recovery copy', async () => {
  const app = await createApp({ storage: { rainOrShineBirdingData: JSON.stringify([observation('Jeff', 'Saved Bird')]) } });
  app.configureCloud(); cloud(app, [remoteRow('Jeff', 'Cloud Bird')]);
  assert.equal(await app.evaluate('syncRemoteData()'), true);
  assert.equal(app.read('observations[0].species'), 'Cloud Bird');
  assert.equal(JSON.parse(app.saved.get('rainOrShineBirdingRecoveryData'))[0].species, 'Saved Bird');
  assert.equal(app.calls.filter(call => call.url.includes('/rpc/')).length, 0);
});

test('multiple offline members retain independent uploads across reload and refresh', async () => {
  const app = await createApp();
  await app.importCsv('Jeff', 'Species\nHawaii Amakihi', 'hawaii.csv');
  await app.importCsv('Matt', 'Species\nBlue Jay', 'matt.csv');
  const reloaded = await createApp({ storage: Object.fromEntries(app.saved) }); reloaded.configureCloud();
  cloud(reloaded, [remoteRow('Jeff'), remoteRow('Matt'), remoteRow('Alex', 'Robin')]);
  await reloaded.evaluate('syncRemoteData()');
  assert.deepEqual(Object.keys(JSON.parse(reloaded.saved.get(pendingKey))).sort(), ['Jeff', 'Matt']);
  assert.deepEqual(reloaded.read('observations.map(row => row.species).sort()'), ['Blue Jay', 'Hawaii Amakihi', 'Robin']);
});

test('magic-link form sends REST redirect_to query without enabling new-user creation', async () => {
  const app = await createApp(); app.configureCloud();
  app.element('#authEmail').value = 'jeff@example.test';
  app.respond(async (url, options) => {
    const endpoint = new URL(url);
    assert.equal(endpoint.pathname, '/auth/v1/otp');
    assert.equal(endpoint.searchParams.get('redirect_to'), 'http://test.invalid/');
    assert.deepEqual(JSON.parse(options.body), { email: 'jeff@example.test', create_user: false });
    return response({});
  });
  await app.element('#authForm').dispatch('submit');
  assert.match(app.element('#authStatus').textContent, /Magic link sent/);
  assert.equal(app.calls.length, 1);
});

test('session persistence accepts seconds and milliseconds and retains refresh token on rotation omission', async () => {
  const app = await createApp(); app.configureCloud();
  app.evaluate('persistAuthSession({access_token:"rotated", expires_at:2000000000})');
  assert.equal(app.read('authSession.expires_at'), 2000000000000);
  assert.equal(app.read('authSession.refresh_token'), 'test-refresh');
  app.evaluate('persistAuthSession({access_token:"again", expires_at:2000000000000})');
  assert.equal(app.read('authSession.expires_at'), 2000000000000);
  assert.equal(JSON.parse(app.saved.get('rainOrShineSupabaseSession')).access_token, 'again');
});

test('fresh session needs no network; no config or no session returns false', async () => {
  const app = await createApp();
  assert.equal(await app.evaluate('ensureFreshSession()'), false);
  app.configureCloud(); assert.equal(await app.evaluate('ensureFreshSession()'), true);
  assert.equal(app.calls.length, 0);
});

test('expiring session refreshes once for concurrent callers and stores rotated tokens', async () => {
  const app = await createApp(); app.configureCloud(Date.now() + 10000);
  app.respond(async (url, options) => {
    assert.match(url, /token\?grant_type=refresh_token$/);
    assert.equal(JSON.parse(options.body).refresh_token, 'test-refresh');
    return response({ access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 3600 });
  });
  const results = await app.evaluate('Promise.all([ensureFreshSession(), ensureFreshSession()])');
  assert.deepEqual(Array.from(results), [true, true]); assert.equal(app.calls.length, 1);
  assert.equal(app.read('authSession.access_token'), 'new-access'); assert.equal(app.read('sessionRefreshPromise'), null);
});

test('failed refresh clears credentials but preserves bird data', async () => {
  const app = await createApp(); app.configureCloud(0); app.set('observations', [observation()]);
  app.respond(async () => response({ error: 'invalid refresh token' }, 401));
  assert.equal(await app.evaluate('ensureFreshSession()'), false);
  assert.equal(app.read('authSession'), null); assert.equal(app.read('isRemoteReady'), false);
  assert.equal(app.read('observations.length'), 1); assert.equal(app.saved.has('rainOrShineSupabaseSession'), false);
});

test('expired access token without refresh token is cleared without a request', async () => {
  const app = await createApp(); app.configureCloud(0); app.evaluate('authSession.refresh_token = ""');
  assert.equal(await app.evaluate('ensureFreshSession()'), false);
  assert.equal(app.read('authSession'), null); assert.equal(app.calls.length, 0);
});

test('authorized request retries a 401 once using the refreshed access token', async () => {
  const app = await createApp(); app.configureCloud(); let reads = 0;
  app.respond(async (url, options) => {
    if (url.includes('/auth/')) return response({ access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 3600 });
    reads += 1;
    assert.equal(options.headers.Authorization, reads === 1 ? 'Bearer test-access' : 'Bearer new-access');
    return response({}, 401);
  });
  assert.equal((await app.evaluate('authorizedFetch("https://test.invalid/rest/v1/observations")')).status, 401);
  assert.equal(reads, 2); assert.equal(app.calls.length, 3);
});

test('cloud read failure preserves the current local collection', async () => {
  const app = await createApp(); app.configureCloud(); app.set('observations', [observation()]);
  app.respond(async () => response({ message: 'temporarily unavailable' }, 503));
  await app.evaluate('syncRemoteData()');
  assert.equal(app.read('observations[0].species'), 'Northern Cardinal');
  assert.match(app.element('#syncStatus').textContent, /shared data could not load/);
});

test('remote observation conversion preserves null coordinates, X, checklist and dates', async () => {
  const app = await createApp();
  app.set('rowFixture', observation('Matt', 'Robin', { count: 'X', checklist: 'S1', longitude: 0 }));
  assert.deepEqual(app.read('fromRemoteObservation(toRemoteObservation(rowFixture, null))'), app.read('rowFixture'));
});

test('storage event reloads another tab\'s local records', async () => {
  const app = await createApp();
  app.saved.set('rainOrShineBirdingData', JSON.stringify([observation('Alex')]));
  await app.window.dispatch('storage', { key: 'rainOrShineBirdingData' });
  assert.equal(app.read('observations[0].member'), 'Alex');
});

test('fetch timeout aborts, gives a readable error and cleans up its timer', async () => {
  const app = await createApp();
  app.respond(async (url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  }));
  const pending = app.evaluate('fetchWithTimeout("https://test.invalid/timeout", {}, 10)');
  const assertion = assert.rejects(pending, /request took too long/);
  for (const callback of app.timers.values()) callback();
  await assertion; assert.equal(app.timers.size, 0);
});
