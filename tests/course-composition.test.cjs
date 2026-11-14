const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'modules/registry.json'), 'utf8'));
const modules = registry.files.map(file => JSON.parse(fs.readFileSync(path.join(root, 'modules', file), 'utf8')));
test('twelve module manifests correspond to existing lessons and resources', () => {
  assert.equal(modules.length, 12);
  assert.equal(modules.filter(module => module.grade === 7).length, 6);
  assert.equal(modules.filter(module => module.grade === 8).length, 6);
  assert.equal(new Set(modules.map(module => module.entry)).size, 12);
  const ids = new Set(modules.map(module => module.id));
  assert.equal(ids.size, 12);
  for (const module of modules) {
    assert.equal(module.entry, `1150${module.grade}0${module.lesson}.html`);
    assert.ok(fs.existsSync(path.join(root, module.entry)));
    for (const resource of Object.values(module.resources)) assert.ok(fs.existsSync(path.join(root, resource.split('#')[0])), resource);
    for (const prerequisite of module.prerequisites) assert.ok(ids.has(prerequisite) && prerequisite !== module.id);
  }
});

test('lessons retain their previous, next and overview navigation', () => {
  const engine = fs.readFileSync(path.join(root, 'lesson-route.js'), 'utf8');
  assert.match(engine, /data-course-direction="next"/);
  for (const item of modules) {
    const html = fs.readFileSync(path.join(root, item.entry), 'utf8');
    assert.match(html, /data-course-direction="outline"/);
    const next = modules.find(candidate => candidate.grade === item.grade && candidate.lesson === item.lesson + 1);
    if (next) assert.ok(html.includes(`data-course-direction="next" href="${next.entry}"`), item.id);
    else assert.match(html, /data-course-direction="outline" data-route-finish/);
  }
});

test('the homepage opens with a course chooser that links each course', () => {
  const home = fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(home, /<main[^>]*>\s*<section id="course-map"/);
  const chooser = home.match(/<section id="course-map"[\s\S]*?<\/section>/)[0];
  for (const href of ['1150700.html', '1150800.html', 'codegame/index.html', 'pythonlab/index.html']) assert.match(chooser, new RegExp(`href="${href}"`));
  for (const grade of [7,8]) {
    const card = home.match(new RegExp(`<article class="curriculum-grade curriculum-grade-${grade}"[\\s\\S]*?<\\/article>`))?.[0];
    assert.ok(card, `grade ${grade} course card`);
    assert.match(card, new RegExp(`href="1150${grade}00.html"`));
  }
  assert.doesNotMatch(home, /自訂課程|customize-course|course-builder\.html|course\.html/);
  assert.match(home, /href="teacher-resources\.html"/);
  assert.doesNotMatch(home, /id="teacher-resources"|id="teacher-demo-toggle"|href="lesson-plan-grade-[78]\.html"/);
});

test('the curriculum map page keeps both grade maps in curriculum order and is linked from teacher prep', () => {
  const prep = fs.readFileSync(path.join(root, 'teacher-resources.html'), 'utf8');
  assert.match(prep, /href="curriculum-map\.html"/);
  const map = fs.readFileSync(path.join(root, 'curriculum-map.html'), 'utf8');
  assert.match(map, /href="teacher-resources\.html"/);
  for (const file of ['curriculum-map.css', 'curriculum-map.js']) assert.ok(map.includes(`"${file}"`) && fs.existsSync(path.join(root, file)), `${file} should be loaded`);
  for (const grade of [7, 8]) {
    const article = map.match(new RegExp(`<article class="curriculum-grade curriculum-grade-${grade}"[\\s\\S]*?<\\/article>`))?.[0];
    assert.ok(article, `grade ${grade} map`);
    assert.equal((article.match(/<li><a /g) || []).length, 6);
    assert.ok((article.match(/<li data-from=/g) || []).length >= 4, `grade ${grade} should keep its concept relations`);
    let previous = -1;
    for (const module of modules.filter(item => item.grade === grade)) {
      assert.ok(article.includes(module.title), `${module.title} on the map`);
      const position = article.indexOf(`href="${module.entry}"`);
      assert.ok(position > previous, `map order for ${module.id}`);
      previous = position;
    }
  }
});
