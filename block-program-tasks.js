(() => {
  'use strict';

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
  const resetTotal = state => { state.total = 0; };
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
      flag: shape,
      move: state => { move(state, 10); state.rows.push([state.points.at(-1)[0]]); },
      say: state => { state.text = '出發！'; }
    }, [example('綠旗測試', {})], state => state.rows[0]?.[0] === 10, ['移動後的 x 座標']),

    '1150702.html': task({
      calculate: state => { state.mean = (state.input.a + state.input.b) / 2; },
      branch: state => {
        if (state.mean !== undefined) state.branch = state.mean >= 60 ? '及格' : '未及格';
      },
      loop: state => {
        state.total = 0;
        repeat(state.input.n, index => { state.total += index + 1; state.rows.push([index + 1, state.total]); });
      },
      report: state => {
        if (state.branch && state.total !== undefined) state.text = `平均 ${state.mean}｜${state.branch}｜1 加到 N ＝ ${state.total}`;
      }
    }, [example('及格', { a: 50, b: 70, n: 3 }), example('未及格', { a: 30, b: 60, n: 5 })],
    state => Boolean(state.text), ['目前加到', '累計總和'],
    [field('a', '第一個數', 0, 100), field('b', '第二個數', 0, 100), field('n', 'N', 1, 20)]),

    '1150703.html': task({
      pen: shape,
      draw: state => {
        polygon(state, state.input.edges, state.input.angle);
        state.text = `走了 ${state.input.edges} 條邊｜圖形${closed(state.points) ? '閉合' : '未閉合'}`;
      },
      drawOnce: state => { polygon(state, 1, state.input.angle); }
    }, [example('三角形', { edges: 3, angle: 120 }), example('五邊形', { edges: 5, angle: 72 })],
    state => closed(state.points) && state.points.length === state.input.edges + 1 && state.input.angle * state.input.edges === 360, [],
    [field('edges', '邊數', 3, 12), field('angle', '每次轉角', 0, 360)]),

    '1150704.html': task({
      start: state => { shape(state); state.length = state.input.start; },
      update: state => { state.length += state.input.growth; },
      draw: state => {
        move(state, state.length);
        turn(state, 90);
        state.rows.push([state.rows.length + 1, state.length]);
      }
    }, [example('起始 0、每次加 10', { start: 0, growth: 10 }), example('起始 5、每次加 15', { start: 5, growth: 15 })],
    state => state.rows.length === 8 && state.rows.every(([round, length], index) =>
      length === state.input.start + state.input.growth * (index + (state.rows[0][1] === state.input.start ? 0 : 1))),
    ['輪次', '移動長度'], [field('start', '初始長度', 0, 80), field('growth', '每次增加', 1, 30)]),

    '1150705.html': task({
      pen: shape,
      draw: state => {
        repeat(state.input.copies, () => {
          polygon(state, state.input.edges, 360 / state.input.edges);
          turn(state, 360 / state.input.copies);
        });
        state.text = `畫了 ${state.input.copies} 個正 ${state.input.edges} 邊形。`;
      },
      single: state => { polygon(state, state.input.edges, 360 / state.input.edges); }
    }, [example('三角形曼陀羅', { edges: 3, copies: 12 }), example('五邊形曼陀羅', { edges: 5, copies: 10 })],
    state => state.points?.length === state.input.edges * state.input.copies + 1, [],
    [field('edges', '邊數 N', 3, 12), field('copies', '圖形數 X', 2, 24)]),

    '1150706.html': task({
      configure: state => { shape(state); state.width = state.input.width; },
      draw: state => {
        repeat(state.input.copies, () => {
          polygon(state, state.input.edges, 360 / state.input.edges);
          turn(state, 360 / state.input.copies);
        });
      },
      report: state => {
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
      }
    }, [example('測試一', { edges: 3, copies: 2, width: 2 }), example('測試二', { edges: 3, copies: 3, width: 4 }),
      example('測試三', { edges: 5, copies: 4, width: 12 })],
    state => Boolean(state.text && state.points?.length === state.input.edges * state.input.copies + 1), [],
    [field('edges', '邊數', 3, 12), field('copies', '圖形數', 1, 24), field('width', '筆跡寬度', 1, 30)]),

    '1150801.html': task({
      start: state => { state.index = 0; },
      compare: state => {
        if (state.index === undefined) throw new Error('先設定搜尋的起點。');
        while (state.index < state.input.data.length) {
          const value = state.input.data[state.index++];
          state.rows.push([state.index, value]);
          if (value === state.input.target) { state.found = state.index; break; }
        }
      },
      report: state => {
        if (!state.rows.length) throw new Error('先執行逐項比對。');
        state.text = state.found ? `找到，位置是第 ${state.found} 項。` : '全部比完，找不到。';
      }
    }, [example('找到數值 7', { data: [4, 7, 9, 7], target: 7 }), example('找不到數值 8', { data: [4, 7, 9, 7], target: 8 })],
    state => Boolean(state.text) && state.rows.length === (state.found || state.input.data.length), ['索引', '比對的值']),

    '1150802.html': task({
      notes: state => { state.notes = []; },
      play: state => {
        if (!state.notes) throw new Error('先建立音符清單。');
        [60, 60, state.input.note, 67].forEach((note, index) => {
          state.notes.push(note);
          state.rows.push([index + 1, note]);
        });
        state.text = '已依索引順序讀完音符。';
      },
      first: state => { state.notes?.push(60); }
    }, [example('原旋律', { note: 67 }), example('改第 3 個音', { note: 69 })],
    state => same(state.notes, [60, 60, state.input.note, 67]), ['索引', '音符值'], [field('note', '第 3 個音符', 48, 84)]),

    '1150803.html': task({
      reset: resetTotal,
      sum: state => {
        if (state.total === undefined) throw new Error('先把總和設為 0。');
        state.input.data.forEach((value, index) => { state.total += value; state.rows.push([index + 1, value, state.total]); });
      },
      guard: state => {
        if (!state.input.data.length) { state.stopped = true; state.text = '沒有資料，無法計算平均。'; }
      },
      average: state => {
        if (!state.input.data.length) throw new Error('除以 0。請在除法前先判斷空清單。');
        if (state.total === undefined) throw new Error('先算出總和。');
        state.average = state.total / state.input.data.length;
        state.text = `總和 ${state.total}｜平均 ${Number(state.average.toFixed(2))}`;
      }
    }, [example('120、80、150', { data: [120, 80, 150] }), example('只有 80', { data: [80] }), example('空清單', { data: [] })],
    state => state.input.data.length ? state.rows.length === state.input.data.length &&
      state.total === state.input.data.reduce((sum, value) => sum + value, 0) && state.average === state.total / state.input.data.length :
      state.stopped === true, ['項次', '讀到的值', '累計總和']),

    '1150804.html': task({
      setup: state => { state.pool = sequence(30); state.chosen = []; },
      pick: state => {
        if (!state.pool?.length) throw new Error('先建立候選清單。');
        state.index = Math.floor(Math.random() * state.pool.length);
      },
      add: state => {
        if (state.index === undefined) throw new Error('先選一個項次。');
        state.chosen.push(state.pool[state.index]);
      },
      remove: state => {
        if (state.index === undefined) throw new Error('先選一個項次。');
        const before = state.pool.length;
        const [removed] = state.pool.splice(state.index, 1);
        state.rows.push([state.rows.length + 1, removed, `${before} → ${state.pool.length}`, state.chosen.length]);
      }
    }, [example('抽 4 名隊員', {})],
    state => state.pool?.length === 26 && state.chosen?.length === 4 && new Set(state.chosen).size === 4 &&
      state.rows.every((row, index) => row[1] === state.chosen[index] && row[3] === index + 1),
    ['輪次', '抽到的座號', '候選人數', '已選人數']),

    '1150805.html': task({
      copy: state => { state.values = [...state.input.data]; },
      sort: state => {
        if (!state.values) throw new Error('先建立待排序清單。');
        const { values } = state;
        for (let end = values.length - 1; end > 0; end--) {
          for (let index = 0; index < end; index++) {
            const [left, right] = [values[index], values[index + 1]];
            if (left > right) [values[index], values[index + 1]] = [right, left];
            state.rows.push([values.length - end, `${left}、${right}`, left > right ? '交換' : '不交換', list(values)]);
          }
        }
      },
      report: state => { if (state.values) state.text = list(state.values); }
    }, [example('7、3、5、2', { data: [7, 3, 5, 2] }), example('含重複值', { data: [4, 2, 4, 1, 2] })],
    state => Boolean(state.text) && state.text === list(state.values) && same(state.values, [...state.input.data].sort((a, b) => a - b)),
    ['輪次', '比較', '動作', '清單']),

    '1150806.html': task({
      inventory: state => { state.inventory = sequence(state.input.stock); },
      shuffle: state => {
        if (!state.inventory) throw new Error('先建立裝備庫。');
        state.deck = shuffle(state.inventory);
      },
      deal: state => {
        if (!state.deck) throw new Error('先洗牌再分配。');
        if (state.deck.length < state.input.count * 2) {
          state.text = '裝備不足，停止分配與對決。';
          state.stopped = true;
          return;
        }
        state.team = state.deck.slice(0, state.input.count);
        state.enemy = state.deck.slice(state.input.count, state.input.count * 2);
      },
      duel: state => {
        if (!state.team) throw new Error('先分配裝備。');
        state.team.forEach((value, index) => {
          const opponent = state.enemy[index];
          state.rows.push([index + 1, value, opponent, value > opponent ? '小隊得分' : '對手得分']);
        });
        state.text = `小隊：${list(state.team)}｜對手：${list(state.enemy)}`;
      }
    }, [example('裝備足夠', { stock: 24, count: 6 }), example('裝備不足', { stock: 8, count: 6 }),
      example('剛好分完且不重複', { stock: 12, count: 6 })],
    state => state.input.stock < state.input.count * 2 ? state.stopped === true && !state.rows.length :
      state.rows.length === state.input.count && new Set([...state.team, ...state.enemy]).size === state.input.count * 2,
    ['輪次', '小隊裝備', '對手裝備', '結果'], [field('stock', '庫存數', 1, 24), field('count', '每隊需求', 1, 12)])
  };

  tasks['1150704.html'].loop = { before: ['start'], times: 8 };
  tasks['1150804.html'].loop = { before: ['setup'], times: 4 };

  // Delimiters describe the shapes of fixed values, variable menus, and conditions.
  const views = {
    '1150701.html': {
      goal: ['flag', 'move'],
      flag: ['event', 'hat', '當 ⚑ 被點擊'],
      move: ['motion', 'stack', '移動 {10} 點'],
      say: ['looks', 'stack', '說出 {出發！}']
    },
    '1150702.html': {
      goal: ['calculate', 'branch', 'loop', 'report'],
      calculate: ['variable', 'stack', '變數 [平均] 設為 {兩數的平均}'],
      branch: ['control', 'ifelse', '如果 <平均 ≥ 60> 那麼',
        [['variable', '變數 [結果] 設為 {及格}']],
        [['variable', '變數 [結果] 設為 {未及格}']]],
      loop: ['control', 'loop', '重複 {N} 次', [['variable', '變數 [總和] 改變 {目前的數}']]],
      report: ['looks', 'stack', '說出 {平均、判斷結果與總和}']
    },
    '1150703.html': {
      goal: ['pen', 'draw'],
      pen: ['pen', 'stack', '筆跡全部清除並下筆'],
      draw: ['control', 'loop', '重複 {邊數} 次', [['motion', '移動 {35} 點'], ['motion', '右轉 ↻ {每次轉角} 度']]],
      drawOnce: ['motion', 'stack', '移動 {35} 點，再右轉 ↻ {每次轉角} 度']
    },
    '1150704.html': {
      goal: ['start', 'update', 'draw'],
      start: ['variable', 'stack', '變數 [長度] 設為 {初始長度}，清除筆跡'],
      update: ['variable', 'stack', '變數 [長度] 改變 {每次增加}'],
      draw: ['motion', 'stack', '移動 {長度} 點，再右轉 ↻ {90} 度']
    },
    '1150705.html': {
      goal: ['pen', 'draw'],
      pen: ['pen', 'stack', '筆跡全部清除並下筆'],
      draw: ['control', 'loop', '重複 {X} 次', [['custom', '畫正 {N} 邊形'], ['motion', '右轉 ↻ {360 ÷ X} 度']]],
      single: ['custom', 'stack', '畫正 {N} 邊形']
    },
    '1150706.html': {
      goal: ['configure', 'draw', 'report'],
      configure: ['variable', 'stack', '設定 [邊數]、[圖形數] 與 [筆跡寬度]'],
      draw: ['custom', 'stack', '畫幾個圖形 {圖形數}'],
      report: ['looks', 'stack', '說出 {防禦結果與消耗量}']
    },
    '1150801.html': {
      goal: ['start', 'compare', 'report'],
      start: ['variable', 'stack', '變數 [位置] 設為 {1}'],
      compare: ['control', 'loop', '重複直到 <找到目標或比完清單>', [['list', '比對 [清單] 的第 {位置} 項'], ['variable', '若不相同，[位置] 改變 {1}']]],
      report: ['looks', 'stack', '說出 {找到的位置或找不到}']
    },
    '1150802.html': {
      goal: ['notes', 'play'],
      notes: ['list', 'stack', '建立 [音符清單]，從第 {1} 項開始'],
      play: ['control', 'loop', '重複 {音符清單的長度} 次', [['music', '演奏音符 {目前音符} 持續 {一拍}'], ['variable', '變數 [索引] 改變 {1}']]],
      first: ['music', 'stack', '演奏音符 {清單第 1 項}']
    },
    '1150803.html': {
      goal: ['reset', 'sum', 'guard', 'average'],
      reset: ['variable', 'stack', '變數 [總和] 設為 {0}'],
      sum: ['control', 'loop', '重複 {清單的長度} 次', [['variable', '變數 [總和] 改變 {目前項目}']]],
      guard: ['control', 'loop', '如果 <清單的長度 = 0> 那麼', [['looks', '說出 {沒有資料，無法計算平均}'], ['control', '停止 [這個程式]']]],
      average: ['looks', 'stack', '說出 {總和 ÷ 清單的長度}']
    },
    '1150804.html': {
      goal: ['setup', 'pick', 'add', 'remove'],
      setup: ['list', 'stack', '建立 [候選清單]，刪除 [已選] 的所有項目'],
      pick: ['variable', 'stack', '變數 [項次] 設為 {隨機取數 1 到候選長度}'],
      add: ['list', 'stack', '添加 {抽到的座號} 到 [已選]'],
      remove: ['list', 'stack', '刪除 [候選清單] 的第 {項次} 項']
    },
    '1150805.html': {
      goal: ['copy', 'sort', 'report'],
      copy: ['list', 'stack', '將輸入資料逐項添加到 [待排序清單]'],
      sort: ['control', 'loop', '重複 {剩餘輪數} 次', [['control', '如果 <前項大於後項> 那麼交換兩項']]],
      report: ['looks', 'stack', '說出 {排序後的清單}']
    },
    '1150806.html': {
      goal: ['inventory', 'shuffle', 'deal', 'duel'],
      inventory: ['custom', 'stack', '建立裝備庫 {庫存數}'],
      shuffle: ['custom', 'stack', '洗牌'],
      deal: ['custom', 'stack', '分配裝備 {每隊需求}'],
      duel: ['custom', 'stack', '逐項對決']
    }
  };
  for (const [page, { goal, ...blocks }] of Object.entries(views)) {
    const task = tasks[page];
    task.goal = goal;
    for (const [id, view] of Object.entries(blocks)) task.blocks[id] = { run: task.blocks[id], view };
  }
  window.BlockProgramTasks = tasks;
})();
