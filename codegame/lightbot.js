(() => {
    'use strict';
    const gameArea = document.querySelector('.game-area');
    const gameScreen = document.querySelector('.game-screen');
    const fitGame = () => {
        const scale = Math.min(gameArea.clientWidth / 960, gameArea.clientHeight / 650);
        gameScreen.style.transform = `translate(-50%, -50%) scale(${scale})`;
    };
    fitGame();
    new ResizeObserver(fitGame).observe(gameArea);

    const dateOutput = document.querySelector('#session-date');
    const timerOutput = document.querySelector('#session-time');
    const dateFormatter = new Intl.DateTimeFormat('zh-TW', {
        timeZone: 'Asia/Taipei', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });
    let elapsedMs = 0;
    let visibleSince = document.hidden ? null : performance.now();
    const elapsed = () => elapsedMs + (visibleSince === null ? 0 : performance.now() - visibleSince);
    const renderSession = () => {
        dateOutput.textContent = dateFormatter.format(new Date());
        const totalSeconds = Math.floor(elapsed() / 1000);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        timerOutput.textContent = `${minutes}:${seconds}`;
    };
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && visibleSince !== null) {
            elapsedMs += performance.now() - visibleSince;
            visibleSince = null;
        } else if (!document.hidden && visibleSince === null) {
            visibleSince = performance.now();
        }
        renderSession();
    });
    const resetTimer = () => {
        elapsedMs = 0;
        visibleSince = document.hidden ? null : performance.now();
        renderSession();
    };
    renderSession();
    setInterval(renderSession, 1000);

    let student = { name: '王小明', studentId: '1510100', className: '11501' };
    // 日後由登入後的後端資料呼叫此入口；只更新本站文字，不傳入遊戲 iframe。
    const setStudent = (data) => {
        const fields = ['name', 'studentId', 'className'];
        if (!data || fields.some(key => typeof data[key] !== 'string' || !data[key].trim())) {
            throw new TypeError('學生資料需包含姓名、學號與班級字串。');
        }
        const next = Object.fromEntries(fields.map(key => [key, data[key].trim()]));
        if (next.name.length > 80 || next.studentId.length > 40 || next.className.length > 40) {
            throw new TypeError('學生資料超過欄位長度限制。');
        }
        const changed = fields.some(key => student[key] !== next[key]);
        student = next;
        document.querySelector('#student-name').textContent = student.name;
        document.querySelector('#student-id').textContent = student.studentId;
        document.querySelector('#student-class').textContent = student.className;
        document.querySelector('#student-source').hidden = true;
        if (changed) resetTimer();
    };
    window.LightbotLearning = Object.freeze({ setStudent });

    const dialog = document.querySelector('#student-dialog');
    const form = document.querySelector('#student-form');
    document.querySelector('#edit-student').addEventListener('click', () => {
        for (const key of ['name', 'studentId', 'className']) form.elements.namedItem(key).value = student[key];
        dialog.showModal();
    });
    document.querySelector('#cancel-student').addEventListener('click', () => dialog.close());
    form.addEventListener('submit', event => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        for (const key of ['name', 'studentId', 'className']) {
            const input = form.elements.namedItem(key);
            input.setCustomValidity(data[key].trim() ? '' : '請填寫此欄位。');
        }
        if (!form.reportValidity()) return;
        setStudent(data);
        dialog.close();
    });
    form.addEventListener('input', event => event.target.setCustomValidity?.(''));
})();
