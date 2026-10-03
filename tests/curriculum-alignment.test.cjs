const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const read = filename => fs.readFileSync(path.join(root, filename), 'utf8');
const official = 'https://stv.naer.edu.tw/data/course_outline/pta_18529_8438379_60115.pdf';

for (const grade of [7, 8]) {
  test(`grade ${grade} source and generated plan include verifiable alignment`, () => {
    const source = read(`LESSON_PLAN_GRADE_${grade}.md`);
    const html = read(`lesson-plan-grade-${grade}.html`);
    for (const text of [source, html]) {
      for (const page of [11, 14, 46]) assert.ok(text.includes(`${official}#page=${page}`));
      assert.match(text, /教材設計者依活動建立的教學對照/);
      assert.match(text, /大寫 P 為程式設計，小寫 p 為溝通表達/);
      assert.match(text, /若沒有使用資訊科技組織與表達的證據/);
      assert.match(text, /並非官方課綱制定的評分等第/);
    }
    const units = source.split(/^### 第 [1-6] 課.*$/m).slice(1);
    assert.equal(units.length, 6);
    assert.equal((html.match(/<strong>課綱對應<\/strong>/g) || []).length, 6);
    assert.equal((html.match(/<strong>採證重點<\/strong>/g) || []).length, 6);
    for (const unit of units) {
      const alignment = unit.match(/^- \*\*課綱對應\*\*：(.*)$/m)?.[1];
      const evidence = unit.match(/^- \*\*採證重點\*\*：(.*)$/m)?.[1];
      assert.ok(alignment && evidence, 'each unit needs alignment and evidence');
      assert.match(alignment, /資 [APHT]-IV-\d/);
      assert.match(alignment, /運 [tpa]-IV-\d/);
      assert.ok(html.includes(alignment), 'generated alignment must match source');
      assert.ok(html.includes(evidence), 'generated evidence must match source');
    }
  });
}

test('grade 8 ethics codes distinguish review, partial coverage and exclusions', () => {
  const source = read('LESSON_PLAN_GRADE_8.md');
  const unit = source.split('### 第 2 課')[1].split('### 第 3 課')[0];
  assert.match(unit, /複習資 H-IV-1、資 H-IV-2，部分融入資 H-IV-5/);
  assert.match(unit, /資 H-IV-4 不列為本課涵蓋證據/);
  const labs = read('curriculum-labs.js');
  const ethics = labs.match(/'1150802\.html': \{([\s\S]*?)\n    \}/)?.[1];
  const codes = ethics.match(/codes: '([^']+)'/)?.[1];
  assert.match(codes, /資 H-IV-1、資 H-IV-2（複習）/);
  assert.match(codes, /資 H-IV-5（倫理面向部分融入）/);
  assert.doesNotMatch(codes, /H-IV-4/);
  assert.match(ethics, /不涵蓋資 H-IV-4/);
});

test('reference code and optional modules are not reported as universal implementation', () => {
  const source = read('LESSON_PLAN_GRADE_8.md');
  const unit = source.split('### 第 3 課')[1].split('### 第 4 課')[0];
  assert.match(unit, /資 P-IV-3 僅作參考程式閱讀，非獨立實作採證/);
  const grade7 = read('LESSON_PLAN_GRADE_7.md');
  const extension = grade7.split('### 第 5 課')[1].split('### 第 6 課')[0];
  assert.match(extension, /資 P-IV-4、資 P-IV-5 僅列選做延伸/);
  assert.match(read('CURRICULUM_ALIGNMENT.md'), /資 H-IV-4 不列為已涵蓋項目/);
});

test('presentation uses formal prefixes and consistent partial ethics coverage', () => {
  const deck = read('presentations/20261110.html');
  const slide = deck.match(/<section class="slide" aria-labelledby="title-13">([\s\S]*?)<\/section>/)?.[1];
  assert.ok(slide);
  const table = slide.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1];
  assert.match(table, /資 A-IV-1、資 P-IV-1、資 P-IV-2/);
  assert.match(table, /資 A-IV-2、資 A-IV-3、資 P-IV-3/);
  assert.match(table, /資 H-IV-1／2／3、資 H-IV-5（部分）/);
  assert.doesNotMatch(table, /H-IV-4/);
  assert.match(slide, /運 t-IV-4、運 p-IV-1、運 a-IV-2/);
  assert.match(deck, /官方課綱：學習表現（印刷第7頁）/);
  assert.equal((deck.match(/class="slide-page"/g) || []).length, 16);
});

test('dynamic lesson rendering does not replace the attached curriculum lab', () => {
  for (const page of ['1150801.html', '1150802.html', '1150805.html', '1150806.html']) {
    let sibling;
    const controls = new Map();
    const control = selector => {
      if (!controls.has(selector)) controls.set(selector, {
        innerHTML: '', textContent: '', value: '', listeners: {},
        addEventListener(type, listener) { this.listeners[type] = listener; },
        click() { this.listeners.click?.(); }
      });
      return controls.get(selector);
    };
    const section = {
      setAttribute() {},
      querySelector(selector) { return selector === '[data-quiz]' ? null : control(selector); }
    };
    const main = {
      id: 'app-container', innerHTML: '',
      appendChild() { assert.fail('must not mount inside the dynamic render root'); },
      insertAdjacentElement(position, element) { assert.equal(position, 'afterend'); sibling = element; }
    };
    vm.runInNewContext(read('curriculum-labs.js'), {
      document: { querySelector: () => main, createElement: () => section },
      window: { location: { pathname: `/${page}` } }, Math
    });
    main.innerHTML = '<article>rendered lesson</article>';
    assert.equal(sibling, section);
    assert.match(sibling.innerHTML, /課綱補強實作/);
  }
});
