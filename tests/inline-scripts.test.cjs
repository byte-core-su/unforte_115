const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const pages = ['1150701.html', '1150702.html', '1150703.html', '1150704.html', '1150705.html', '1150706.html', '1150802.html', '1150803.html', '1150804.html', '1150805.html', '1150806.html'];
for (const filename of pages) {
  const html = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map(match => match[1])
    .filter(script => script.trim());
  assert.ok(scripts.length, `${filename}: inline lesson scripts should be present`);
  scripts.forEach(script => new vm.Script(script, { filename }));
}
const energyHtml = fs.readFileSync(path.join(__dirname, '..', '1150803.html'), 'utf8');
assert.match(energyHtml, /id="sim-data-new"/);
assert.match(energyHtml, /id="sim-data-demo"/);
console.log('inline lesson scripts parsed');
