const fs = require('node:fs');
const path = require('node:path');
const { packZip } = require('./build-scratch-l6-demo.cjs');

const root = path.resolve(__dirname, '..');
const extension = path.join(root, 'pythonlab/chrome-sync-extension');
const files = new Map(fs.readdirSync(extension).sort().map(name => [name, fs.readFileSync(path.join(extension, name))]));
const target = path.join(root, 'pythonlab/chrome-sync-extension.zip');
fs.writeFileSync(target, packZip(files));
console.log('Built pythonlab/chrome-sync-extension.zip');
