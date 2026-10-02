// 依題目規格獨立計算期望值；不執行參考解答來產生答案。
const c = (name, input, expected, extra = {}) => ({ name, input: String(input), expected: String(expected), ...extra });
const num = { numeric: true };
const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);
const data = values => [values.length, ...values].join('\n');
const table = (rows, cols) => range(1, rows).flatMap(i => range(1, cols).map(j => `${i} * ${j} = ${i * j}`)).join('\n');
const frame = n => range(0, n - 1).map(row => range(0, n - 1).map(col => row === 0 || col === 0 || row === n - 1 || col === n - 1 ? '*' : ' ').join('')).join('\n');
const sum = values => values.reduce((a, b) => a + b, 0);
const shopping = (balance, items, tier) => {
  const prices = tier < 2 ? [100, 200, 300] : [120, 250, 380];
  const original = sum(items.map(([code, qty]) => prices[code - 1] * qty));
  const total = tier === 3 && original >= 1000 ? Math.floor(original * 9 / 10) : original;
  const result = balance >= total ? `結帳成功，餘額剩${balance - total}元` : `餘額不足，請另外加值${total - balance}元`;
  return { input: [balance, ...items.flatMap(([code, qty]) => tier < 2 ? Array(qty).fill(code) : [code, qty]), -1].join('\n'), expected: (tier === 3 ? `原價${original}元\n折扣後${total}元\n` : '') + result, total };
};
const call = (name, args, expected) => ({ function: name, args, expected });

