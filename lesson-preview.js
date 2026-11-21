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
  const plot = (label, result, from = 1, to = from, { labels, parameters } = {}) =>
    `<div class="lesson-preview__plot" data-draw-from="${from}" data-draw-to="${to}"><span>${text(label)}</span>${window.BlockProgram.graph(result, labels)}
      ${parameters ? `<p class="lesson-preview__parameters">${text(parameters)}</p>` : ''}</div>`;
  const output = value => `<p class="lesson-preview__output">${text(value)}</p>`;
  const frame = (visual, caption, seconds, chapter) => ({ visual, caption, seconds, chapter });

  function structurePreview([run]) {
    const { a, b, n } = run.input;
    const calculate = [
      ['輸入', `${a}、${b}`], ['相加', `${a} ＋ ${b} ＝ ${a + b}`],
      ['除以 2 並輸出', `平均 ${run.mean}`]
    ];
    const sequence = (active, caption) => frame(
      `<ol class="lesson-preview__flow">${calculate.map(([label, value], i) =>
        `<li${i === active ? ' aria-current="step"' : ''}>${metric(label, i <= active ? value : '…')}</li>`).join('')}</ol>`,
      caption, 2.4, '循序');
    const grades = [[50, 70, 60], [40, 60, 30]];
    const selection = (input, check, caption) => {
      const [homework, test, behavior] = input;
      const score = (homework * 4 + test * 4 + behavior * 2) / 10;
      return frame(
        metric('作業 40％ ＋ 測驗 40％ ＋ 表現 20％',
          `${homework} × 0.4 ＋ ${test} × 0.4 ＋ ${behavior} × 0.2 ＝ ${score}`) +
        `<div class="lesson-preview__decision">
          <strong>學期成績 ≥ 60？</strong><div>
          <span${check && score >= 60 ? ' class="is-taken"' : ''}>是 → 及格</span>
          <span${check && score < 60 ? ' class="is-taken"' : ''}>否 → 不及格</span>
        </div></div>`, caption, 3, '選擇');
    };
    const loop = (count, caption) => frame(
      table(['目前加到', '累計總和'], [[0, 0], ...run.rows.slice(0, count)]) +
      metric(count === n ? '到達 N，停止並輸出' : `還沒到 N ＝ ${n}，繼續`,
        count ? run.rows[count - 1][1] : 0), caption, 2.3, '重複');
    return [
      sequence(0, '循序｜先讀入兩個數。'),
      sequence(1, `循序｜把兩個數加起來，得到 ${a + b}。`),
      sequence(2, `循序｜用剛算出的總和除以 2，輸出平均 ${run.mean}。`),
      selection(grades[0], false, '選擇｜先用三項比重算出學期成績，再拿成績跟 60 比。'),
      selection(grades[0], true, '選擇｜剛好 60 分也符合條件，走「是」，顯示及格。'),
      selection(grades[1], true, '選擇｜換一組輸入得到 46 分，走「否」，顯示不及格。'),
      loop(0, `重複｜總和從 0 開始，目標是從 1 加到 ${n}。`),
      ...run.rows.map(([value, total], i) => loop(i + 1,
        `重複｜加上 ${value}，總和變成 ${total}。${value === n ? '已到達 N，停止。' : '還沒到 N，再做一輪。'}`)),
      frame(metric('循序｜依步驟計算', `平均 ${run.mean}`) +
        metric('選擇｜依條件走一條路', '60 → 及格，46 → 不及格') +
        metric('重複｜做到指定次數', `${run.rows.map(([value]) => value).join(' ＋ ')} ＝ ${run.total}`),
      '循序決定先做什麼，選擇決定走哪條路，重複決定同一件事做到何時。', 3.6)
    ];
  }

  function edgeLabel(points, edge, value, at, distance) {
    const [a, b] = points.slice(edge, edge + 2);
    const center = [0, 1].map(axis => (Math.min(...points.map(p => p[axis])) + Math.max(...points.map(p => p[axis]))) / 2);
    const [x, y] = a.map((coordinate, axis) => (coordinate + b[axis]) / 2);
    const [nx, ny] = [a[1] - b[1], b[0] - a[0]];
    const length = Math.hypot(nx, ny);
    const outward = (x - center[0]) * nx + (y - center[1]) * ny >= 0 ? distance : -distance;
    return { x: x + nx / length * outward, y: y + ny / length * outward, value, at };
  }

  function polygonPreview(label, run, sideLength) {
    const { edges, angle } = run.input;
    const [[x1, y1], [x2, y2]] = run.points;
    const length = Math.hypot(x2 - x1, y2 - y1);
    const scale = sideLength / length;
    const shape = { ...run, points: run.points.map(point => point.map(value => value * scale)) };
    const options = {
      labels: [edgeLabel(shape.points, 0, sideLength, 1 / edges, sideLength * .22)],
      parameters: `走 ${edges} 次 × 轉 ${angle}° ＝ 轉滿 360°`
    };
    return (from, to) => plot(label, shape, from, to, options);
  }

  function mandalaPreview(label, run) {
    const { edges, copies } = run.input;
    return (from, to) => plot(label, run, from, to, {
      parameters: `${edges} 邊畫完一個、轉 ${360 / copies}°，共畫 ${copies} 個`
    });
  }

  const previews = {
    '1150701.html': [8, ([run]) => [
      frame(plot('角色移動的路徑', run, 0) + metric('移動前的 x 座標', 0), '點綠旗，讓程式開始。'),
      frame(plot('角色移動的路徑', run, 0, 1) + metric('移動距離', run.rows[0][0]), '移動積木讓角色往右走。'),
      frame(plot('角色移動的路徑', run) + metric('移動後的 x 座標', run.rows[0][0]),
        '點綠旗後，角色往右移了 10 點。用 x 座標確認移動了多遠。')
    ]],
    '1150702.html': [null, structurePreview],
    '1150703.html': [13, ([, pentagon], task) => {
      const square = window.BlockProgram.execute(task, task.goal, { edges: 4, angle: 90 });
      const drawSquare = polygonPreview('正方形', square, 100);
      const drawPentagon = polygonPreview('五邊形', pentagon, 100);
      return [
        frame(drawSquare(0) + drawPentagon(0), '先決定邊數。每次走 100 步，再轉 360° ÷ 邊數。'),
        frame(drawSquare(0, 1) + drawPentagon(0), '正方形走 4 條邊，每畫完一邊轉 90°。'),
        frame(drawSquare(1) + drawPentagon(0, 1), '五邊形走 5 條邊，每畫完一邊轉 72°。'),
        frame(drawSquare(1) + drawPentagon(1), '每條邊等長，各轉滿 360°，最後一條邊接回起點。')
      ];
    }],
    '1150704.html': [12, ([run]) => {
      const lengths = run.rows.map(row => row[1]);
      let distance = 0;
      const total = lengths.reduce((sum, value) => sum + value, 0);
      const labels = lengths.map((length, index) => {
        distance += length;
        const label = edgeLabel(run.points, index, length, distance / total, 9);
        // Keep the first label above the short starting edge and clear of the second edge.
        if (index === 0) label.y = run.points[0][1] - 9;
        return label;
      });
      const drawSpiral = (from, to) => plot('螺旋路徑', run, from, to, {
        labels, parameters: `每次多走 ${run.input.growth} 步、轉 90°，重複 ${lengths.length} 次`
      });
      return [
        frame(drawSpiral(0), '用變數記住要走幾步，先從 0 開始，每輪加 10 再走。'),
        frame(drawSpiral(0, labels[2].at), '前三段走 10、20、30 步。走完一段就轉 90°。'),
        frame(drawSpiral(labels[2].at, 1), '畫筆繼續往外走，線段加長的規則一樣。'),
        frame(drawSpiral(1), '看線條旁的數字。八段依序從 10 加到 80 步，畫成一個方形螺旋。')
      ];
    }],
    '1150705.html': [13, ([triangle, pentagon]) => {
      const drawTriangles = mandalaPreview('三角形組合', triangle);
      const drawPentagons = mandalaPreview('五邊形組合', pentagon);
      const first = 1 / triangle.input.copies;
      return [
        frame(drawTriangles(0, first) + drawPentagons(0), '先用內層迴圈，畫出完整的一個小三角形。'),
        frame(drawTriangles(first, 1) + drawPentagons(0), '外層迴圈每次轉 30°，再畫一個，直到畫完 12 個三角形。'),
        frame(drawTriangles(1) + drawPentagons(0, 1), '換成五邊形。內層走 5 條邊，外層每次轉 36°，重畫 10 個。'),
        frame(drawTriangles(1) + drawPentagons(1), '內層決定小圖形，外層決定重複幾個和怎麼轉一圈。')
      ];
    }],
    '1150706.html': [16, runs => {
      const [first, , last] = runs;
      const cost = ({ input }) => input.copies * input.width;
      const best = runs.filter(run => run.text.includes('：擋住')).sort((a, b) => cost(a) - cost(b))[0];
      const drawNet = (run, from, to) => plot('防禦網', run, from, to, {
        parameters: `每個圖形 ${run.input.edges} 邊，畫 ${run.input.copies} 個，筆跡寬 ${run.input.width}`
      });
      return [
        frame(drawNet(first, 0), '紅點是固定的測試位置。每組都用同一個位置檢查。'),
        ...runs.map((run, i) => frame(drawNet(run, 0, 1), `第 ${i + 1} 組。看線有沒有擋住紅點。消耗量用「圖形個數 × 筆跡寬度」計算。`)),
        frame(drawNet(last, 1) + table(['組別', '測試結果'], runs.map((run, index) => [index + 1, run.text.replace('固定測試點：', '')])),
          best ? `第 ${runs.indexOf(best) + 1} 組能擋住紅點，在擋得住的組別中消耗最少（${cost(best)}）。` : '這三組都沒擋住紅點。')
      ];
    }],
    '1150801.html': [null, ([found, missing]) => {
      const before = [4, 6];
      const latest = 5;
      const after = [...before, latest];
      const operations = [
        ['起始清單', after, [], '先讀清單。項次從第 1 項開始。'],
        ['添加', [4, 6, 5, 7], [3], '把 7 加到最後，原來的三項都留在原位。'],
        ['插入', [4, 6, 9, 5, 7], [2], '把 9 插在第 3 項，原本在第 3 項的 5 往後移。'],
        ['替換', [4, 7, 9, 5, 7], [1], '把第 2 項的 6 換成 7，項目數不變。'],
        ['刪除', found.input.data, [], '拿掉第 4 項的 5，後面的 7 往前補上。']
      ];
      const compare = (run, index, value) => {
        const last = index === run.rows.length;
        const result = last ? run.text : '接著比下一項';
        return frame(tiles('清單', run.input.data, index - 1) +
          metric(`第 ${index} 項的 ${value} ${value === run.input.target ? '＝' : '≠'} ${run.input.target}`, result),
          last ? run.text : `找 ${run.input.target}，第 ${index} 項是 ${value}，繼續往下找。`, 2, '逐項搜尋');
      };
      return [
        frame(metric('變數「最新點數」', before.at(-1)) + tiles('清單「點數紀錄」', before),
          '已經有 4、6 兩筆。變數記最新的 6，清單按順序保留兩筆。', 3.5, '變數與清單'),
        frame(metric('變數「最新點數」', latest) + tiles('清單「點數紀錄」', after, after.length - 1),
          '又記一筆 5。變數的 6 被換成 5；清單在末端多一筆，第 2 項還是 6。', 4, '變數與清單'),
        ...operations.map(([label, data, active, caption]) => frame(tiles(label, data, active), caption, 2.4, '清單操作')),
        ...[found, missing].flatMap(run => run.rows.map(([index, value]) => compare(run, index, value))),
        frame(tiles('整理後的清單', found.input.data) + metric('找 7', found.text) + metric('找 8', missing.text),
          '找到第一筆符合的資料就停；走到最後仍沒找到，才顯示找不到。', 3.5)
      ];
    }],
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
      frame(output(run.text) + metric('用總和除以筆數', `${run.total} ÷ ${run.rows.length}`) + output(empty.text),
        '有資料時，用總和除以筆數。清單是空的，就顯示提示並停止計算。')
    ]],
    '1150804.html': [11, ([run]) => [
      frame(metric('抽取前的候選人數', run.rows[0][2].split(' → ')[0]), '先從候選清單抽一名隊員。'),
      ...run.rows.map(([round, seat, poolAfter]) => frame(tiles('已選名單', run.chosen.slice(0, round), round - 1) +
        metric('候選人數', poolAfter), `第 ${round} 輪抽出 ${seat} 號，從候選清單移除。`)),
      frame(tiles('抽到的四名隊員', run.chosen) + metric('剩餘候選人數', run.pool.length), '結果會留下四個不同的座號，以及候選名單剩下幾人。')
    ]],
    '1150805.html': [null, ([, run]) => {
      const deck = [...run.values];
      const shuffled = [];
      let round = 0;
      let position = 0;
      return [
        frame(tiles('原牌堆', deck) + tiles('洗好區', ['空清單']), '洗牌從原牌堆抽牌。每抽一張，就從原牌堆拿掉那一張。', 2.5, '洗牌'),
        ...run.input.data.map(value => {
          shuffled.push(...deck.splice(deck.indexOf(value), 1));
          return frame(tiles('原牌堆', deck.length ? deck : ['空清單']) + tiles('洗好區', shuffled, shuffled.length - 1),
            `抽到 ${value}，移到洗好區。原牌堆剩 ${deck.length} 張。`, 1.8, '洗牌');
        }),
        frame(tiles('目前順序', run.input.data, [], true), '洗好後，換成從左往右比相鄰的兩張牌。', 2.5, '相鄰比較'),
        ...run.rows.map(([nextRound, pair, action, data]) => {
          if (nextRound !== round) { round = nextRound; position = 0; }
          const active = [position, ++position];
          return frame(tiles(`第 ${round} 輪`, data.split('、').map(Number), active, true),
            `比較 ${pair}，${action}。`, 1.25, '相鄰比較');
        }),
        frame(tiles('洗牌前', run.values) + tiles('洗完牌', run.input.data) + tiles('由小到大排列', run.values),
          '洗牌、排序都只改順序。兩個 2、兩個 4 都留在結果裡。', 3.5)
      ];
    }],
    '1150806.html': [null, ([run, short]) => {
      const need = run.input.count * 2;
      const teamWins = run.rows.filter(row => row[3] === '小隊得分').length;
      return [
        frame(metric('倉庫有', `${run.input.stock} 件`) + metric('兩隊需要', `${run.input.count} × 2 ＝ ${need} 件`),
          '先算裝備夠不夠。夠用的話，就把裝備庫洗牌。', 2.8),
        frame(tiles('小隊', run.team) + tiles('對手', run.enemy), '從同一個牌堆分給兩隊，每件裝備只會分到一隊。', 3),
        ...run.rows.map(([round, team, enemy, point], i) => frame(
          tiles('小隊', run.team, i) + tiles('對手', run.enemy, i) + metric(`第 ${round} 回合｜${team} 對 ${enemy}`, point),
          `兩隊都拿自己清單的第 ${round} 項來比。這一回合${point}。`, 1.6)),
        frame(metric('這組庫存', `${short.input.stock} 件`) + metric('兩隊需要', `${short.input.count * 2} 件`) + output(short.text),
          '庫存不足時就停在這裡，分配和對決都不會執行。', 3),
        frame(table(['回合', '小隊', '對手', '得分'], run.rows) +
          metric('對決結果', `小隊 ${teamWins} 分、對手 ${run.rows.length - teamWins} 分`) +
          metric('未分配的裝備', `${run.input.stock - need} 件`),
          '分配成功時，畫面會留下每回合的得分和庫存剩幾件。', 4)
      ];
    }]
  };

  function mount(page, host) {
    const task = window.BlockProgramTasks?.[page];
    const config = previews[page];
    if (!task || !config || !window.BlockProgram) return null;
    const [standardSeconds, storyboard] = config;
    const runs = task.cases.map(({ values }) => window.BlockProgram.execute(task, task.goal, values));
    if (runs.some(run => run.error || !run.passed)) return null;
    const frames = storyboard(runs, task);
    const chapters = [...new Set(frames.map(({ chapter }) => chapter).filter(Boolean))];
    let total = 0;
    const boundaries = frames.map((frame, index) => {
      if (!standardSeconds) {
        const start = total;
        total += frame.seconds;
        return start * 1000;
      }
      if (index === 0) return 0;
      const dense = frames.length > 7;
      const intro = dense ? .10 : .17;
      const action = dense ? .75 : .62;
      return standardSeconds * 1000 * (intro + action * (index - 1) / (frames.length - 2));
    });
    const seconds = standardSeconds || Math.round(total);
    const duration = (standardSeconds || total) * 1000;
    const root = document.createElement('section');
    root.className = 'lesson-preview';
    root.setAttribute('aria-labelledby', 'lesson-preview-title');
    root.innerHTML = `
      <header class="lesson-preview__header">
        <h2 id="lesson-preview-title">先看程式怎麼做</h2>
        <div class="lesson-preview__controls">
          <button type="button" data-preview-play>播放範例（${seconds} 秒）</button>
          <button type="button" data-preview-finish disabled>直接看結果</button>
        </div>
      </header>
      ${chapters.length ? `<div class="lesson-preview__chapters" role="group" aria-label="示範段落">${chapters.map(chapter =>
        `<button type="button" data-preview-chapter="${text(chapter)}" aria-label="從${text(chapter)}開始播放">${text(chapter)}</button>`).join('')}</div>` : ''}
      <figure>
        <div class="lesson-preview__stage" data-preview-stage>${frames.map(({ visual }) =>
          `<div class="lesson-preview__frame" data-preview-frame aria-hidden="true">${visual}</div>`).join('')}</div>
        <div class="lesson-preview__progress" aria-hidden="true"><span data-preview-progress></span></div>
        <figcaption data-preview-caption>${frames.map(({ caption }) =>
          `<span data-preview-line aria-hidden="true">${text(caption)}</span>`).join('')}</figcaption>
      </figure>`;

    const play = root.querySelector('[data-preview-play]');
    const finishButton = root.querySelector('[data-preview-finish]');
    const chapterButtons = [...root.querySelectorAll('[data-preview-chapter]')];
    const views = [...root.querySelectorAll('[data-preview-frame]')];
    const lines = [...root.querySelectorAll('[data-preview-line]')];
    const progress = root.querySelector('[data-preview-progress]');
    const last = frames.length - 1;
    let request = null;
    let active = -1;
    let started;
    let reducedMotion;
    let drawings = [];
    let motions = [];

    function drawPath({ line, tip, length, labels }, fraction) {
      const point = line.getPointAtLength(fraction * length);
      line.style.strokeDashoffset = String(1 - fraction);
      tip.setAttribute('cx', point.x);
      tip.setAttribute('cy', point.y);
      labels.forEach(([label, at]) => label.classList.toggle('is-drawn', fraction + 1e-8 >= at));
    }

    function draw(elapsedFraction) {
      for (const path of drawings) drawPath(path, path.from + (path.to - path.from) * elapsedFraction);
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
      chapterButtons.forEach(button => {
        if (frames[index].chapter === button.dataset.previewChapter) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });

      drawings = [...next.querySelectorAll('[data-draw-from]')].flatMap(plot => {
        const line = plot.querySelector('polyline');
        const tip = line.nextElementSibling;
        const length = line.getTotalLength();
        // Draw the stroke and move the pen in the same SVG units, at every viewport size.
        if (line.hasAttribute('vector-effect')) {
          const { width, height } = line.ownerSVGElement.viewBox.baseVal;
          line.removeAttribute('vector-effect');
          line.setAttribute('stroke-width', Math.max(width, height) / 80);
        }
        const from = Number(plot.dataset.drawFrom);
        const to = Number(plot.dataset.drawTo);
        const labels = [...plot.querySelectorAll('[data-draw-label]')].map(label => [label, Number(label.dataset.drawLabel)]);
        const path = { line, tip, length, from, to, labels };
        line.style.strokeDasharray = '1 1';
        line.style.strokeLinecap = 'round';
        // Flush static paths once. Only paths being drawn enter the per-frame loop.
        if (playing && !reducedMotion && from !== to) return [path];
        drawPath(path, to);
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

    function startPlayback(index) {
      if (request !== null) cancelAnimationFrame(request);
      reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      root.classList.add('is-playing');
      play.textContent = '從頭播放';
      finishButton.disabled = false;
      show(index, true);
      draw(0);
      setProgress(boundaries[index] / duration);
      started = performance.now() - boundaries[index];
      request = requestAnimationFrame(tick);
    }

    play.addEventListener('click', () => startPlayback(0));
    chapterButtons.forEach(button => button.addEventListener('click', () => {
      startPlayback(frames.findIndex(frame => frame.chapter === button.dataset.previewChapter));
    }));
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
