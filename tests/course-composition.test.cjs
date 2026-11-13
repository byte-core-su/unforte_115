const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'modules/registry.json'), 'utf8'));
const modules = registry.files.map(file => JSON.parse(fs.readFileSync(path.join(root, 'modules', file), 'utf8')));
const kit = import('../course-kit.mjs');
const fixture = moduleIds => ({ schemaVersion: 1, courseVersion: 'V-2', title: '自訂幾何與資料課', description: '跨年級選課', moduleIds });

test('twelve independent module manifests correspond to existing lessons and resources', async () => {
  const { validateCatalog } = await kit;
  validateCatalog(modules);
  assert.equal(modules.length, 12);
  assert.equal(modules.filter(module => module.grade === 7).length, 6);
  assert.equal(modules.filter(module => module.grade === 8).length, 6);
  assert.equal(new Set(modules.map(module => module.entry)).size, 12);
  for (const module of modules) {
    assert.ok(fs.existsSync(path.join(root, module.entry)));
    for (const resource of Object.values(module.resources)) assert.ok(fs.existsSync(path.join(root, resource.split('#')[0])), resource);
  }
  assert.throws(() => validateCatalog([...modules, modules[0]]), /重複/);
  assert.throws(() => validateCatalog([{ ...modules[0], entry: 'https://example.com/lesson.html' }]), /站內/);
  assert.throws(() => validateCatalog([{ ...modules[0], prerequisites: ['unknown-module'] }]), /先備/);
});

test('share link and JSON round-trip preserve custom cross-grade ordering and Chinese titles', async () => {
  const { validateCourse, encodeCourse, decodeCourse } = await kit;
  const course = fixture(['g8-03', 'g7-04', 'g8-01']);
  const clean = validateCourse({ ...course, externalUrl: 'https://example.com', html: '<script>' }, modules);
  assert.deepEqual(clean, course);
  assert.deepEqual(decodeCourse(encodeCourse(clean), modules), course);
  assert.deepEqual(validateCourse(JSON.parse(JSON.stringify(clean)), modules), course);
});

test('bad imports and links are rejected; empty drafts are accepted only before opening a course', async () => {
  const { validateCourse, decodeCourse } = await kit;
  for (const raw of [fixture(['g7-01','g7-01']), fixture(['unknown']), fixture([]), { ...fixture(['g7-01']), title: ' ' }, { ...fixture(['g7-01']), title: '課'.repeat(81) }, { ...fixture(['g7-01']), courseVersion: 'V-1' }, { ...fixture(['g7-01']), description: '字'.repeat(501) }]) assert.throws(() => validateCourse(raw, modules));
  assert.deepEqual(validateCourse(fixture([]), modules, { allowEmpty: true }).moduleIds, []);
  for (const hash of ['#course=%E0%A4%A', '#course={bad}', '#other=x', '#course=' + 'a'.repeat(16001)]) assert.throws(() => decodeCourse(hash, modules));
});

test('prerequisite reminders distinguish omitted, later and already preceding modules', async () => {
  const { prerequisiteWarnings } = await kit;
  assert.equal(prerequisiteWarnings(fixture(['g8-01','g8-03']), modules).length, 0);
  assert.equal(prerequisiteWarnings(fixture(['g8-03']), modules).length, 1);
  assert.equal(prerequisiteWarnings(fixture(['g8-03','g8-01']), modules).length, 1);
  assert.equal(prerequisiteWarnings(fixture(['g7-01','g7-02','g7-03','g7-04','g7-05','g7-06']), modules).length, 0);
});

test('standalone and embedded lesson controls share explicit navigation roles', () => {
  const viewer = fs.readFileSync(path.join(root, 'course-viewer.mjs'), 'utf8');
  assert.match(viewer, /closest\('\[data-course-direction\]'\)/);
  assert.match(viewer, /go\(position \+ \(direction === 'next' \? 1 : -1\)\)/);
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
  assert.match(home, /href="course-builder.html"/);
});

test('the curriculum map page keeps both grade maps in curriculum order and is linked from teacher prep', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const prep = home.match(/<section id="teacher-resources"[\s\S]*?<\/section>/)?.[0];
  assert.match(prep, /href="curriculum-map.html"/);
  const map = fs.readFileSync(path.join(root, 'curriculum-map.html'), 'utf8');
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
