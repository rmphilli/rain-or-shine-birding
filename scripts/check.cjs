const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
const files = ['app.js', 'bazaar.js', 'bazaar-config.js', 'bazaar-catalog.js'];
for (const directory of ['netlify/functions', 'scripts', 'tests', 'tests/helpers']) {
  for (const name of fs.readdirSync(path.join(root, directory))) {
    if (/\.(c?js)$/.test(name)) files.push(`${directory}/${name}`);
  }
}
files.forEach(file => run(['--check', file]));
console.log(`Syntax OK: ${files.length} JavaScript files.`);
const tests = fs.readdirSync(path.join(root, 'tests')).filter(name => name.endsWith('.test.cjs')).map(name => `tests/${name}`);
run(['--test', ...tests]);
