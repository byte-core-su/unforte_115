const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const deck = fs.readFileSync(path.join(__dirname, '../presentations/20261110.html'), 'utf8');
const article = number => deck.match(new RegExp(`<article class="slide-page" id="slide-${number}">([\\s\\S]*?)</article>`))?.[1];
const visible = number => article(number)?.split('<details class="notes">')[0];

test('presentation states both course progressions on the slides, not only in notes', () => {
  assert.match(visible(4), /Scratch 核心程式思維/);
  for (const topic of ['讀懂積木', '預測結果', '迴圈', '變數', '多組資料測試', '自訂積木與參數為進階延伸']) {
    assert.ok(visible(4).includes(topic), topic);
  }
  assert.match(visible(5), /Scratch 清單與演算法/);
  assert.match(visible(5), /執行前、執行中、執行後/);
});

test('activity rhythm and interactive examples connect operations with reasoning', () => {
  for (const phase of ['情境任務與目標', '概念示範與引導', '獨立 Scratch 挑戰', '成果證據', '離堂檢核']) {
    assert.ok(visible(8).includes(phase), phase);
  }
  assert.match(visible(9), /一次只改次數或轉角/);
  for (const stage of ['執行前', '執行中', '執行後']) assert.ok(visible(10).includes(stage));
  assert.match(visible(10), /空清單/);
  assert.match(visible(11), /同題重試/);
  assert.match(visible(15), /希望支援的理解/);
  assert.match(visible(15), /教師可觀察的證據/);
  assert.match(visible(15), /尚未量測學習成效/);
  assert.match(article(8), /八年級第3課核心是資料模擬與追蹤/);
});

test('pedagogy revision preserves slide count and audited task counts', () => {
  assert.equal((deck.match(/class="slide-page"/g) || []).length, 16);
  const counts = number => [...visible(number).matchAll(/<td>(\d+／\d+／\d+／\d+)<\/td>/g)].map(match => match[1]);
  assert.deepEqual(counts(4), ['2／0／0／1', '0／3／1／0', '2／1／1／0', '2／1／1／0', '1／2／0／0', '1／1／1／1']);
  assert.deepEqual(counts(5), ['1／2／0／0', '1／2／0／1', '0／2／0／0', '1／3／0／0', '2／4／0／0', '1／2／1／0']);
  assert.match(visible(6), /50\.0%/);
  assert.match(visible(6), /28\.6%/);
  assert.match(visible(6), /71\.4%/);
});
