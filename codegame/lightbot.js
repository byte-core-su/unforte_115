(() => {
    'use strict';
    const levels = window.CodeGameLevels, { Machine, copyPrograms } = window.CodeGameEngine;
    const $ = id => document.getElementById(id), groups = ['基礎', '程序', '迴圈'];
    const actions = { forward: ['↑', '前進'], left: ['↶', '左轉'], right: ['↷', '右轉'], jump: ['⇧', '跳躍'], light: ['☀', '點燈'], p1: ['P1', '程序 1'], p2: ['P2', '程序 2'] };
    let storage; try { storage = window.localStorage; } catch { storage = null; }
    const store = new window.CodeGameProgress.ProgressStore(storage, levels), renderer = new window.CodeGameRenderer.Renderer($('game-board'));
    function normalizeStudent(value) {
        if (!value || !['name', 'studentId', 'className'].every(key => typeof value[key] === 'string' && value[key].trim())) throw new TypeError('請填入姓名、學號與班級。');
        if (value.name.trim().length > 80 || value.studentId.trim().length > 40 || value.className.trim().length > 40) throw new TypeError('學生資料超過欄位長度限制。');
        return { name: value.name.trim(), studentId: value.studentId.trim(), className: value.className.trim(), source: typeof value.source === 'string' ? value.source.slice(0, 40) : '手動設定' };
    }
    let student = { name: '王小明', studentId: '1510100', className: '11501', source: '示範學生' };
    try { const saved = storage?.getItem('codegame.student.v1'); if (saved) student = normalizeStudent(JSON.parse(saved)); } catch { /* Use the demo profile if saved data is damaged. */ }
    let record = store.load(student), level = levels.find(item => item.id === record.currentLevel) || levels[0];
    let selected = { section: 'main', index: 0 }, machine, autoplay = false, timeout = null, sessionMs = 0, checkpoint = performance.now();
    function entry() { return record.levels[level.id] ||= { programs: { main: [], p1: [], p2: [] }, attempts: 0, elapsedMs: 0, completed: false, bestCommands: null, bestProgram: null, completedAt: null, lastRun: null }; }
    function collectTime() { const now = performance.now(); if (!document.hidden) { const elapsed = Math.max(0, Math.round(now - checkpoint)); sessionMs += elapsed; entry().elapsedMs += elapsed; } checkpoint = now; }
    const duration = ms => { const seconds = Math.floor(ms / 1000); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; };
    function exportData() { return JSON.parse(JSON.stringify({ version: 1, game: 'codegame-codehour', savedAt: new Date().toISOString(), student, progress: record })); }
    function save() { const ok = store.save(student, record); $('save-status').textContent = ok ? '進度儲存於此瀏覽器' : '無法儲存；請下載紀錄備份'; $('save-status').classList.toggle('error', !ok); window.dispatchEvent(new CustomEvent('codegame:progress', { detail: exportData() })); }
    function status(message, tone = '') { $('game-status').textContent = message; $('game-status').className = `game-status ${tone}`; }
    function stop() { clearTimeout(timeout); timeout = null; autoplay = false; $('run-program').textContent = machine?.status === 'running' ? '繼續執行' : '執行程式'; }
    function reset(message = '先選指令格，再點選下方指令。') { stop(); machine = new Machine(level, entry().programs); renderer.set(level, machine.snapshot()); updateBoard(); renderPrograms(); status(message); }
    function renderStudent() { $('student-name').textContent = student.name; $('student-id').textContent = student.studentId; $('student-class').textContent = student.className; $('student-source').textContent = student.source; }
    function renderNav() {
        const fragment = document.createDocumentFragment();
        groups.forEach((name, index) => {
            const section = document.createElement('section'); section.className = 'level-group'; const heading = document.createElement('h3'); heading.textContent = `${index + 1} · ${name}`; section.append(heading);
            const buttons = document.createElement('div'); buttons.className = 'level-buttons';
            levels.filter(item => item.group === index + 1).forEach(item => {
                const button = document.createElement('button'); button.type = 'button'; button.className = 'level-button'; button.textContent = `${item.number}${record.levels[item.id]?.completed ? ' ✓' : ''}`;
                button.title = `${item.id} ${item.title}`; button.setAttribute('aria-label', `${button.title}${record.levels[item.id]?.completed ? '，已完成' : ''}`); if (item.id === level.id) button.setAttribute('aria-current', 'true');
                button.addEventListener('click', () => selectLevel(item.id)); buttons.append(button);
            }); section.append(buttons); fragment.append(section);
        }); $('level-list').replaceChildren(fragment); $('total-complete').textContent = `${levels.filter(item => record.levels[item.id]?.completed).length} / 20`;
    }
    function renderPrograms() {
        const fragment = document.createDocumentFragment(), programs = entry().programs;
        ['main', 'p1', 'p2'].forEach(section => {
            if (!level.capacity[section]) return;
            const wrapper = document.createElement('div'); wrapper.className = 'program-section'; const heading = document.createElement('h3'); heading.textContent = `${section === 'main' ? '主程式' : section.toUpperCase()} · ${programs[section].length} / ${level.capacity[section]}`;
            const grid = document.createElement('div'); grid.className = 'slots';
            for (let index = 0; index < level.capacity[section]; index++) {
                const command = programs[section][index], button = document.createElement('button'); button.type = 'button'; button.className = 'slot'; button.dataset.section = section; button.dataset.index = index;
                button.classList.toggle('selected', selected.section === section && selected.index === index); button.classList.toggle('executing', machine?.last?.section === section && machine.last.index === index);
                button.classList.toggle('filled', !!command); button.draggable = !!command; button.textContent = command ? actions[command][0] : '+'; button.setAttribute('aria-label', `${section === 'main' ? '主程式' : section.toUpperCase()} 第 ${index + 1} 格：${command ? actions[command][1] : '空格'}`); button.title = button.getAttribute('aria-label');
                const number = document.createElement('small'); number.textContent = index + 1; button.append(number);
                button.addEventListener('click', () => { selected = { section, index }; renderPrograms(); });
                button.addEventListener('keydown', event => { if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); selected = { section, index }; deleteCommand(); } });
                button.addEventListener('dragstart', event => event.dataTransfer.setData('application/x-codegame-slot', JSON.stringify({ section, index })));
                button.addEventListener('dragover', event => { if ([...event.dataTransfer.types].includes('application/x-codegame-slot')) event.preventDefault(); });
                button.addEventListener('drop', event => {
                    event.preventDefault(); try {
                        const from = JSON.parse(event.dataTransfer.getData('application/x-codegame-slot'));
                        if (!['main', 'p1', 'p2'].includes(from.section) || !Number.isInteger(from.index) || !programs[from.section][from.index]) return;
                        if (from.section !== section && programs[section].length >= level.capacity[section]) return;
                        const [moved] = programs[from.section].splice(from.index, 1), position = Math.min(index, programs[section].length); programs[section].splice(position, 0, moved); selected = { section, index: position }; edited();
                    } catch { /* Ignore external drags. */ }
                }); grid.append(button);
            } wrapper.append(heading, grid); fragment.append(wrapper);
        }); $('program-sections').replaceChildren(fragment);
        $('command-count').textContent = `${Object.values(programs).reduce((sum, list) => sum + list.length, 0)} 個`;
        const list = programs[selected.section]; $('delete-command').disabled = !list[selected.index]; $('move-earlier').disabled = !list[selected.index] || selected.index === 0; $('move-later').disabled = !list[selected.index] || selected.index >= list.length - 1; $('clear-program').disabled = !Object.values(programs).some(list => list.length);
    }
    function renderPalette() {
        const fragment = document.createDocumentFragment(); level.commands.forEach(command => {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'command-button'; const symbol = document.createElement('span'); symbol.textContent = actions[command][0]; const label = document.createElement('small'); label.textContent = actions[command][1]; button.append(symbol, label);
            button.addEventListener('click', () => { const list = entry().programs[selected.section], index = Math.min(selected.index, list.length); if (index >= level.capacity[selected.section]) { status('這個程序已放滿指令。請選取要替換的指令格。'); return; } list[index] = command; selected.index = Math.min(index + 1, level.capacity[selected.section] - 1); edited(); }); fragment.append(button);
        }); $('command-palette').replaceChildren(fragment);
    }
    function updateRecord() { const item = entry(); $('level-complete').textContent = item.completed ? '✓ 已完成' : '尚未完成'; $('attempt-count').textContent = `嘗試 ${item.attempts} 次`; $('best-count').textContent = `最佳 ${item.bestCommands ?? '—'}${item.bestCommands ? ' 個' : ''}`; $('next-level').hidden = !item.completed; $('next-level').disabled = level === levels[levels.length - 1]; $('next-level').textContent = level === levels[levels.length - 1] ? '已到最後一關' : '前往下一關'; }
    function updateBoard() { const snapshot = machine.snapshot(); $('light-count').textContent = `已點亮 ${snapshot.lit.length} / ${level.goals.length}`; $('step-count').textContent = `執行 ${snapshot.steps} 步`; $('robot-position').textContent = `第 ${snapshot.robot.row + 1} 列、${snapshot.robot.col + 1} 欄 · 朝${['東', '南', '西', '北'][snapshot.robot.direction]}`; }
    function selectLevel(id) {
        collectTime(); stop(); const next = levels.find(item => item.id === id); if (!next) return; level = next; record.currentLevel = id; selected = { section: 'main', index: 0 };
        $('level-group').textContent = `${groups[level.group - 1]} · ${level.id}`; $('level-title').textContent = level.title; $('level-tip').textContent = level.group === 1 ? '排列動作，點亮所有藍色目標。橘色箭頭是機器人的前方。' : level.group === 2 ? '把重複的動作放入 P1 或 P2，在主程式中呼叫。' : '主程式只有一格。讓程序呼叫自己，重複動作直到所有燈亮起。';
        $('board-description').textContent = level.board.map((row, index) => `第 ${index + 1} 列：${row.map((height, col) => height === null ? '空洞' : `${height} 層${level.goals.some(([r, c]) => r === index && c === col) ? '目標' : ''}`).join('、')}`).join('；');
        renderNav(); renderPalette(); updateRecord(); reset(entry().completed ? '這關已完成，仍可修改程式再練習。' : '先選指令格，再點選下方指令。'); save();
    }
    function edited() { reset('草稿已更新，可以執行或單步檢查。'); save(); }
    function deleteCommand() { entry().programs[selected.section].splice(selected.index, 1); edited(); }
    function moveCommand(offset) { const list = entry().programs[selected.section], index = selected.index, to = index + offset; if (!list[index] || to < 0 || to >= list.length) return; [list[index], list[to]] = [list[to], list[index]]; selected.index = to; edited(); }
    function beginAttempt() { if (!['ready', 'running'].includes(machine.status)) reset(); if (machine.status === 'ready') { entry().attempts++; updateRecord(); save(); } }
    function executeStep() {
        const snapshot = machine.step(); renderer.set(level, snapshot, true); updateBoard(); renderPrograms();
        if (snapshot.status === 'won') {
            stop(); const item = entry(), count = Object.values(item.programs).reduce((sum, list) => sum + list.length, 0); if (!item.completed) item.completedAt = new Date().toISOString(); item.completed = true;
            if (item.bestCommands === null || count < item.bestCommands) { item.bestCommands = count; item.bestProgram = copyPrograms(item.programs); } item.lastRun = { status: 'won', steps: snapshot.steps }; collectTime(); save(); renderNav(); updateRecord(); status(`過關！${level.goals.length} 個目標全部亮起，共執行 ${snapshot.steps} 步。`, 'won');
        } else if (snapshot.status === 'ended' || snapshot.status === 'limit') {
            stop(); entry().lastRun = { status: snapshot.status, steps: snapshot.steps }; save(); status(snapshot.status === 'limit' ? '已執行 10,000 步仍未完成，程式已停止。請檢查迴圈。' : `程式執行完畢，還有 ${level.goals.length - snapshot.lit.length} 個目標未點亮。`, 'warning');
        } else status(snapshot.last?.reason || `執行 ${snapshot.last.section === 'main' ? '主程式' : snapshot.last.section.toUpperCase()} 第 ${snapshot.last.index + 1} 格：${actions[snapshot.last.command][1]}`);
    }
    function tick() { if (!autoplay) return; executeStep(); if (autoplay) timeout = setTimeout(tick, Number($('run-speed').value)); }
    $('run-program').addEventListener('click', () => { if (autoplay) { stop(); status('已暫停，可繼續執行或單步檢查。'); return; } beginAttempt(); autoplay = true; $('run-program').textContent = '暫停'; tick(); });
    $('step-program').addEventListener('click', () => { stop(); beginAttempt(); executeStep(); });
    $('reset-board').addEventListener('click', () => { if (machine.status === 'running') { entry().lastRun = { status: 'stopped', steps: machine.steps }; save(); } reset('機器人已回到起點，指令草稿仍保留。'); });
    $('rotate-view').addEventListener('click', () => renderer.rotate()); $('delete-command').addEventListener('click', deleteCommand); $('move-earlier').addEventListener('click', () => moveCommand(-1)); $('move-later').addEventListener('click', () => moveCommand(1));
    $('clear-program').addEventListener('click', () => { entry().programs = { main: [], p1: [], p2: [] }; selected = { section: 'main', index: 0 }; edited(); });
    $('next-level').addEventListener('click', () => { const next = levels[levels.indexOf(level) + 1]; if (next) selectLevel(next.id); });
    function setStudent(value) { const next = normalizeStudent(value); collectTime(); stop(); save(); student = next; try { storage?.setItem('codegame.student.v1', JSON.stringify(student)); } catch { /* The save status reports storage errors. */ } record = store.load(student); sessionMs = 0; checkpoint = performance.now(); renderStudent(); selectLevel(record.currentLevel); }
    $('edit-student').addEventListener('click', () => { $('name-input').value = student.name; $('id-input').value = student.studentId; $('class-input').value = student.className; $('student-dialog').showModal(); }); $('cancel-student').addEventListener('click', () => $('student-dialog').close());
    $('student-form').addEventListener('submit', event => { event.preventDefault(); if ([$('name-input'), $('id-input'), $('class-input')].some(input => !input.value.trim())) { status('請填入姓名、學號與班級。'); return; } setStudent({ name: $('name-input').value, studentId: $('id-input').value, className: $('class-input').value }); $('student-dialog').close(); });
    $('show-records').addEventListener('click', () => {
        collectTime(); save(); $('records-student').textContent = `${student.className} · ${student.studentId} · ${student.name}`;
        const rows = levels.map(item => { const data = record.levels[item.id], row = document.createElement('tr'); [item.id, data?.completed ? '✓ 完成' : '未完成', data?.attempts || 0, data?.bestCommands ?? '—', duration(data?.elapsedMs || 0)].forEach(value => { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); }); return row; }); $('records-body').replaceChildren(...rows); $('records-dialog').showModal();
    }); $('close-records').addEventListener('click', () => $('records-dialog').close());
    function download(blob, filename) { const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    const safeName = value => value.replace(/[^\p{L}\p{N}_-]/gu, '_');
    $('export-records').addEventListener('click', () => { collectTime(); save(); download(new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' }), `codegame-${safeName(student.studentId)}-records.json`); });
    $('download-screen').addEventListener('click', () => {
        collectTime(); save(); const canvas = document.createElement('canvas'); canvas.width = 1440; canvas.height = 880; const ctx = canvas.getContext('2d'); ctx.fillStyle = '#f2f4fa'; ctx.fillRect(0, 0, 1440, 880); ctx.fillStyle = '#ffffff'; ctx.fillRect(24, 24, 1392, 112); ctx.fillRect(24, 156, 932, 668); ctx.fillRect(976, 156, 440, 668);
        ctx.fillStyle = '#17253d'; ctx.font = 'bold 30px sans-serif'; ctx.fillText(student.name, 48, 68, 850); ctx.font = '20px sans-serif'; ctx.fillText(`學號 ${student.studentId}   班級 ${student.className}`, 48, 107, 850); ctx.textAlign = 'right'; ctx.fillText(`${groups[level.group - 1]} ${level.id} · ${level.title}`, 1390, 68); ctx.fillText(new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }), 1390, 107); ctx.textAlign = 'left';
        ctx.save(); ctx.translate(40, 174); renderer.paint(ctx, 900, 560); ctx.restore(); ctx.fillStyle = '#17253d'; ctx.font = '22px sans-serif'; ctx.fillText($('game-status').textContent.slice(0, 43), 48, 774);
        let y = 194; ['main', 'p1', 'p2'].forEach(section => { if (!level.capacity[section]) return; ctx.fillStyle = '#17253d'; ctx.font = 'bold 22px sans-serif'; ctx.fillText(section === 'main' ? '主程式' : section.toUpperCase(), 998, y); y += 18;
            for (let index = 0; index < level.capacity[section]; index++) { const x = 998 + index % 6 * 64, top = y + Math.floor(index / 6) * 55; ctx.fillStyle = '#edf0ff'; ctx.fillRect(x, top, 56, 47); ctx.fillStyle = '#5045d9'; ctx.font = 'bold 25px sans-serif'; ctx.fillText(actions[entry().programs[section][index]]?.[0] || '·', x + 12, top + 33); } y += Math.ceil(level.capacity[section] / 6) * 55 + 38;
        }); ctx.fillStyle = '#17253d'; ctx.font = '20px sans-serif'; ctx.fillText(`${entry().completed ? '已完成' : '尚未完成'}   嘗試 ${entry().attempts} 次   最佳 ${entry().bestCommands ?? '—'} 個`, 998, 760); ctx.fillText(`本次 ${duration(sessionMs)} · 本關累積 ${duration(entry().elapsedMs)}`, 998, 793); ctx.font = '16px sans-serif'; ctx.fillStyle = '#66738d'; ctx.fillText('CodeGame 點亮任務 · 本機練習紀錄', 24, 857);
        canvas.toBlob(blob => { if (blob) download(blob, `codegame-${safeName(student.studentId)}-${level.id}.png`); }, 'image/png');
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { const elapsed = Math.max(0, Math.round(performance.now() - checkpoint)); sessionMs += elapsed; entry().elapsedMs += elapsed; stop(); save(); } checkpoint = performance.now(); });
    window.addEventListener('pagehide', () => { collectTime(); save(); }); let pulses = 0; setInterval(() => { collectTime(); $('session-time').textContent = duration(sessionMs); if (++pulses % 5 === 0) save(); }, 1000);
    $('session-date').textContent = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
    window.LightbotLearning = { setStudent, getStudent: () => ({ ...student }), getProgress: () => exportData().progress, exportData }; renderStudent(); selectLevel(record.currentLevel);
})();
