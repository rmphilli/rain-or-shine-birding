const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp, response } = require('./helpers/app-harness.cjs');

test('shared observation member names stay text when refreshed into member cards', async () => {
  for (const [member, safeText] of [
    ['<img src=x onerror=alert(1)>', '&lt;img src=x onerror=alert(1)&gt;'],
    ['<svg onload="alert(1)">&amp;</svg>', '&lt;svg onload=&quot;alert(1)&quot;&gt;&amp;amp;&lt;/svg&gt;'],
  ]) {
    const app = await createApp();
    app.configureCloud();
    app.respond(async url => response(url.includes('/observations?') ? [{
      id: 'remote-security-fixture', member_name: member,
      species_common_name: 'Blue Jay', date_seen: '2026-01-01',
    }] : []));

    await app.evaluate('syncRemoteData()');
    const cards = app.element('#memberBreakdown').children;
    assert.equal(cards.length, 4);
    assert.ok(cards[3].innerHTML.includes(`<strong>${safeText}</strong>`));
    assert.doesNotMatch(cards[3].innerHTML, /<(?:img|svg)\b/i);
    assert.equal(app.read('observations[0].member'), member);
  }
});

test('shared member cards preserve the trio names, normalization, and counts', async () => {
  const app = await createApp();
  app.configureCloud();
  app.respond(async url => response(url.includes('/observations?') ? [{
    id: 'remote-legitimate-fixture', member_name: '  mAtT ',
    species_common_name: 'Blue Jay', date_seen: '2026-01-01',
  }] : []));

  await app.evaluate('syncRemoteData()');
  const cards = app.element('#memberBreakdown').children;
  assert.equal(cards.length, 3);
  assert.deepEqual(cards.map(card => /<strong>(.*?)<\/strong>/.exec(card.innerHTML)[1]), ['Jeff', 'Alex', 'Matt']);
  assert.match(cards[2].innerHTML, /<span>1 Life Listers<\/span>/);
  assert.match(cards[2].innerHTML, /<span>1 Observations<\/span>/);
});
