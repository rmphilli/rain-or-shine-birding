const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

// Deliberately small DOM substitute: tests exercise real application code, not layout.
class Element {
  constructor() {
    this.listeners = new Map(); this.children = []; this.dataset = {};
    this.style = {}; this.value = ''; this.hidden = false; this.disabled = false;
    this.textContent = ''; this._html = ''; this.parts = new Map();
    this.classList = { add() {}, remove() {}, toggle() {} };
  }
  set innerHTML(value) { this._html = value; this.children = []; }
  get innerHTML() { return this._html; }
  addEventListener(type, callback) {
    this.listeners.set(type, [...(this.listeners.get(type) || []), callback]);
  }
  async dispatch(type, event = {}) {
    for (const callback of this.listeners.get(type) || []) await callback({ target: this, preventDefault() {}, ...event });
  }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
  querySelector(selector) {
    if (!this.parts.has(selector)) this.parts.set(selector, new Element());
    return this.parts.get(selector);
  }
  querySelectorAll() { return []; }
  closest() { return this; }
  setAttribute(name, value) { this[name] = value; }
  focus() {}
}

async function createApp({ storage = {} } = {}) {
  const nodes = new Map();
  const inputs = ['Jeff', 'Alex', 'Matt'].map(member => {
    const input = new Element(); input.dataset.member = member; return input;
  });
  const document = new Element();
  document.querySelector = selector => {
    if (!nodes.has(selector)) nodes.set(selector, new Element());
    return nodes.get(selector);
  };
  document.querySelectorAll = selector => selector === '.file-input' ? inputs : [];
  document.createElement = () => new Element();
  document.hidden = false;
  const saved = new Map(Object.entries(storage));
  const localStorage = {
    getItem: key => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, String(value)),
    removeItem: key => saved.delete(key),
  };
  const timers = new Map(); let nextTimer = 0;
  const window = new Element();
  Object.assign(window, {
    confirm: () => true, matchMedia: () => ({ matches: false }),
    setTimeout: callback => { timers.set(++nextTimer, callback); return nextTimer; },
    clearTimeout: id => timers.delete(id),
    setInterval: () => ++nextTimer, clearInterval() {},
    requestAnimationFrame: () => ++nextTimer, cancelAnimationFrame() {},
  });
  const calls = [];
  let responder = async url => { throw new Error(`Unexpected network request in test: ${url}`); };
  const context = vm.createContext({
    document, window, localStorage, navigator: { onLine: true },
    location: { hash: '', search: '', origin: 'http://test.invalid', pathname: '/', protocol: 'file:' },
    history: { replaceState() {} }, URLSearchParams, AbortController,
    atob: value => Buffer.from(value, 'base64').toString('utf8'),
    console, setTimeout: window.setTimeout, clearTimeout: window.clearTimeout,
    fetch: async (url, options = {}) => {
      calls.push({ url, options });
      if (calls.length > 100) throw new Error('Test network-call budget exceeded; check pagination mocks.');
      return responder(url, options);
    },
  });
  const evaluate = code => vm.runInContext(code, context, { timeout: 3000 });
  // Run the complete, unmodified app, including event registration and initial render.
  vm.runInContext(source, context, { filename: 'app.js', timeout: 3000 });
  await new Promise(resolve => setImmediate(resolve));
  function set(name, value) { context.__value = value; evaluate(`${name} = __value`); delete context.__value; }
  return {
    evaluate, set, window, document, inputs, saved, calls, timers,
    read: code => JSON.parse(evaluate(`JSON.stringify(${code})`)),
    element: selector => document.querySelector(selector),
    respond: callback => { responder = callback; },
    async settle() { await new Promise(resolve => setImmediate(resolve)); },
    configureCloud(expiresAt = Date.now() + 3600000) {
      set('appConfig', { supabaseUrl: 'https://test.invalid', supabaseAnonKey: 'test-public-key' });
      set('authSession', { access_token: 'test-access', refresh_token: 'test-refresh', expires_at: expiresAt });
      set('isRemoteReady', true);
    },
    async importCsv(member, csv, name = 'test.csv') {
      const input = inputs.find(item => item.dataset.member === member);
      input.files = [{ name, text: async () => csv }];
      await input.dispatch('change');
    },
  };
}

function response(body, status = 200, headers = {}) {
  const responseHeaders = Array.isArray(body)
    ? { 'content-range': `0-${Math.max(0, body.length - 1)}/${body.length}`, ...headers }
    : headers;
  return { ok: status >= 200 && status < 300, status, statusText: `HTTP ${status}`,
    json: async () => body, text: async () => JSON.stringify(body),
    headers: { get: name => responseHeaders[name.toLowerCase()] ?? null } };
}
function observation(member = 'Matt', species = 'Northern Cardinal', extra = {}) {
  return { id: `${member}-${species}`, member, species, scientific: '', date: '2026-01-01',
    count: '1', latitude: null, longitude: null, location: 'Test field', checklist: '', sourceName: 'fixture.csv', ...extra };
}
module.exports = { createApp, response, observation, root };
