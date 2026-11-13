const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const deck = fs.readFileSync(path.join(__dirname, '../presentations/20261110.html'), 'utf8');
const article = number => deck.match(new RegExp(`<article class="slide-page" id="slide-${number}">([\\s\\S]*?)</article>`))?.[1];
const visible = number => article(number)?.split('<details class="notes">')[0];

test('detailed task counts and calculation definitions remain in the speaker appendix', () => {
  const appendix = article(6).split('<section class="analysis-appendix"')[1];
  assert.ok(appendix, 'speaker notes need the calculation appendix');
  const legends = [...appendix.matchAll(/<caption class="task-legend">([^<]+)<\/caption>/g)];
  assert.equal(legends.length, 2);
  for (const [, legend] of legends) {
    for (const label of ['P 程式設計', 'A 演算法／資料結構推理', 'M 混合', 'O 其他']) {
      assert.ok(legend.includes(label), label);
    }
  }
  assert.match(appendix, /按全部必做任務數計算/);
  assert.match(appendix, /content-distribution/);
  assert.match(appendix, /M 混合與 O 其他/);
  assert.match(appendix, /分母 P＋A＝程式設計＋演算法／資料結構推理/);
});

test('presentation states both course progressions on the slides, not only in notes', () => {
  assert.match(visible(4), /七年級｜結構化程式與互動作品/);
  for (const topic of ['讀懂積木', '預測結果', '迴圈', '變數', '多組資料測試', '自訂積木與參數為進階延伸', '六個單元與學習成果']) {
    assert.ok(visible(4).includes(topic), topic);
  }
  assert.match(visible(5), /八年級｜資料結構與演算法應用/);
  assert.match(visible(5), /執行前、執行中、執行後/);
  assert.match(visible(4), /心智圖主分類・程式設計/);
  assert.match(visible(5), /心智圖主分類・演算法/);
  for (const rationale of ['程式設計 → 七年級', '結構化程式與互動作品', '演算法 → 八年級', '資料結構與演算法應用', '程式與流程推理各 8 項', '資料結構與推理 15 項、程式 6 項', '依課程主軸、核心能力與最終成果判定']) {
    assert.ok(visible(6).includes(rationale), rationale);
  }
});

test('activity rhythm and interactive examples connect operations with reasoning', () => {
  for (const phase of ['情境任務與目標', '概念示範與引導', '獨立任務與驗證', '成果證據', '離堂檢核']) {
    assert.ok(visible(8).includes(phase), phase);
  }
  assert.match(visible(9), /只改轉角，試跑後說明如何修正/);
  for (const stage of ['執行前', '執行中', '執行後']) assert.ok(visible(10).includes(stage));
  assert.match(visible(10), /空清單/);
  assert.match(visible(11), /同題重試/);
  assert.match(visible(15), /希望支援的理解/);
  assert.match(visible(15), /教師可觀察的證據/);
  assert.match(visible(15), /尚未量測學習成效/);
  assert.match(article(8), /八年級第3課核心是資料模擬與追蹤/);
  assert.match(visible(8), /依目標實作程式或追蹤資料/);
  assert.match(visible(9), /程式設計・七年級案例/);
  assert.match(visible(10), /演算法・八年級案例/);
  assert.match(visible(11), /以清單案例說明分級支援/);
  assert.match(visible(12), /八年級的資料追蹤評量/);
  assert.match(visible(12), /七年級另看程式作品、結構說明與測試紀錄/);
});

test('teacher package revision preserves slide count and audited task counts', () => {
  assert.equal((deck.match(/class="slide-page"/g) || []).length, 16);
  const counts = [...article(6).matchAll(/<td>(\d+／\d+／\d+／\d+)<\/td>/g)].map(match => match[1]);
  assert.deepEqual(counts, ['2／0／0／1', '0／3／1／0', '2／1／1／0', '2／1／1／0', '1／2／0／0', '1／1／1／1', '1／2／0／0', '1／2／0／1', '0／2／0／0', '1／3／0／0', '2／4／0／0', '1／2／1／0']);
  assert.match(article(6), /50\.0%/);
  assert.match(article(6), /28\.6%/);
  assert.match(article(6), /71\.4%/);
  assert.match(visible(6), /45 項/);
});

test('package resources, classroom use and assessment examples support teacher adoption', () => {
  for (const resource of ['課程總覽', '逐課教案', '互動教材', 'Scratch 範例', '學習紀錄', '評量規準']) {
    assert.ok(visible(2).includes(resource), resource);
  }
  for (const stage of ['課前準備', '第一節引導', '第一節操作', '第二節延伸', '收取與回饋']) {
    assert.ok(visible(7).includes(stage), stage);
  }
  assert.match(visible(9), /畫三角形時，哪一組指令在重複/);
  assert.match(visible(10), /第二輪讀到多少？累計又是多少/);
  assert.match(visible(11), /部分完成的追蹤表/);
  assert.match(visible(12), /教師填寫示例/);
  assert.match(visible(12), /遷移與改善/);
  assert.match(visible(14).replace(/<[^>]+>/g, ''), /先用紙卡與追蹤表預測/);
});

test('presentation links reach current local teaching pages and visible example sections', () => {
  const presentation = path.join(__dirname, '../presentations');
  assert.doesNotMatch(deck, /href="[^"]*STUDENT_RECORDS\.md/);
  assert.match(deck, /href="\.\.\/student-records\.html#g8-03"/);
  for (const [, href] of deck.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
    const url = new URL(href, 'https://example.test/presentations/20261110.html');
    if (url.hostname !== 'example.test') continue;
    const file = path.resolve(presentation, '..', '.' + decodeURIComponent(url.pathname));
    assert.ok(fs.existsSync(file), href);
    if (!url.hash || !file.endsWith('.html')) continue;
    const id = url.hash.slice(1);
    const html = fs.readFileSync(file, 'utf8');
    const generated = { 'adaptive-practice': 'adaptive-practice.js', 'learning-guide': 'learning-guides.js' }[id];
    if (generated) {
      assert.ok(html.includes(`src="${generated}"`), href);
      assert.ok(fs.readFileSync(path.join(presentation, '..', generated), 'utf8').includes(`section.id = '${id}'`));
    } else assert.ok(html.includes(`id="${id}"`), href);
    if (['adaptive-practice', 'energy-trace', 'polygon-simulator'].includes(id)) assert.equal(url.searchParams.get('route'), 'all', href);
  }
});
