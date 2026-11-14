(() => {
  'use strict';

  const block = (label, kind, run) => ({ label, kind, run });
  const event = (label, run) => block(label, 'event', run);
  const variable = (label, run) => block(label, 'variable', run);
  const control = (label, run) => block(label, 'control', run);
  const output = (label, run) => block(label, 'output', run);
  const task = (blocks, cases, pass, columns, fields = []) => ({ blocks, cases, pass, columns, fields });
  const example = (name, values) => ({ name, values });
  const field = (key, label, min, max) => ({ key, label, min, max });
  const repeat = (count, action) => { for (let index = 0; index < count; index++) action(index); };
  const shuffle = values => {
    const pool = [...values];
    return values.map(() => pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  };
  const sequence = count => Array.from({ length: count }, (_, index) => index + 1);
  const same = (left, right) => left?.length === right.length && left.every((value, index) => value === right[index]);
  const list = values => values?.join('、') || '空清單';
  const resetTotal = variable('將總和設為 0', state => { state.total = 0; });
  const shape = state => {
    state.points = [[0, 0]];
    state.heading = 0;
  };
  const move = (state, length) => {
    const [x, y] = state.points.at(-1);
    state.points.push([x + length * Math.cos(state.heading), y + length * Math.sin(state.heading)]);
  };
  const turn = (state, angle) => { state.heading += angle * Math.PI / 180; };
  const polygon = (state, edges, angle) => repeat(edges, () => { move(state, 35); turn(state, angle); });
  const closed = points => Boolean(points?.length > 2 && Math.hypot(...points.at(-1)) < 0.001);

  const tasks = {
    '1150701.html': task({
      flag: event('當綠旗被點擊：回到起點', shape),
      move: control('移動 10 點', state => { move(state, 10); state.rows.push([state.points.at(-1)[0]]); }),
      say: output('說出「出發！」', state => { state.text = '出發！'; })
    }, [example('綠旗測試', {})], state => state.rows[0]?.[0] === 10, ['移動後的 x 座標']),

    '1150702.html': task({
      calculate: variable('依序計算兩個數的平均', state => { state.mean = (state.input.a + state.input.b) / 2; }),
      branch: control('如果平均 ≥ 60，記下及格；否則記下未及格', state => {
        if (state.mean !== undefined) state.branch = state.mean >= 60 ? '及格' : '未及格';
      }),
      loop: control('將 1 到 N 逐一加進總和', state => {
        state.total = 0;
        repeat(state.input.n, index => { state.total += index + 1; state.rows.push([index + 1, state.total]); });
      }),
      report: output('顯示平均、判斷結果和累計總和', state => {
        if (state.branch && state.total !== undefined) state.text = `平均 ${state.mean}｜${state.branch}｜1 加到 N ＝ ${state.total}`;
      })
    }, [example('及格', { a: 50, b: 70, n: 3 }), example('未及格', { a: 30, b: 60, n: 5 })],
    state => Boolean(state.text), ['目前加到', '累計總和'],
    [field('a', '第一個數', 0, 100), field('b', '第二個數', 0, 100), field('n', 'N', 1, 20)]),

    '1150703.html': task({
      pen: event('清除舊圖並下筆', shape),
      draw: control('重複「邊數」次：移動 35 點，再右轉', state => {
        polygon(state, state.input.edges, state.input.angle);
        state.text = `走了 ${state.input.edges} 條邊｜圖形${closed(state.points) ? '閉合' : '未閉合'}`;
      }),
      drawOnce: control('只移動 35 點並右轉一次', state => { polygon(state, 1, state.input.angle); })
    }, [example('三角形', { edges: 3, angle: 120 }), example('五邊形', { edges: 5, angle: 72 })],
    state => closed(state.points) && state.points.length === state.input.edges + 1 && state.input.angle * state.input.edges === 360, [],
    [field('edges', '邊數', 3, 12), field('angle', '每次轉角', 0, 360)]),

    '1150704.html': task({
      start: event('清除舊圖，設定初始長度', state => { shape(state); state.length = state.input.start; }),
      update: variable('將長度增加指定點數', state => { state.length += state.input.growth; }),
      draw: control('移動目前長度，右轉 90 度', state => {
        move(state, state.length);
        turn(state, 90);
        state.rows.push([state.rows.length + 1, state.length]);
      })
    }, [example('起始 0、每次加 10', { start: 0, growth: 10 }), example('起始 5、每次加 15', { start: 5, growth: 15 })],
    state => state.rows.length === 8 && state.rows.every(([round, length], index) =>
      length === state.input.start + state.input.growth * (index + (state.rows[0][1] === state.input.start ? 0 : 1))),
    ['輪次', '移動長度'], [field('start', '初始長度', 0, 80), field('growth', '每次增加', 1, 30)]),

    '1150705.html': task({
      pen: event('清除舊圖並下筆', shape),
      draw: control('重複 X 次：呼叫「畫正 N 邊形」，再右轉 360 ÷ X 度', state => {
        repeat(state.input.copies, () => {
          polygon(state, state.input.edges, 360 / state.input.edges);
          turn(state, 360 / state.input.copies);
        });
        state.text = `畫了 ${state.input.copies} 個正 ${state.input.edges} 邊形。`;
      }),
      single: control('只呼叫一次「畫正 N 邊形」', state => { polygon(state, state.input.edges, 360 / state.input.edges); })
    }, [example('三角形曼陀羅', { edges: 3, copies: 12 }), example('五邊形曼陀羅', { edges: 5, copies: 10 })],
    state => state.points?.length === state.input.edges * state.input.copies + 1, [],
    [field('edges', '邊數 N', 3, 12), field('copies', '圖形數 X', 2, 24)]),

    '1150706.html': task({
      configure: event('設定邊數、圖形數與筆跡寬度', state => { shape(state); state.width = state.input.width; }),
      draw: control('呼叫「畫幾個圖形」', state => {
        repeat(state.input.copies, () => {
          polygon(state, state.input.edges, 360 / state.input.edges);
          turn(state, 360 / state.input.copies);
        });
      }),
      report: output('用固定測試點檢查是否擋住，記下消耗量', state => {
        if (!state.points) throw new Error('先畫防禦網。');
        const impact = [0, -20];
        const hit = state.points.slice(1).some(([x, y], index) => {
          const [a, b] = state.points[index];
          const dx = x - a, dy = y - b;
          const t = Math.max(0, Math.min(1, ((impact[0] - a) * dx + (impact[1] - b) * dy) / (dx * dx + dy * dy)));
          return Math.hypot(a + t * dx - impact[0], b + t * dy - impact[1]) <= state.width / 2 + 3;
        });
        state.text = `固定測試點：${hit ? '擋住' : '未擋住'}｜消耗量 ${state.input.copies * state.width}`;
        state.marker = impact;
      })
    }, [example('測試一', { edges: 3, copies: 2, width: 2 }), example('測試二', { edges: 3, copies: 3, width: 4 }),
      example('測試三', { edges: 5, copies: 4, width: 12 })],
    state => Boolean(state.text && state.points?.length === state.input.edges * state.input.copies + 1), [],
    [field('edges', '邊數', 3, 12), field('copies', '圖形數', 1, 24), field('width', '筆跡寬度', 1, 30)]),

    '1150801.html': task({
      start: variable('從清單第 1 項開始', state => { state.index = 0; }),
      compare: control('逐項比對目標，找到就停止搜尋', state => {
        if (state.index === undefined) throw new Error('先設定搜尋的起點。');
        while (state.index < state.input.data.length) {
          const value = state.input.data[state.index++];
          state.rows.push([state.index, value]);
          if (value === state.input.target) { state.found = state.index; break; }
        }
      }),
      report: output('顯示找到的位置，或找不到', state => {
        if (!state.rows.length) throw new Error('先執行逐項比對。');
        state.text = state.found ? `找到，位置是第 ${state.found} 項。` : '全部比完，找不到。';
      })
    }, [example('找到數值 7', { data: [4, 7, 9, 7], target: 7 }), example('找不到數值 8', { data: [4, 7, 9, 7], target: 8 })],
    state => Boolean(state.text) && state.rows.length === (state.found || state.input.data.length), ['索引', '比對的值']),

    '1150802.html': task({
      notes: variable('建立音符清單，將索引設為第 1 項', state => { state.notes = []; }),
      play: control('逐項播放目前音符，索引加 1', state => {
        if (!state.notes) throw new Error('先建立音符清單。');
        [60, 60, state.input.note, 67].forEach((note, index) => {
          state.notes.push(note);
          state.rows.push([index + 1, note]);
        });
        state.text = '已依索引順序讀完音符。';
      }),
      first: control('只播放清單第 1 項', state => { state.notes?.push(60); })
    }, [example('原旋律', { note: 67 }), example('改第 3 個音', { note: 69 })],
    state => same(state.notes, [60, 60, state.input.note, 67]), ['索引', '音符值'], [field('note', '第 3 個音符', 48, 84)]),

    '1150803.html': task({
      reset: resetTotal,
      sum: control('重複清單長度次：將目前項目加進總和', state => {
        if (state.total === undefined) throw new Error('先把總和設為 0。');
        state.input.data.forEach((value, index) => { state.total += value; state.rows.push([index + 1, value, state.total]); });
      }),
      guard: control('如果清單為空：顯示無法算平均，停止程式', state => {
        if (!state.input.data.length) { state.stopped = true; state.text = '沒有資料，無法計算平均。'; }
      }),
      average: output('顯示總和 ÷ 清單長度', state => {
        if (!state.input.data.length) throw new Error('除以 0。請在除法前先判斷空清單。');
        if (state.total === undefined) throw new Error('先算出總和。');
        state.average = state.total / state.input.data.length;
        state.text = `總和 ${state.total}｜平均 ${Number(state.average.toFixed(2))}`;
      })
    }, [example('120、80、150', { data: [120, 80, 150] }), example('只有 80', { data: [80] }), example('空清單', { data: [] })],
    state => state.input.data.length ? state.rows.length === state.input.data.length &&
      state.total === state.input.data.reduce((sum, value) => sum + value, 0) && state.average === state.total / state.input.data.length :
      state.stopped === true, ['項次', '讀到的值', '累計總和']),

    '1150804.html': task({
      setup: variable('建立候選名單 1～30，清空已選清單', state => { state.pool = sequence(30); state.chosen = []; }),
      pick: control('從目前候選清單隨機選一項', state => {
        if (!state.pool?.length) throw new Error('先建立候選清單。');
        state.index = Math.floor(Math.random() * state.pool.length);
      }),
      add: variable('把該項座號加入已選清單', state => {
        if (state.index === undefined) throw new Error('先選一個項次。');
        state.chosen.push(state.pool[state.index]);
      }),
      remove: variable('從候選清單刪除該項', state => {
        if (state.index === undefined) throw new Error('先選一個項次。');
        const before = state.pool.length;
        const [removed] = state.pool.splice(state.index, 1);
        state.rows.push([state.rows.length + 1, removed, `${before} → ${state.pool.length}`, state.chosen.length]);
      })
    }, [example('抽 4 名隊員', {})],
    state => state.pool?.length === 26 && state.chosen?.length === 4 && new Set(state.chosen).size === 4 &&
      state.rows.every((row, index) => row[1] === state.chosen[index] && row[3] === index + 1),
    ['輪次', '抽到的座號', '候選人數', '已選人數']),

    '1150805.html': task({
      copy: variable('把輸入資料放進待排序清單', state => { state.values = [...state.input.data]; }),
      sort: control('逐輪比較相鄰兩項：前項較大才交換', state => {
        if (!state.values) throw new Error('先建立待排序清單。');
        const { values } = state;
        for (let end = values.length - 1; end > 0; end--) {
          for (let index = 0; index < end; index++) {
            const [left, right] = [values[index], values[index + 1]];
            if (left > right) [values[index], values[index + 1]] = [right, left];
            state.rows.push([values.length - end, `${left}、${right}`, left > right ? '交換' : '不交換', list(values)]);
          }
        }
      }),
      report: output('顯示排序後的清單', state => { if (state.values) state.text = list(state.values); })
    }, [example('7、3、5、2', { data: [7, 3, 5, 2] }), example('含重複值', { data: [4, 2, 4, 1, 2] })],
    state => Boolean(state.text) && state.text === list(state.values) && same(state.values, [...state.input.data].sort((a, b) => a - b)),
    ['輪次', '比較', '動作', '清單']),

    '1150806.html': task({
      inventory: variable('自訂積木：建立裝備庫', state => { state.inventory = sequence(state.input.stock); }),
      shuffle: control('自訂積木：洗牌', state => {
        if (!state.inventory) throw new Error('先建立裝備庫。');
        state.deck = shuffle(state.inventory);
      }),
      deal: control('自訂積木：分配裝備，數量不足就停止', state => {
        if (!state.deck) throw new Error('先洗牌再分配。');
        if (state.deck.length < state.input.count * 2) {
          state.text = '裝備不足，停止分配與對決。';
          state.stopped = true;
          return;
        }
        state.team = state.deck.slice(0, state.input.count);
        state.enemy = state.deck.slice(state.input.count, state.input.count * 2);
      }),
      duel: output('自訂積木：逐項對決', state => {
        if (!state.team) throw new Error('先分配裝備。');
        state.team.forEach((value, index) => {
          const opponent = state.enemy[index];
          state.rows.push([index + 1, value, opponent, value > opponent ? '小隊得分' : '對手得分']);
        });
        state.text = `小隊：${list(state.team)}｜對手：${list(state.enemy)}`;
      })
    }, [example('裝備足夠', { stock: 24, count: 6 }), example('裝備不足', { stock: 8, count: 6 }),
      example('剛好分完且不重複', { stock: 12, count: 6 })],
    state => state.input.stock < state.input.count * 2 ? state.stopped === true && !state.rows.length :
      state.rows.length === state.input.count && new Set([...state.team, ...state.enemy]).size === state.input.count * 2,
    ['輪次', '小隊裝備', '對手裝備', '結果'], [field('stock', '庫存數', 1, 24), field('count', '每隊需求', 1, 12)])
  };

  tasks['1150704.html'].loop = { before: ['start'], times: 8 };
  tasks['1150804.html'].loop = { before: ['setup'], times: 4 };
  window.BlockProgramTasks = tasks;
})();
