const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const driver = `import sys,json,importlib.util,time
s=importlib.util.spec_from_file_location('runner','pythonlab/runner.py')
r=importlib.util.module_from_spec(s);s.loader.exec_module(r)
results=[]
for item in json.load(sys.stdin):
    result=json.loads(r._lab_dispatch(json.dumps({'action':'check',**item})))
    failed=[v for v in result['results'] if not v['passed']]
    results.append({'passed':not failed,'count':len(result['results']),'failed':failed[:2]})
print(json.dumps(results,ensure_ascii=False))
`;
function check(requests) {
  return JSON.parse(execFileSync('python', ['-X', 'utf8', '-c', driver], { cwd: root, input: JSON.stringify(requests), encoding: 'utf8', timeout: 20000, maxBuffer: 8 * 1024 * 1024 }));
}
function rng(seed) { let value = seed >>> 0; return () => ((value = (Math.imul(value, 1664525) + 1013904223) >>> 0) / 4294967296); }
(async () => {
  const { lessons } = await import(pathToFileURL(path.join(root, 'pythonlab/course-data.js')));
  const { supplementalTests } = await import(pathToFileURL(path.join(root, 'pythonlab/verification-data.js')));
  const { verificationTests } = await import(pathToFileURL(path.join(root, 'pythonlab/challenge-data.js')));
  const requests = [];
  let fixed = 0;
  for (const lesson of lessons) for (let stage = 1; stage < 5; stage++) {
    const activity = lesson.activities[stage];
    fixed += activity.tests.length;
    for (const test of activity.tests) {
      assert.equal(typeof test.input, 'string'); assert.equal(typeof test.expected, 'string');
      assert.ok(test.name);
      assert.ok(test.input.length < 20000 && test.expected.length < 20000);
    }
    requests.push({ code: activity.solution, tests: supplementalTests(lesson.id, stage, true), label: `${lesson.id}/${stage}: dense domains` });
    if (stage >= 3 && lesson.id !== 1) for (let seed = 0; seed < 64; seed++) {
      requests.push({ code: activity.solution, tests: verificationTests(lesson, activity, rng(seed)).slice(activity.tests.length), label: `${lesson.id}/${stage}: generated seed ${seed}` });
    }
  }
  let total = 0;
  check(requests).forEach((result, i) => { total += result.count; assert.equal(result.passed, true, `${requests[i].label}: ${JSON.stringify(result.failed)}`); });

  const mutations = [];
  function mutate(id, stage, oldText, newText, label) {
    const activity = lessons[id - 1].activities[stage];
    assert.ok(activity.solution.includes(oldText), `${id}/${stage}: mutation target missing ${oldText}`);
    const code = activity.solution.replace(oldText, newText);
    // 錯誤的上限檢查可能造成巨量迴圈；本機反例用較小的越界值，瀏覽器另測停止與逾時。
    const tests = activity.tests.filter(test => ![5, 6].includes(id) || !test.input.split('\n').some(line => Math.abs(Number(line)) > 20000));
    mutations.push({ code, tests, label: `${id}/${stage}: ${label}` });
  }
  [
    [1, 1, '你好，Python！', '你好，Python!', '全半形格式'],
    [1, 2, '我會修改', '我會觀察', '輸出內容重複'],
    [1, 3, 'sep=" | "', 'sep="/"', '分隔符號錯誤'],
    [1, 4, 'end=" / "', 'end="\\n"', '換行錯誤'],
    [2, 1, 'name = input()', 'name = "小安"', '寫死姓名'],
    [2, 2, 'name = input()', 'name = "小安"', '第二筆未讀取'],
    [2, 3, 'print("姓名：", name', 'print("姓名：", class_name', '混用兩筆資料'],
    [2, 4, 'print("工作：", role', 'print("工作：", name', '第三筆未運用'],
    [3, 1, 'a + b + c', 'a + b - c', '漏加第三筆'],
    [3, 2, '/ 2', '// 2', '平均誤用整除'],
    [3, 3, '(a * 2 + b)', '(a + b * 2)', '權重倒置'],
    [3, 4, '(seconds % 3600)', '(seconds % 60)', '分鐘換算錯誤'],
    [4, 1, '% 2', '% 3', '奇偶條件錯誤'],
    [4, 2, ' or ', ' and ', '維護條件混用且或'],
    [4, 3, 'pressure < 35', 'pressure <= 35', '胎壓門檻等號'],
    [4, 4, 'score >= 90', 'score > 90', '優良門檻等號'],
    [5, 1, 'range(1, 101)', 'range(1, 100)', '漏掉100'],
    [5, 2, 'n + 1', 'n', '漏掉上限'],
    [5, 3, 'i % 2 == 0', 'i % 2 != 0', '加總奇數'],
    [5, 4, 'end + 1', 'end', '區間漏掉終點'],
    [6, 1, 'n * j', 'n + j', '乘法誤寫加法'],
    [6, 2, 'range(1, 10)', 'range(1, 9)', '乘法表漏項'],
    [6, 3, 'range(1, columns + 1)', 'range(1, rows + 1)', '列欄未分開'],
    [6, 4, ' or ', ' and ', '空心框邊界'],
    [7, 1, 'number * number', 'number', '平方未計算'],
    [7, 2, 'total += number', 'total = number', '累加器被覆寫'],
    [7, 3, '0 <= number', '0 < number', '漏掉有效零值'],
    [7, 4, 'number > largest', 'number < largest', '最大值方向錯誤'],
    [8, 1, 'scores.append(score)', 'scores.append(0)', '收集固定值'],
    [8, 2, 'total / len(scores)', 'total', '總分當平均'],
    [8, 3, 'score >= 60', 'score > 60', '及格門檻等號'],
    [8, 4, 'value not in unique', 'value in unique', '去重判斷反向'],
    [9, 1, 'return math.pi * radius ** 2', 'return radius', '回傳公式錯誤'],
    [9, 2, 'return 2 * math.pi * radius', 'return str(2 * math.pi * radius)', '數值回傳成字串'],
    [9, 3, 'return None\n\nradius', 'return "None"\n\nradius', '周長回傳假None'],
    [9, 4, 'return 2 * (w + h)', 'return str(2 * (w + h))', '長方形回傳型態'],
    [10, 1, 'total += price', 'total += 100', '每件商品固定價格'],
    [10, 2, 'balance >= total', 'balance > total', '恰好足額誤判'],
    [10, 3, 'code < 1', 'code < 0', '商品零被當負索引'],
    [10, 4, 'total >= 1000', 'total > 1000', '折扣門檻等號'],
    [4, 3, 'pressure > 100', 'pressure > 1000', '胎壓上限缺口'],
    [4, 3, 'tread > 20', 'tread > 200', '胎痕上限缺口'],
    [4, 3, 'tread < 0', 'tread < -1', '胎痕下限缺口'],
    [5, 3, 'n < 1', 'n < 0', '累加下限缺口'],
    [5, 3, 'n > 10000', 'n > 10001', '累加上限缺口'],
    [5, 4, 'start > end', 'start > end + 1', '逆向區間缺口'],
    [6, 3, 'rows > 12', 'rows > 120', '列數上限缺口'],
    [6, 3, 'columns < 1', 'columns < 0', '欄數下限缺口'],
    [8, 3, 'score > 100', 'score > 101', '分數上限缺口'],
    [8, 4, 'value < -1000', 'value < -1001', '去重資料下限缺口'],
    [8, 4, 'value > 1000', 'value > 1001', '去重資料上限缺口'],
    [9, 3, '0 <= radius', '0 < radius', '圓形零半徑缺口'],
    [9, 4, '0 < w', '0 <= w', '長方形零寬度缺口'],
    [10, 3, 'quantity > 10', 'quantity > 11', '數量上限缺口'],
    [10, 4, 'len(cart) >= 50', 'len(cart) > 50', '第51筆被接受'],
    [10, 4, 'ValueError, EOFError', 'ValueError', '未處理缺少輸入'],
    [10, 4, 'total * 9 // 10', 'total * 9 / 10', '折扣未捨去'],
    [11, 1, 'reverse=True', 'reverse=False', '由高到低的方向錯誤'],
    [11, 2, 'sorted(values)', 'values', '未排序資料'],
    [11, 3, '[:3]', '[:2]', '前三筆少取一筆'],
    [11, 3, 'score > 100', 'score > 101', '滿分上限缺口'],
    [11, 3, 'n > 100', 'n > 101', '筆數上限缺口'],
    [11, 4, 'result = values[:]', 'result = values', '排序改到原清單'],
    [11, 4, 'result[index] < result[smallest]', 'result[index] > result[smallest]', '選擇排序方向相反'],
    [11, 4, 'ValueError, EOFError', 'ValueError', '排序缺少輸入未捕捉'],
    [12, 1, 'prices[choice]', '30', '價格查找寫死'],
    [12, 2, 'counts[choice] += 1', 'counts[choice] = 1', '重複票未累加'],
    [12, 3, 'invalid += 1', 'invalid += 0', '無效票未統計'],
    [12, 3, 'n > 100', 'n > 101', '計票筆數上限缺口'],
    [12, 4, 'input().strip()', 'input()', '未整理投票空白'],
    [12, 4, 'largest > 0', 'largest >= 0', '零票也公告當選'],
    [12, 4, 'return winners', 'return winners[:1]', '平手只保留第一個'],
    [12, 4, 'ValueError, EOFError', 'ValueError', '未完整讀票就輸出'],
  ].forEach(args => mutate(...args));
  check(mutations).forEach((result, i) => assert.equal(result.passed, false, `未抓到錯誤：${mutations[i].label}`));

  const engine = [];
  const addEngine = (code, test, pass, label) => engine.push({ code, tests: [test], pass, label });
  const plain = { name: '輸出格式', input: '', expected: '正確' };
  addEngine('print("正確")', plain, true, '最後換行');
  addEngine('print("正確", end="")', plain, true, '可省略最後換行');
  for (const value of [' 正確', '正確 ', '\n正確', '正確\n']) addEngine(`print(${JSON.stringify(value)})`, plain, false, '多餘空格或空行');
  addEngine('print("正確\\r\\n", end="")', plain, true, 'Windows換行');
  for (const value of ['nan', 'inf', '-inf']) addEngine(`print(float("${value}"))`, { ...plain, expected: '1', numeric: true }, false, '非有限輸出');
  addEngine('print(0)', { ...plain, expected: '0.0000000001', numeric: true }, false, '小值不能誤當零');
  addEngine('print(3.1415926535)', { ...plain, expected: String(Math.PI), numeric: true }, true, '合理浮點誤差');
  addEngine('print(3.14)', { ...plain, expected: String(Math.PI), numeric: true }, false, '過度捨入');
  addEngine('print(1)\nprint()', { ...plain, expected: '1', numeric: true }, false, '數值多一空行');
  for (const [body, expected, passed] of [['return None', null, true], ['return "None"', null, false], ['return False', 0, false], ['return "5"', 5, false], ['return 5.0', 5, true]]) addEngine(`def tool():\n    ${body}`, { ...plain, expected: '', calls: [{ function: 'tool', args: [], expected }] }, passed, '函式真實回傳型態');
  addEngine('print("我會觀察 | 我會修改 | 我會驗證")\nif False:\n    print("a", "b", "c", sep=" | ")', lessons[0].activities[3].tests[0], false, '未執行的sep');
  addEngine('print("我會觀察 | 我會修改 | 我會驗證", sep=" | ")', lessons[0].activities[3].tests[0], false, '實際文字參數數量');
  addEngine('for i in range(200):\n    print("", end="")', { ...plain, expected: '', printCount: 200 }, true, 'print計數不限制保留的紀錄數');
  addEngine('values = list()\nfor i in range(2):\n    values.append(i)\nprint(values)', { ...plain, expected: '[0, 1]', requires: ['For', 'List'] }, true, '接受list()替代方括號');
  addEngine('values = [i for i in range(2)]\nprint(values)', { ...plain, expected: '[0, 1]', requires: ['List'] }, true, '接受清單生成式');
  addEngine('counts = dict(蘋果=1)\nprint(counts["蘋果"])', { ...plain, expected: '1', requires: ['Dict'] }, true, '接受dict()替代大括號');
  addEngine('counts = {name: 0 for name in ["蘋果"]}\nprint(counts["蘋果"])', { ...plain, expected: '0', requires: ['Dict'] }, true, '接受字典生成式');
  addEngine('print("正確")\nraise SystemExit()', plain, false, '有錯誤不能通過');
  check(engine).forEach((result, i) => assert.equal(result.passed, engine[i].pass, `${engine[i].label}: ${JSON.stringify(result.failed)}`));
  console.log(`Verification coverage: ${fixed} fixed cases; ${total} dense/generated cases across 64 seeds; ${mutations.length} faulty solutions rejected; ${engine.length} format, type and runtime regressions passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