// dense 只用於維護測試：小型有限範圍全列舉、大型範圍取密集樣本與端點。
export function supplementalTests(id, stage, dense = false) {
  const tier = stage - 1;
  const tests = [];
  const add = (input, expected, extra = {}, label = '補充情境') => tests.push(c(`${label} ${tests.length + 1}`, input, expected, extra));
  if (id === 1 || stage === 0) return tests;
  switch (id) {
    case 2: {
      const people = ['Alex Chen', '王小明', '阿米🙂', 'O\'Neil', '小安 / 小雨', '  小安  ', '同學'.repeat(50)];
      people.forEach((name, i) => {
        const group = `九年${i + 1}班`, role = ['值日生', '圖書 股長', '活動🙂助手'][i % 3];
        if (stage === 1) add(name, `今天值日生：${name}`, {}, '文字原樣保留');
        if (tier === 1) add(`${group}\n${name}`, `${group} / ${name}`, {}, '兩筆輸入');
        if (tier === 2) add(`${group}\n${name}`, `姓名：${name}\n班級：${group}`, {}, '重排資料');
        if (tier === 3) add(`${group}\n${name}\n${role}`, `[${group}] ${name}\n工作：${role}`, {}, '三筆輸入');
      });
      break;
    }
    case 3: {
      if (stage === 1) [[0, 0, 0], [999999, -999999, 1], [-7, -2, -3], [1, 2, 4], [1000000000000, 1, -1]].forEach(values => add(values.join('\n'), sum(values), {}, '整數加總'));
      else if (tier < 3) {
        const scores = dense ? [0, .1, 1, 20, 50, 59.9, 60, 99.9, 100] : [0, .1, 50, 100];
        for (const a of scores) for (const b of scores) add(`${a}\n${b}`, tier === 1 ? (a + b) / 2 : (a * 2 + b) / 3, num, '順序與小數');
      } else {
        const seconds = [...new Set([0, 1, 58, 59, 60, 61, 119, 120, 3598, 3599, 3600, 3601, 3659, 3660, 3661, 7199, 7200, 86399, 86400, ...(dense ? range(0, 180) : [])])];
        seconds.forEach(s => add(s, `${Math.floor(s / 3600)}\n${Math.floor(s / 60) % 60}\n${s % 60}`, {}, '換算門檻'));
      }
      break;
    }
    case 4: {
      if (stage === 1) [-1000000000000, -3, -2, -1, 0, 1, 2, 3, 1000000000001].forEach(n => add(n, n % 2 === 0 ? '偶數' : '奇數', {}, '正負與零'));
      else if (tier < 3) {
        const threshold = tier === 1 ? 30 : 35, depth = tier === 1 ? 1.6 : 2;
        const pressures = tier === 1 ? [0, threshold - .001, threshold, threshold + .001, 100] : [-1e12, -.001, 0, threshold - .001, threshold, threshold + .001, 100, 100.001, 1e12];
        const treads = tier === 1 ? [0, depth - .001, depth, depth + .001, 20] : [-1e12, -.001, 0, depth - .001, depth, depth + .001, 20, 20.001, 1e12];
        for (const p of pressures) for (const d of treads) {
          // 學生介面保留所有門檻交叉及各參數越界；密集測試另外驗證越界組合。
          if (!dense && tier === 2 && (p < 0 || p > 100) && (d < 0 || d > 20)) continue;
          add(`${p}\n${d}`, tier === 2 && (p < 0 || p > 100 || d < 0 || d > 20) ? '輸入無效' : p < threshold || d < depth ? '需要維護' : '不需要維護', {}, '條件交叉');
        }
      } else (dense ? range(-2, 102) : [-1000000000000, -1, 0, 1, 58, 59, 60, 61, 88, 89, 90, 91, 99, 100, 101, 1000000000000]).forEach(s => add(s, s < 0 || s > 100 ? '輸入無效' : s >= 90 ? '優良' : s >= 60 ? '及格' : '再加油', {}, '分級端點'));
      break;
    }
    case 5: {
      if (stage === 1) break; // 無輸入的固定加總題，維護測試檢查錯誤程式。
      if (tier < 3) {
        const ns = [...new Set([1, 2, 3, 4, 6, 99, 100, 101, 9999, 10000, ...(tier === 2 ? [-1000000000000, -1, 0, 10001, 1000000000000] : []), ...(dense ? range(1, 250) : [])])];
        ns.forEach(n => add(n, tier === 2 && (n < 1 || n > 10000) ? '輸入無效' : tier === 1 ? n * (n + 1) / 2 : Math.floor(n / 2) * (Math.floor(n / 2) + 1), {}, '累加端點'));
      } else {
        const endpoints = dense ? range(0, 20) : [0, 1, 2, 3, 4, 9999, 10000];
        for (const a of endpoints) for (const b of endpoints) {
          const lo = Math.ceil(a / 3), hi = Math.floor(b / 3);
          add(`${a}\n${b}`, a > b ? '輸入無效' : hi < lo ? 0 : 3 * (lo + hi) * (hi - lo + 1) / 2, {}, '區間與倍數');
        }
        [[-1e12, 0], [0, 1e12], [10001, 10001], [0, -1]].forEach(([a, b]) => add(`${a}\n${b}`, '輸入無效', {}, '區間越界'));
      }
      break;
    }
    case 6: {
      if (stage === 1) [0, 1, 3, 9, 12, -2].forEach(n => add(n, range(1, 9).map(j => `${n} * ${j} = ${n * j}`).join('\n'), {}, '乘法各項'));
      if (tier === 2) {
        const sizes = dense ? range(1, 12) : [1, 2, 3, 11, 12];
        for (const rows of sizes) for (const cols of sizes) add(`${rows}\n${cols}`, table(rows, cols), {}, '列欄分開調整');
        [-1000000000000, -1, 0, 13, 1000000000000].forEach(n => { add(`${n}\n3`, '輸入無效', {}, '無效列數'); add(`3\n${n}`, '輸入無效', {}, '無效欄數'); });
      }
      if (tier === 3) range(1, 12).concat([-1000000000000, -1, 0, 13, 1000000000000]).forEach(n => add(n, n < 1 || n > 12 ? '輸入無效' : frame(n), {}, '空心框各尺寸'));
      break;
    }
    case 7: {
      const streams = [[], [0], [0, 0], [-2, 0, 2], [10000], [10001], [-1000000000000, 1000000000000], [10000, 0, 10001, -2, 1], [2, 7, 3], [9, 3, 1], [1, 3, 9], Array(100).fill(10000)];
      if (dense) for (const a of [-2, 0, 1, 9999, 10000, 10001]) for (const b of [-2, 0, 1, 9999, 10000, 10001]) streams.push([a, b]);
      streams.forEach(values => {
        const accepted = tier >= 2 ? values.filter(n => n >= 0 && n <= 10000) : values;
        const expected = stage === 1 ? values.map(n => String(BigInt(n) * BigInt(n))).join('\n') : tier === 1 ? sum(values) : tier === 2 ? `${sum(accepted)}\n${accepted.length}` : accepted.length ? `${sum(accepted)}\n${accepted.length}\n${Math.max(...accepted)}` : '沒有資料';
        add([...values, -1].join('\n'), expected, {}, '串流順序與筆數');
        if (values.length < 5) add([...values, -1, 9999, -2].join('\n'), expected, {}, '停止後忽略剩餘資料');
      });
      break;
    }
    case 8: {
      const sets = [[], [0], [60], [100], [0, 0], [59, 60, 61], [100, 60, 59, 0], [60, 59, 0, 100], Array(100).fill(0), Array(100).fill(60), range(1, 100)];
      if (tier === 3) sets.push([-1000, 0, 1000, -1000], [2, 1, 0, -1, 2, 1], Array(100).fill(-1000), [-1001], [1001], [1, -1001, 1], [1, 1001, 1]);
      if (tier === 2) sets.push([-1], [101], [60, -1, 100], [60, 101, 100], [101, 60], [60, 101]);
      if (dense) {
        if (tier === 2) range(0, 100).forEach(n => sets.push([n]));
        const values = tier === 3 ? [-1, 0, 1] : [0, 59, 60, 61, 99, 100];
        for (const a of values) for (const b of values) for (const d of values) sets.push([a, b, d]);
      }
      sets.forEach(values => {
        let expected, extra = {};
        if (stage === 1) expected = sum(values);
        else if (tier === 1) { expected = values.length ? sum(values) / values.length : '沒有資料'; if (values.length) extra = num; }
        else if (values.some(v => tier === 2 ? v < 0 || v > 100 : v < -1000 || v > 1000)) expected = '輸入無效';
        else if (tier === 2) { const accepted = values.filter(v => v >= 60); expected = accepted.length ? `${sum(accepted) / accepted.length}\n${accepted.length}` : '沒有及格資料'; if (accepted.length) extra = num; }
        else { const unique = [...new Set(values)]; expected = `[${unique.join(', ')}]\n${sum(unique)}`; }
        add(data(values), expected, extra, '清單組合');
      });
      if (tier >= 2) [-1000000000000, -1, 101, 1000000000000].forEach(n => add(n, '輸入無效', {}, '資料筆數越界'));
      break;
    }
    case 9: {
      const radii = [0, .00001, .5, 1, 2, 3.25, 999999.999, 1000000];
      if (tier < 3) {
        radii.forEach(r => add(r, stage === 1 ? Math.PI * r * r : `${Math.PI * r * r}\n${2 * Math.PI * r}`, num, '半徑與小數'));
        const calls = radii.map(r => call('circle_area', [r], Math.PI * r * r));
        if (stage >= 2) calls.push(...radii.map(r => call('circle_length', [r], 2 * Math.PI * r)));
        if (tier === 2) {
          [-1e12, -.000001, 1000000.001, 1e12].forEach(r => { add(r, '輸入無效', {}, '半徑越界'); calls.push(call('circle_area', [r], null), call('circle_length', [r], null)); });
          ['nan', 'NaN', 'inf', '-inf', '1e309'].forEach(r => add(r, '輸入無效', {}, '非有限數值'));
        }
        add('0', stage === 1 ? '0' : '0\n0', { ...num, calls }, '函式回傳值與重用');
      } else {
        const dims = dense ? [.00001, .5, 1, 3, 4, 999999.999, 1000000] : [.00001, .5, 3, 1000000];
        for (const w of dims) for (const h of dims) add(`${w}\n${h}`, `${w * h}\n${2 * (w + h)}\n${Math.sqrt(w * w + h * h)}`, num, '兩邊獨立改變');
        const calls = [];
        for (const [w, h] of [[3, 4], [.5, 2], [1000000, 1], [0, 4], [4, 0], [-1, 4], [4, -1], [1000001, 4], [4, 1000001]]) {
          const valid = w > 0 && w <= 1000000 && h > 0 && h <= 1000000;
          calls.push(call('rectangle_area', [w, h], valid ? w * h : null), call('rectangle_length', [w, h], valid ? 2 * (w + h) : null), call('rectangle_diagonal', [w, h], valid ? Math.sqrt(w * w + h * h) : null));
        }
        add('3\n4', '12\n14\n5', { ...num, calls }, '三個函式各自驗證');
        [-1e12, -.000001, 0, 1000000.001, 1e12, 'nan', 'inf', '-inf', '1e309'].forEach(n => { add(`${n}\n4`, '輸入無效', {}, '無效寬度'); add(`4\n${n}`, '輸入無效', {}, '無效高度'); });
      }
      break;
    }
    case 10: {
      if (stage === 1) {
        [[], [[1, 1]], [[2, 1]], [[3, 1]], [[3, 1], [1, 1], [3, 1]], Array(50).fill([2, 1])].forEach(items => {
          const result = shopping(0, items, 1);
          add(result.input.split('\n').slice(1).join('\n'), result.total, {}, '價格與重複購買');
        });
        add('-1', '0', { calls: [call('cart_total', [[]], 0), call('cart_total', [[0, 17, 101]], 118)] }, '加總函式回傳');
        break;
      }
      const carts = [[], [[1, 1]], [[2, 1]], [[3, 1]], [[1, 2], [2, 3]], [[2, 4]], [[1, 2], [3, 2]], [[3, 3]], [[3, 1], [1, 1], [3, 1]]];
      if (tier >= 2) for (const code of [1, 2, 3]) for (const qty of [1, 9, 10]) carts.push([[code, qty]]);
      if (tier === 1) carts.push(Array(50).fill([3, 1]));
      else carts.push(Array(49).fill([1, 1]), Array(50).fill([1, 1]), Array(50).fill([3, 10]));
      if (dense) for (const a of [1, 2, 3]) for (const b of [1, 2, 3]) for (const qty of [1, 2, 10]) carts.push([[a, qty], [b, qty]]);
      carts.forEach(items => {
        const { total } = shopping(0, items, tier);
        for (const balance of [...new Set([0, Math.max(0, total - 1), total, total + 1, 1000000])]) { const result = shopping(balance, items, tier); add(result.input, result.expected, {}, '足額不足與恰好'); }
      });
      const empty = shopping(500, [], tier);
      add(empty.input + '\nabc\n4', empty.expected, {}, '停止後忽略多餘輸入');
      const calls = [call('cart_total', [[]], 0), call('cart_total', [[0, 17, 101]], 118), call('cart_total', [[3800, 120]], 3920)];
      if (tier === 3) calls.push(...[0, 999, 1000, 1001, 1009, 1011, 190000].map(total => call('discount_total', [total], total >= 1000 ? Math.floor(total * 9 / 10) : total)));
      add(empty.input, empty.expected, { calls }, '結帳函式直接回傳');
      if (tier >= 2) {
        [-1e12, -1, 1000001, 1e12].forEach(n => add(n, '輸入無效', {}, '餘額越界'));
        [-1e12, -2, 0, 4, 1e12].forEach(n => add(`500\n${n}`, '輸入無效', {}, '商品編號越界'));
        [-1e12, -1, 0, 11, 1e12].forEach(n => add(`500\n1\n${n}`, '輸入無效', {}, '數量越界'));
        add(shopping(1000000, Array(51).fill([1, 1]), tier).input, '輸入無效', {}, '第51筆無效');
        add('500\n1\n2\n4', '輸入無效', {}, '有效資料後遇到錯誤');
      }
      if (tier === 3) {
        const invalid = ['abc', ' ', '1.5', '1e3', '0x10', 'nan', 'inf', '--1', '一', '🙂'];
        invalid.forEach(text => { add(text, '輸入無效', {}, '餘額無法轉型'); add(`500\n${text}`, '輸入無效', {}, '商品無法轉型'); add(`500\n1\n${text}`, '輸入無效', {}, '數量無法轉型'); });
        ['', '\n', '500', '500\n1', '500\n1\n2', '500\n1\n2\n2', '500\n1\n2\n2\n3'].forEach(text => add(text, '輸入無效', {}, '缺少輸入或停止值'));
        for (const text of [' +1000 \n 1 \n 2 \n -1 ', '１０００\n１\n２\n-１']) add(text, shopping(1000, [[1, 2]], tier).expected, {}, '合法整數寫法');
      }
      break;
    }
  }
  return tests;
}

export function enrichVerification(lessons) {
  for (const lesson of lessons) for (let stage = 1; stage < lesson.activities.length; stage++) {
    const activity = lesson.activities[stage];
    const tests = activity.tests.concat(supplementalTests(lesson.id, stage));
    const requires = [...new Set(tests.flatMap(test => test.requires || []))];
    const nestedFor = tests.some(test => test.nestedFor);
    const seen = new Set();
    activity.tests = tests.filter(test => {
      const key = JSON.stringify([test.input, test.expected, test.probe || '', test.calls || []]);
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).map(test => ({ ...test, ...(requires.length ? { requires } : {}), ...(nestedFor ? { nestedFor } : {}) }));
  }
  // 檢查實際執行的 print 次數及參數，未執行的示意程式不能滿足要求。
  Object.assign(lessons[0].activities[3].tests[0], { printCount: 1, printArgs: 3 });
  Object.assign(lessons[0].activities[4].tests[0], { printCount: 3 });
}
