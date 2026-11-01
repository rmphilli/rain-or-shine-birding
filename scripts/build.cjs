const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const publicFiles = [
  'index.html', 'styles.css', 'app.js', 'bazaar.html', 'bazaar.css',
  'bazaar.js', 'bazaar-config.js', 'bazaar-catalog.js', 'team-birding-scene.jpg',
];
const publicDirectories = ['assets', 'samples'];

function build(output = path.join(root, 'dist')) {
  // Never allow cleanup of an arbitrary directory supplied by a caller.
  if (path.resolve(output) !== path.join(root, 'dist')) throw new Error('Output must be this repository\'s dist directory.');
  if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) throw new Error('Refusing a linked dist directory.');
  const entries = [];
  function collect(relative) {
    const source = path.join(root, relative);
    const stat = fs.lstatSync(source);
    if (stat.isSymbolicLink()) throw new Error(`Refusing public symlink: ${relative}`);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(source)) collect(path.join(relative, name));
    } else if (stat.isFile()) entries.push(relative);
  }
  // Validate the entire input before replacing an existing build.
  [...publicFiles, ...publicDirectories].forEach(collect);
  fs.rmSync(output, { recursive: true, force: true });
  for (const relative of entries) {
    const destination = path.join(output, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(root, relative), destination);
  }
  console.log(`Staged ${entries.length} public files in dist (no transformation).`);
  return entries;
}

module.exports = { build, publicFiles, publicDirectories };
if (require.main === module) build();
