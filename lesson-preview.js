// 用各課模擬器的範例輸出，示範學生會看到的結果。
(() => {
  'use strict';

  const { escapeHtml: escape } = window.CourseScenarios;
  const text = value => escape(String(value));
  const metric = (label, value) => `<div class="lesson-preview__metric"><span>${text(label)}</span><strong>${text(value)}</strong></div>`;
  const tiles = (label, items, active = -1) => `<div class="lesson-preview__sequence"><span>${text(label)}</span><ol>${items.map((item, index) =>
    `<li${index === active ? ' class="is-active"' : ''}>${text(item)}</li>`).join('')}</ol></div>`;
  const table = (columns, rows) => `<table class="lesson-preview__table"><thead><tr>${columns.map(column => `<th scope="col">${text(column)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(value => `<td>${text(value)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const plot = (label, result) => `<div class="lesson-preview__plot"><span>${text(label)}</span>${window.BlockProgram.graph(result)}</div>`;
  const output = value => `<p class="lesson-preview__output">${text(value)}</p>`;
  const frame = (visual, caption) => ({ visual, caption });

  const previews = {
    '1150701.html': [8, ([run]) => [
      frame(metric('移動前的 x 座標', 0), '點綠旗，讓程式開始。'),
      frame(plot('角色移動的路徑', run), '移動積木讓角色往右走。'),
      frame(plot('角色移動的路徑', run) + metric('移動後的 x 座標', run.rows[0][0]), '綠旗小程式的結果：角色往右移動 10 點。')
    ]],
    '1150702.html': [10, ([run]) => [
      frame(metric('輸入的兩個成績', `${run.input.a}、${run.input.b}`), '程式先讀入兩個成績。'),
      frame(metric('平均', run.mean) + metric('判斷', run.branch), '算出平均，再判斷有沒有及格。'),
      frame(output(run.text) + table(['目前加到', '累計總和'], run.rows), '最後顯示判斷結果，以及迴圈每一輪算到的總和。')
    ]],
    '1150703.html': [9, ([triangle, pentagon]) => [
      frame(plot('三角形起點', { points: triangle.points.slice(0, 1) }), '從同一個起點出發，先畫三角形。'),
      frame(plot('三角形', triangle), triangle.text + '。'),
      frame(plot('三角形', triangle) + plot('五邊形', pentagon), '兩個圖形都要回到起點，線條才算閉合。')
    ]],
    '1150704.html': [10, ([run]) => [
      frame(metric('起始長度', run.input.start) + metric('每輪增加', run.input.growth), '程式用變數記下這一輪該走多遠。'),
      frame(plot('前 3 輪', { points: run.points.slice(0, 4) }) + tiles('前 3 輪移動長度', run.rows.slice(0, 3).map(row => row[1])), '每一輪走得更遠。'),
      frame(plot('完成的螺旋', run) + metric('最後一輪長度', run.rows.at(-1)[1]), '畫面會留下螺旋和每輪移動長度的紀錄。')
    ]],
    '1150705.html': [10, ([triangle, pentagon]) => [
      frame(metric('每個小圖形的邊數', triangle.input.edges) + metric('要畫幾個', triangle.input.copies), '先決定小圖形的邊數和要畫幾個。'),
      frame(plot('用三角形畫成的曼陀羅', triangle), triangle.text),
      frame(plot('三角形組合', triangle) + plot('五邊形組合', pentagon), '改變參數後，畫面會出現不同的曼陀羅。')
    ]],
    '1150706.html': [12, runs => {
      const [first, , last] = runs;
      return [
        frame(plot('固定測試點', { points: first.points.slice(0, 1), marker: first.marker }), '橘紅點是固定的測試位置。每組都用同一位置檢查。'),
        frame(plot('一組防禦網', first) + output(first.text), '試跑時會顯示有沒有擋住，以及這組消耗多少資源。'),
        frame(plot('換一組參數後', last) + table(['組別', '測試結果'], runs.map((run, index) => [index + 1, run.text.replace('固定測試點：', '')])),
          '把三組結果放在一起，從擋得住的設定中找出消耗最少的一組。')
      ];
    }],
    '1150801.html': [10, ([run]) => [
      frame(tiles('清單', run.input.data) + metric('要找的數值', run.input.target), '從清單第 1 項開始找。'),
      ...run.rows.map(([index], i) => frame(tiles('清單', run.input.data, index - 1), `比對第 ${index} 項${i === run.rows.length - 1 ? '，找到了。' : '，還沒找到。'}`)),
      frame(tiles('清單', run.input.data, run.found - 1) + output(run.text), '畫面會標出找到的位置。清單後面的項目不用再比。')
    ]],
    '1150802.html': [9, ([before, after]) => [
      frame(tiles('原本的音符清單', before.notes), '播放時，依序讀取清單裡的音符。'),
      frame(tiles('改了第 3 項', after.notes, 2), '這一次只換第 3 個音。'),
      frame(tiles('原本', before.notes, 2) + tiles('改完後', after.notes, 2), '比對音符值就能看出哪一項變了。到實作時，也可以播放聽差別。')
    ]],
    '1150803.html': [10, ([run, , empty]) => [
      frame(tiles('這組資料', run.input.data), '逐筆讀取清單，每讀一筆就更新總和。'),
      frame(table(['項次', '讀到的值', '累計總和'], run.rows), '表格留下每一輪的累計值。'),
      frame(output(run.text) + metric('資料筆數', run.rows.length) + output(empty.text), '有資料時算出平均；空清單會顯示提示。')
    ]],
    '1150804.html': [11, ([run]) => [
      frame(metric('抽取前的候選人數', run.rows[0][2].split(' → ')[0]), '先從候選清單抽一名隊員。'),
      frame(tiles('抽到的第一名隊員', run.chosen.slice(0, 1)) + metric('候選人數', run.rows[0][2]), '把抽到的座號移出候選清單，再抽下一輪。'),
      frame(tiles('抽到的四名隊員', run.chosen) + metric('剩餘候選人數', run.pool.length), '結果會留下四個不同的座號，以及候選名單剩下幾人。')
    ]],
    '1150805.html': [12, ([, run]) => [
      frame(tiles('待排序清單', run.input.data), '清單裡可以有重複的數字。'),
      frame(tiles('比較第一對數字後', run.rows[0][3].split('、'), 1) + metric('比較結果', run.rows[0][2]), '比較相鄰兩項，左邊比較大才交換。'),
      frame(tiles('排序前', run.input.data) + tiles('排序結果', run.values), '最後由小到大排列。原本出現兩次的數字，結果也還是兩次。')
    ]],
    '1150806.html': [12, ([run, short]) => [
      frame(metric('庫存', run.input.stock) + metric('每隊需求', run.input.count), '建立裝備庫、洗牌，再分給兩隊。'),
      frame(tiles('小隊', run.team) + tiles('對手', run.enemy), '兩隊分到的數值沒有重複，接著逐項比大小。'),
      frame(table(['回合', '小隊', '對手', '得分'], run.rows.slice(0, 2)) +
        metric('剩餘件數', run.input.stock - run.team.length - run.enemy.length) + output(short.text),
        '成功時看對決結果和剩餘件數；裝備不足時停止。表格節錄前兩回合。')
    ]]
  };

  function mount(page) {
    const task = window.BlockProgramTasks?.[page];
    const config = previews[page];
    if (!task || !config || !window.BlockProgram) return null;
    const [seconds, storyboard] = config;
    const runs = task.cases.map(({ values }) => window.BlockProgram.execute(task, task.goal, values));
    if (runs.some(run => run.error || !run.passed)) return null;
    const frames = storyboard(runs);
    const root = document.createElement('section');
    root.className = 'lesson-preview';
    root.setAttribute('aria-labelledby', 'lesson-preview-title');
    root.innerHTML = `
      <header class="lesson-preview__header">
        <h2 id="lesson-preview-title">先看成果範例</h2>
        <div class="lesson-preview__controls">
          <button type="button" data-preview-play>播放範例（${seconds} 秒）</button>
          <button type="button" data-preview-finish hidden>直接看結果</button>
        </div>
      </header>
      <figure>
        <div class="lesson-preview__stage" data-preview-stage>${frames.map(({ visual }) =>
          `<div class="lesson-preview__frame" data-preview-frame aria-hidden="true">${visual}</div>`).join('')}</div>
        <figcaption data-preview-caption></figcaption>
      </figure>`;

    const play = root.querySelector('[data-preview-play]');
    const finishButton = root.querySelector('[data-preview-finish]');
    const views = [...root.querySelectorAll('[data-preview-frame]')];
    const caption = root.querySelector('[data-preview-caption]');
    const last = frames.length - 1;
    let timer;
    let visibleFrame;

    function show(index) {
      visibleFrame?.setAttribute('aria-hidden', 'true');
      visibleFrame = views[index];
      visibleFrame.setAttribute('aria-hidden', 'false');
      caption.textContent = frames[index].caption;
    }

    function finish() {
      clearTimeout(timer);
      timer = undefined;
      root.classList.remove('is-playing');
      finishButton.hidden = true;
      play.textContent = `重播範例（${seconds} 秒）`;
      show(last);
    }

    function advance(index) {
      show(index);
      timer = setTimeout(() => index < last ? advance(index + 1) : finish(),
        seconds * (index < last ? 680 / last : 320));
    }

    play.addEventListener('click', () => {
      clearTimeout(timer);
      root.classList.add('is-playing');
      play.textContent = '從頭播放';
      finishButton.hidden = false;
      advance(0);
    });
    finishButton.addEventListener('click', () => { finish(); play.focus(); });
    show(last);
    return {
      element: root,
      setVisible(visible) {
        root.hidden = !visible;
        if (!visible && timer !== undefined) finish();
      }
    };
  }

  window.LessonPreview = { mount };
})();
