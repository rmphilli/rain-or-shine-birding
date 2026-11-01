const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp, response } = require('./helpers/app-harness.cjs');

test('live assistant requires a fresh team session before transmitting message or photo', async () => {
  const app = await createApp(); app.window.RSB_CHAT_ENDPOINT = '/.netlify/functions/chatgpt';
  const reply = await app.evaluate('getAssistantReply("identify this bird", null)');
  assert.match(reply, /Sign in with your team email/); assert.equal(app.calls.length, 0);
});

test('assistant sends current bearer and preserves text/photo request and reply contract', async () => {
  const app = await createApp(); app.configureCloud(); app.window.RSB_CHAT_ENDPOINT = '/.netlify/functions/chatgpt';
  app.respond(async (url, options) => {
    assert.equal(url, '/.netlify/functions/chatgpt');
    assert.equal(options.headers.Authorization, 'Bearer test-access');
    const body = JSON.parse(options.body);
    assert.equal(body.message, 'bird photo'); assert.equal(body.image.dataUrl, 'fixture-image');
    return response({ reply: 'Likely a cardinal; check the bill.' });
  });
  assert.equal(await app.evaluate('getAssistantReply("bird photo", {dataUrl:"fixture-image"})'), 'Likely a cardinal; check the bill.');
});

test('assistant retries one 401 after refreshing credentials, without replaying other failures', async () => {
  const app = await createApp(); app.configureCloud(); app.window.RSB_CHAT_ENDPOINT = '/.netlify/functions/chatgpt'; let attempts = 0;
  app.respond(async (url, options) => {
    if (url.includes('/auth/v1/token')) return response({ access_token: 'rotated', refresh_token: 'new-refresh', expires_in: 3600 });
    attempts++;
    assert.equal(options.headers.Authorization, attempts === 1 ? 'Bearer test-access' : 'Bearer rotated');
    return attempts === 1 ? response({ error: 'Sign in again.' }, 401) : response({ reply: 'Connected.' });
  });
  assert.equal(await app.evaluate('getAssistantReply("ID help", null)'), 'Connected.'); assert.equal(attempts, 2);
});

test('assistant quota rejection retains helpful local fallback and is never retried', async () => {
  const app = await createApp(); app.configureCloud(); app.window.RSB_CHAT_ENDPOINT = '/.netlify/functions/chatgpt';
  app.respond(async () => response({ error: 'Assistant limit reached. Please try again later.', retry_after: 60 }, 429));
  const reply = await app.evaluate('getAssistantReply("ID help", null)');
  assert.match(reply, /Assistant limit reached/); assert.match(reply, /Demo fallback/); assert.equal(app.calls.length, 1);
});
