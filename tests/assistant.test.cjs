const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../netlify/functions/chatgpt.js'), 'utf8');
const userId = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';
// Synthetic 1x1 blue PNG; no production photo or metadata.
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNgYPgPAAEDAQAIicLsAAAAAElFTkSuQmCC';
const jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDxyiiiv3E8w//Z';
const webp = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACQAQCdASoBAAEAAUAmJaACdLoAA5gA/vtV4/+lwf/S4P/pcH/pcH8bss4bpAAA';
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

function fixture({ responder, env = {} } = {}) {
  const calls = [];
  const timers = new Map();
  let nextTimer = 0;
  const exports = {};
  const defaults = async url => {
    if (url.endsWith('/auth/v1/user')) return response({ id: userId, email: 'synthetic@example.invalid' });
    if (url.includes('/team_members?')) return response([{ user_id: userId }]);
    if (url.endsWith('/rpc/consume_assistant_quota')) return response([{ allowed: true, retry_after: 0 }]);
    if (url === 'https://api.openai.com/v1/responses') return response({ output_text: 'A likely Blue Jay.' });
    throw new Error('Unexpected mock route');
  };
  vm.runInNewContext(source, {
    exports, Buffer, URL, AbortController,
    process: { env: { OPENAI_API_KEY: 'synthetic-provider-key', SUPABASE_URL: 'https://project.invalid', SUPABASE_ANON_KEY: 'synthetic-anon-key', ...env } },
    setTimeout(callback, delay) { timers.set(++nextTimer, { callback, delay }); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
    fetch: async (url, options = {}) => {
      calls.push({ url, options });
      return responder ? responder(url, options, defaults) : defaults(url, options);
    },
    console: { error() { throw new Error('Handler must not log sensitive request/provider data'); } },
  }, { filename: 'chatgpt.js', timeout: 3000 });
  return {
    calls, timers,
    providerCalls: () => calls.filter(call => call.url === 'https://api.openai.com/v1/responses'),
    invoke(payload = { message: 'Which bird?' }, overrides = {}) {
      return exports.handler({ httpMethod: 'POST', headers: { Authorization: 'Bearer synthetic-access' }, body: JSON.stringify(payload), ...overrides });
    },
    fire(delay) {
      const timer = [...timers.values()].find(value => value.delay === delay);
      assert.ok(timer, `Expected ${delay}ms timer`);
      timer.callback();
    },
  };
}

function status(result, expected) {
  assert.equal(result.statusCode, expected);
  assert.equal(result.headers['Cache-Control'], 'no-store');
  return JSON.parse(result.body);
}

test('method and missing/malformed bearer fail before all network/provider calls', async () => {
  for (const overrides of [
    { httpMethod: 'GET' }, { headers: {} }, { headers: { authorization: 'Basic ignored' } },
    { headers: { authorization: 'Bearer first\r\nInjected: value' } },
  ]) {
    const app = fixture();
    status(await app.invoke(undefined, overrides), overrides.httpMethod ? 405 : 401);
    assert.equal(app.calls.length, 0);
  }
});

test('missing configuration fails closed without revealing variable or secret values', async () => {
  for (const env of [{ OPENAI_API_KEY: '' }, { SUPABASE_ANON_KEY: '' }, { SUPABASE_URL: 'http://wrong.invalid' }]) {
    const app = fixture({ env });
    const result = await app.invoke();
    status(result, 503); assert.equal(app.calls.length, 0);
    assert.doesNotMatch(result.body, /OPENAI|SUPABASE|synthetic|wrong\.invalid/);
  }
});

test('forged/expired bearer, Auth outages, and malformed identities never reach provider', async () => {
  for (const auth of [response({}, 401), response({}, 403), response({}, 503), response({}), response({ id: null }), response({ id: 'not-an-id' })]) {
    const app = fixture({ responder: async () => auth });
    const result = await app.invoke();
    status(result, [401, 403].includes(auth.status) ? 401 : 503);
    assert.equal(app.calls.length, 1); assert.equal(app.providerCalls().length, 0);
    assert.equal(app.timers.size, 0);
  }
});

test('roster authorization binds the verified user ID and uses the same bearer token', async () => {
  const app = fixture();
  status(await app.invoke({ message: 'Hi', context: { user_id: otherId, email: 'forged@example.invalid' } }), 200);
  assert.ok(app.calls[1].url.includes(`user_id=eq.${userId}`));
  assert.doesNotMatch(app.calls[1].url, /email|22222222|forged/);
  for (const call of app.calls.slice(0, 3)) {
    assert.equal(call.options.headers.Authorization, 'Bearer synthetic-access');
    assert.equal(call.options.headers.apikey, 'synthetic-anon-key');
  }
  assert.equal(app.calls[2].options.body, '{}');
});

test('nonmembers and roster outages fail before quota/provider', async () => {
  for (const roster of [response([]), response([{ user_id: otherId }]), response({}, 503), response({ unexpected: true })]) {
    const app = fixture({ responder: (url, options, defaults) => url.includes('/team_members?') ? roster : defaults(url) });
    status(await app.invoke(), roster.ok && Array.isArray(await roster.json()) ? 403 : 503);
    assert.equal(app.calls.length, 2); assert.equal(app.providerCalls().length, 0);
  }
});

test('quota rejection includes Retry-After and makes zero provider calls', async () => {
  const app = fixture({ responder: (url, options, defaults) => url.includes('/consume_assistant_quota')
    ? response([{ allowed: false, retry_after: 37 }]) : defaults(url) });
  const result = await app.invoke();
  assert.equal(status(result, 429).retry_after, 37);
  assert.equal(result.headers['Retry-After'], '37');
  assert.equal(app.providerCalls().length, 0);
});

test('quota outages and malformed admission responses fail closed', async () => {
  for (const quota of [response({}, 503), response([]), response({ allowed: true }), response([{ allowed: 'true', retry_after: 0 }]), response([{ allowed: true, retry_after: null }])]) {
    const app = fixture({ responder: (url, options, defaults) => url.includes('/consume_assistant_quota') ? quota : defaults(url) });
    status(await app.invoke(), 503); assert.equal(app.providerCalls().length, 0);
  }
});

test('malformed JSON, null/array payloads and nontext/oversize messages fail before admission', async () => {
  for (const payload of [null, [], 'text', 42, { message: null }, { message: [] }, { message: 'x'.repeat(4001) }, { message: ' ' }]) {
    const app = fixture(); status(await app.invoke(payload), 400); assert.equal(app.calls.length, 0);
  }
  const app = fixture(); status(await app.invoke({}, { body: '{malformed' }), 400); assert.equal(app.calls.length, 0);
});

test('actual body bytes are bounded and Netlify base64 JSON is handled safely', async () => {
  const app = fixture();
  status(await app.invoke({}, { body: JSON.stringify({ message: 'Hi', ignored: 'é'.repeat(1600000) }), headers: { authorization: 'Bearer test', 'content-length': '1' } }), 413);
  assert.equal(app.calls.length, 0);
  const encoded = fixture();
  status(await encoded.invoke({}, { body: Buffer.from(JSON.stringify({ message: 'Hi' })).toString('base64'), isBase64Encoded: true }), 200);
  const invalid = fixture(); status(await invalid.invoke({}, { body: '!!!!', isBase64Encoded: true }), 400);
  assert.equal(invalid.calls.length, 0);
});

test('remote, unsupported, malformed and MIME-mismatched images fail before admission', async () => {
  for (const image of [[], 'text', {}, { dataUrl: 'https://private.invalid/photo' },
    { dataUrl: 'data:image/gif;base64,R0lGODlh' }, { dataUrl: 'data:image/png;base64,!!!!' },
    { dataUrl: 'data:image/jpeg;base64,/9j//9k=' }, { dataUrl: 'data:image/png;base64,YWJjZA==' },
    { dataUrl: png, type: 'image/webp' }, { dataUrl: png + '=' },
  ]) {
    const app = fixture(); status(await app.invoke({ message: 'Bird?', image }), 400); assert.equal(app.calls.length, 0);
  }
});

test('decoded images above 2 MiB are rejected without provider work', async () => {
  const app = fixture();
  status(await app.invoke({ message: 'Bird?', image: { dataUrl: `data:image/png;base64,${Buffer.alloc(2 * 1024 * 1024 + 1).toString('base64')}` } }), 413);
  assert.equal(app.calls.length, 0);
});

test('normal text and photo requests preserve route contract, model, output limit and image bytes', async () => {
  for (const payload of [{ message: 'Which bird?', image: null }, { message: '', image: { name: 'synthetic.png', type: 'image/png', dataUrl: png } }]) {
    const app = fixture();
    assert.equal(status(await app.invoke(payload), 200).reply, 'A likely Blue Jay.');
    assert.equal(app.providerCalls().length, 1);
    const call = app.providerCalls()[0]; const sent = JSON.parse(call.options.body);
    assert.equal(sent.model, 'gpt-5.4-mini'); assert.equal(sent.max_output_tokens, 800);
    assert.equal(call.options.headers.Authorization, 'Bearer synthetic-provider-key');
    assert.equal(sent.input[0].role, 'user');
    if (payload.image) assert.deepEqual(sent.input[0].content[1], { type: 'input_image', image_url: png });
    assert.equal(app.timers.size, 0);
  }
});

test('configured model and nested output text remain compatible', async () => {
  const app = fixture({ env: { OPENAI_MODEL: 'configured-model' }, responder: (url, options, defaults) => url.startsWith('https://api.openai.com/')
    ? response({ output_text: '', output: [{ content: [{ type: 'output_text', text: 'First' }, { type: 'output_text', text: 'Second' }] }] }) : defaults(url) });
  assert.equal(status(await app.invoke(), 200).reply, 'First\nSecond');
  assert.equal(JSON.parse(app.providerCalls()[0].options.body).model, 'configured-model');
});

test('normal JPEG and WebP containers are accepted and truncated containers fail before admission', async () => {
  for (const dataUrl of [jpeg, webp]) {
    const app = fixture();
    status(await app.invoke({ image: { dataUrl } }), 200);
    assert.equal(JSON.parse(app.providerCalls()[0].options.body).input[0].content[1].image_url, dataUrl);
    const [prefix, encoded] = dataUrl.split(',');
    const broken = fixture();
    const truncated = Buffer.from(encoded, 'base64').subarray(0, -4).toString('base64');
    status(await broken.invoke({ image: { dataUrl: `${prefix},${truncated}` } }), 400);
    assert.equal(broken.calls.length, 0);
  }
});

test('upstream failures are sanitized and never return retryable identity 401', async () => {
  for (const providerStatus of [401, 429, 500]) {
    const app = fixture({ responder: (url, options, defaults) => url.startsWith('https://api.openai.com/')
      ? response({ error: { message: 'sensitive-image-token-body' } }, providerStatus) : defaults(url) });
    const result = await app.invoke(); status(result, 502);
    assert.doesNotMatch(result.body, /sensitive|synthetic-provider|token-body/);
    assert.equal(app.providerCalls().length, 1);
  }
});

test('network exceptions are sanitized', async () => {
  const app = fixture({ responder: (url, options, defaults) => {
    if (url.startsWith('https://api.openai.com/')) throw new Error('secret request content');
    return defaults(url);
  } });
  const result = await app.invoke(); status(result, 502); assert.doesNotMatch(result.body, /secret request/);
});

test('admission deadline aborts and fails closed with no provider call', async () => {
  const app = fixture({ responder: async (url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('sensitive auth error')), { once: true });
  }) });
  const pending = app.invoke(); app.fire(8000);
  status(await pending, 503); assert.equal(app.providerCalls().length, 0); assert.equal(app.timers.size, 0);
});

test('provider deadline aborts at 20 seconds and returns sanitized 504 without retry', async () => {
  const app = fixture({ responder: async (url, options, defaults) => {
    if (!url.startsWith('https://api.openai.com/')) return defaults(url);
    return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('sensitive upstream error')), { once: true }));
  } });
  const pending = app.invoke();
  await new Promise(resolve => setImmediate(resolve)); app.fire(20000);
  status(await pending, 504); assert.equal(app.providerCalls().length, 1); assert.equal(app.timers.size, 0);
});
