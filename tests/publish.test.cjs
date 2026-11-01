const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { build } = require('../scripts/build.cjs');
const { root } = require('./helpers/app-harness.cjs');

test('public build preserves every selected source byte and excludes internal files', () => {
  const entries = build();
  assert.ok(entries.includes('index.html')); assert.ok(entries.includes('bazaar.html'));
  assert.ok(entries.includes(path.join('assets', 'clay-birding-hero.png')));
  for (const entry of entries) assert.deepEqual(fs.readFileSync(path.join(root, 'dist', entry)), fs.readFileSync(path.join(root, entry)), entry);
  const publicRoot = fs.readdirSync(path.join(root, 'dist')).sort();
  assert.deepEqual(publicRoot, ['app.js', 'assets', 'bazaar-catalog.js', 'bazaar-config.js', 'bazaar.css', 'bazaar.html', 'bazaar.js', 'index.html', 'samples', 'styles.css', 'team-birding-scene.jpg']);
  for (const name of ['.git', '.env', '.netlify', 'artifacts', 'database', 'tests', 'README.md', 'PROJECT-HANDOFF.md', 'netlify']) {
    assert.equal(fs.existsSync(path.join(root, 'dist', name)), false, name);
  }
});

test('build cleanup refuses any output outside the designated dist directory', () => {
  assert.throws(() => build(root), /Output must be/);
  assert.throws(() => build(path.dirname(root)), /Output must be/);
});
