// 用各課模擬器的範例輸出，示範學生會看到的結果。
(() => {
  'use strict';

  const { escapeHtml: escape } = window.CourseScenarios;
  const text = value => escape(String(value));
  const metric = (label, value) => `<div class="lesson-preview__metric"><span>${text(label)}</span><strong>${text(value)}</strong></div>`;
  const tiles = (label, items, active = [], track = false) => {
    const highlighted = Array.isArray(active) ? active : [active];
    const seen = new Map();
    return `<div class="lesson-preview__sequence"><span>${text(label)}</span><ol${track ? ' data-preview-track' : ''}>${items.map((item, index) => {
      seen.set(item, (seen.get(item) || 0) + 1);
      return `<li${track ? ` data-tile="${text(item)}:${seen.get(item)}"` : ''}${highlighted.includes(index) ? ' class="is-active"' : ''}>${text(item)}</li>`;
    }).join('')}</ol></div>`;
  };
  const table = (columns, rows) => `<table class="lesson-preview__table"><thead><tr>${columns.map(column => `<th scope="col">${text(column)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(value => `<td>${text(value)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const plot = (label, result, from = 1, to = from) => `<div class="lesson-preview__plot" data-draw-from="${from}" data-draw-to="${to}"><span>${text(label)}</span>${window.BlockProgram.graph(result)}</div>`;
  const output = value => `<p class="lesson-preview__output">${text(value)}</p>`;
  const frame = (visual, caption) => ({ visual, caption });

  const previews = {
    '1150701.html': [8, ([run]) => [
      frame(plot('角色移動的路徑', run, 0) + metric('移動前的 x 座標', 0), '點綠旗，讓程式開始。'),
      frame(plot('角色移動的路徑', run, 0, 1) + metric('移動距離', run.rows[0][0]), '移動積木讓角色往右走。'),
      frame(plot('角色移動的路徑', run) + metric('移動後的 x 座標', run.rows[0][0]), '綠旗小程式的結果：角色往右移動 10 點。')
    ]],
    '1150702.html': [10, ([run]) => [
      frame(metric('輸入的兩個成績', `${run.input.a}、${run.input.b}`), '程式先讀入兩個成績。'),
      frame(metric('平均', run.mean) + metric('判斷', run.branch), '算出平均，再判斷有沒有及格。'),
      frame(output(run.text) + table(['目前加到', '累計總和'], run.rows), '最後顯示判斷結果，以及迴圈每一輪算到的總和。')
    ]],
    '1150703.html': [9, ([triangle, pentagon]) => [
      frame(plot('三角形', triangle, 0) + plot('五邊形', pentagon, 0), '先看兩個圖形的起點。'),
      frame(plot('三角形', triangle, 0, 1) + plot('五邊形', pentagon, 0), '先畫完三角形，看看最後一條邊接在哪裡。'),
      frame(plot('三角形', triangle) + plot('五邊形', pentagon, 0, 1), '換成五邊形，邊數和轉角都改了。'),
      frame(plot('三角形', triangle) + plot('五邊形', pentagon), '兩個圖形都要回到起點，線條才算閉合。')
    ]],
    '1150704.html': [10, ([run]) => {
      const lengths = run.rows.map(row => row[1]);
      const firstThree = lengths.slice(0, 3);
      const sum = values => values.reduce((total, value) => total + value, 0);
      const fraction = sum(firstThree) / sum(lengths);
      return [
        frame(plot('螺旋軌跡', run, 0) + metric('每輪增加的長度', run.input.growth), '程式用變數記下這一輪該走多遠。'),
        frame(plot('螺旋軌跡', run, 0, fraction) + tiles('前 3 輪移動長度', firstThree), '每一輪走得更遠。'),
        frame(plot('螺旋軌跡', run, fraction, 1) + tiles('後 5 輪移動長度', lengths.slice(3)), '接著沿同一條路徑畫完，看螺旋如何向外展開。'),
        frame(plot('完成的螺旋', run) + metric('最後一輪長度', lengths.at(-1)), '畫面會留下螺旋和每輪移動長度的紀錄。')
      ];
    }],
    '1150705.html': [10, ([triangle, pentagon]) => [
      frame(plot('三角形組合', triangle, 0) + plot('五邊形組合', pentagon, 0), '先決定小圖形的邊數和要畫幾個。'),
      frame(plot('三角形組合', triangle, 0, 1) + plot('五邊形組合', pentagon, 0), '每畫完一個三角形就轉一個角度，再畫下一個。'),
      frame(plot('三角形組合', triangle) + plot('五邊形組合', pentagon, 0, 1), '改用五邊形，重複畫出另一個組合。'),
      frame(plot('三角形組合', triangle) + plot('五邊形組合', pentagon), '改變參數後，畫面會出現不同的曼陀羅。')
    ]],
    '1150706.html': [12, runs => {
      const [first, , last] = runs;
      return [
        frame(plot('固定測試點', first, 0), '橘紅點是固定的測試位置。每組都用同一位置檢查。'),
        frame(plot('一組防禦網', first, 0, 1) + output(first.text), '試跑時會顯示有沒有擋住，以及這組消耗多少資源。'),
        frame(plot('換一組參數後', last, 0, 1) + output(last.text), '換參數再畫一次，觀察有沒有擋住。'),
        frame(plot('換一組參數後', last) + table(['組別', '測試結果'], runs.map((run, index) => [index + 1, run.text.replace('固定測試點：', '')])),
          '把三組結果放在一起，從擋得住的設定中找出消耗最少的一組。')
      ];
    }],
    '1150801.html': [10, ([run]) => [
      frame(tiles('清單', run.input.data) + metric('要找的數值', run.input.target), '從清單第 1 項開始找。'),
      ...run.rows.map(([index], i) => frame(tiles('清單', run.input.data, index - 1) + metric('要找的數值', run.input.target), `比對第 ${index} 項${i === run.rows.length - 1 ? '，找到了。' : '，還沒找到。'}`)),
      frame(tiles('清單', run.input.data, run.found - 1) + output(run.text), '畫面會標出找到的位置。清單後面的項目不用再比。')
    ]],
    '1150802.html': [9, ([before, after]) => [
      frame(tiles('原本的音符清單', before.notes), '播放時，依序讀取清單裡的音符。'),
      ...before.notes.map((note, index) => frame(tiles('原本的音符清單', before.notes, index), `讀第 ${index + 1} 項：音符值 ${note}。`)),
      frame(tiles('改了第 3 項', after.notes, 2), '這一次只換第 3 個音。'),
      frame(tiles('原本', before.notes, 2) + tiles('改完後', after.notes, 2), '比對音符值就能看出哪一項變了。到實作時，也可以播放聽差別。')
    ]],
    '1150803.html': [10, ([run, , empty]) => [
      frame(tiles('這組資料', run.input.data), '逐筆讀取清單，每讀一筆就更新總和。'),
      ...run.rows.map(([index, value, total], offset) => frame(
        table(['項次', '讀到的值', '累計總和'], run.rows.slice(0, offset + 1)),
        `讀到第 ${index} 項的 ${value}，累計總和變成 ${total}。`)),
      frame(output(run.text) + metric('資料筆數', run.rows.length) + output(empty.text), '有資料時算出平均；空清單會顯示提示。')
    ]],
    '1150804.html': [11, ([run]) => [
      frame(metric('抽取前的候選人數', run.rows[0][2].split(' → ')[0]), '先從候選清單抽一名隊員。'),
      ...run.rows.map(([round, seat, poolAfter]) => frame(tiles('已選名單', run.chosen.slice(0, round), round - 1) +
        metric('候選人數', poolAfter), `第 ${round} 輪抽出 ${seat} 號，從候選清單移除。`)),
      frame(tiles('抽到的四名隊員', run.chosen) + metric('剩餘候選人數', run.pool.length), '結果會留下四個不同的座號，以及候選名單剩下幾人。')
    ]],
    '1150805.html': [12, ([, run]) => {
      let round = 0;
      let position = 0;
      return [
        frame(tiles('目前順序', run.input.data, [], true), '清單裡可以有重複的數字。'),
        ...run.rows.map(([nextRound, pair, action, data]) => {
          if (nextRound !== round) { round = nextRound; position = 0; }
          const active = [position, ++position];
          return frame(tiles('目前順序', data.split('、').map(Number), active, true), `比較 ${pair}，${action}。`);
        }),
        frame(tiles('排序前', run.input.data) + tiles('排序結果', run.values), '最後由小到大排列。原本出現兩次的數字，結果也還是兩次。')
      ];
    }],
    '1150806.html': [12, ([run, short]) => [
      frame(metric('庫存', run.input.stock) + metric('每隊需求', run.input.count), '建立裝備庫、洗牌，再分給兩隊。'),
      frame(tiles('小隊', run.team) + tiles('對手', run.enemy), '兩隊分到的數值沒有重複，接著逐項比大小。'),
      frame(table(['回合', '小隊', '對手', '得分'], run.rows.slice(0, 2)) +
        metric('剩餘件數', run.input.stock - run.team.length - run.enemy.length) + output(short.text),
        '成功時看對決結果和剩餘件數；裝備不足時停止。表格節錄前兩回合。')
    ]]
  };

  function mount(page, host) {
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
          <button type="button" data-preview-finish disabled>直接看結果</button>
        </div>
      </header>
      <figure>
        <div class="lesson-preview__stage" data-preview-stage>${frames.map(({ visual }) =>
          `<div class="lesson-preview__frame" data-preview-frame aria-hidden="true">${visual}</div>`).join('')}</div>
        <div class="lesson-preview__progress" aria-hidden="true"><span data-preview-progress></span></div>
        <figcaption data-preview-caption>${frames.map(({ caption }) =>
          `<span data-preview-line aria-hidden="true">${text(caption)}</span>`).join('')}</figcaption>
      </figure>`;

    const play = root.querySelector('[data-preview-play]');
    const finishButton = root.querySelector('[data-preview-finish]');
    const views = [...root.querySelectorAll('[data-preview-frame]')];
    const lines = [...root.querySelectorAll('[data-preview-line]')];
    const progress = root.querySelector('[data-preview-progress]');
    const last = frames.length - 1;
    const duration = seconds * 1000;
    const boundaries = frames.map((_, index) => {
      if (index === 0) return 0;
      const dense = frames.length > 7;
      const intro = dense ? .10 : .17;
      const action = dense ? .75 : .62;
      return duration * (intro + action * (index - 1) / (last - 1));
    });
    let request = null;
    let active = -1;
    let started;
    let reducedMotion;
    let drawings = [];
    let motions = [];

    function draw(elapsedFraction) {
      for (const { line, tip, length, from, to } of drawings) {
        const fraction = from + (to - from) * elapsedFraction;
        const point = line.getPointAtLength(fraction * length);
        line.style.strokeDashoffset = String(1 - fraction);
        tip.setAttribute('cx', point.x);
        tip.setAttribute('cy', point.y);
      }
    }

    function show(index, playing = false) {
      if (index === active) return;
      motions.forEach(animation => animation.cancel());
      motions = [];
      const previous = views[active];
      const next = views[index];
      const previousTiles = previous?.querySelectorAll('[data-tile]');
      const nextTiles = next.querySelectorAll('[data-tile]');
      const moving = Boolean(playing && !reducedMotion && previousTiles?.length && nextTiles.length);
      const positions = new Map();
      if (moving) previousTiles.forEach(tile => positions.set(tile.dataset.tile, tile.getBoundingClientRect()));
      previous?.toggleAttribute('data-preview-cut', moving);
      next.toggleAttribute('data-preview-cut', moving);
      previous?.setAttribute('aria-hidden', 'true');
      lines[active]?.setAttribute('aria-hidden', 'true');
      next.setAttribute('aria-hidden', 'false');
      lines[index].setAttribute('aria-hidden', 'false');
      active = index;

      drawings = [...next.querySelectorAll('[data-draw-from]')].flatMap(plot => {
        const line = plot.querySelector('polyline');
        const tip = line.nextElementSibling;
        const length = line.getTotalLength();
        const from = Number(plot.dataset.drawFrom);
        const to = Number(plot.dataset.drawTo);
        line.style.strokeDasharray = '1 1';
        line.style.strokeLinecap = 'round';
        // Flush static paths once. Only paths being drawn enter the per-frame loop.
        if (playing && !reducedMotion && from !== to) return [{ line, tip, length, from, to }];
        const point = line.getPointAtLength(to * length);
        line.style.strokeDashoffset = String(1 - to);
        tip.setAttribute('cx', point.x);
        tip.setAttribute('cy', point.y);
        return [];
      });
      draw(0);
      if (!moving) return;
      nextTiles.forEach(tile => {
        const old = positions.get(tile.dataset.tile);
        if (!old || !tile.animate) return;
        const box = tile.getBoundingClientRect();
        const x = old.left - box.left;
        const y = old.top - box.top;
        if (!x && !y) return;
        motions.push(tile.animate([{ transform: `translate(${x}px, ${y}px)` }, { transform: 'translate(0, 0)' }],
          { duration: 420, easing: 'ease-in-out' }));
      });
    }

    function setProgress(fraction) {
      progress.style.transform = `scaleX(${fraction})`;
    }

    function finish() {
      if (request !== null) cancelAnimationFrame(request);
      request = null;
      root.classList.remove('is-playing');
      if (document.activeElement === finishButton) play.focus();
      finishButton.disabled = true;
      play.textContent = `重播範例（${seconds} 秒）`;
      show(last);
      setProgress(1);
    }

    function tick(now) {
      const elapsed = now - started;
      if (elapsed >= duration) { finish(); return; }
      let index = active;
      while (index < last && elapsed >= boundaries[index + 1]) index++;
      if (index !== active) {
        draw(1);
        show(index, true);
      }
      if (drawings.length) {
        const span = boundaries[index + 1] - boundaries[index];
        draw(Math.min(1, Math.max(0, (elapsed - boundaries[index]) / span)));
      }
      setProgress(elapsed / duration);
      request = requestAnimationFrame(tick);
    }

    play.addEventListener('click', () => {
      if (request !== null) cancelAnimationFrame(request);
      reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      root.classList.add('is-playing');
      play.textContent = '從頭播放';
      finishButton.disabled = false;
      show(0, true);
      setProgress(0);
      started = performance.now();
      request = requestAnimationFrame(tick);
    });
    finishButton.addEventListener('click', finish);
    host.append(root);
    show(last);
    return {
      setVisible(visible) {
        if (!visible && request !== null) finish();
        root.hidden = !visible;
      }
    };
  }

  window.LessonPreview = { mount };
})();
