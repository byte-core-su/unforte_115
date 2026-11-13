// Build the teaching pages and shared assessment text from Markdown and modules/.
// Run `npm install` once, then `npm run build:lesson-plans` after editing a source.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { active, applyPage } = require('../course-scenarios.js');
const check = process.argv.includes('--check');
const { marked } = require(process.argv.slice(2).find(arg => arg !== '--check') || 'marked');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const registry = JSON.parse(read('modules/registry.json'));
const modules = registry.files.map(file => JSON.parse(read(`modules/${file}`)));
const byId = new Map(modules.map(item => [item.id, item]));
const gradeModules = grade => modules.filter(item => item.grade === grade).sort((a, b) => a.lesson - b.lesson);
const periodsFor = units => units.reduce((total, item) => total + item.periods, 0);
const outputs = new Map();
const demoScript = '// Generated from teacher-demo.js by npm run build:lesson-plans.\n' + read('teacher-demo.js');
for (const folder of ['codegame', 'pythonlab']) outputs.set(`${folder}/teacher-demo.js`, demoScript);
const routeContext = { window: {}, location: { pathname: '' } };
vm.runInNewContext(read('lesson-labels.js'), routeContext);
vm.runInNewContext(read('lesson-routes.js'), routeContext);
const routes = routeContext.window.LessonRoutes;

// Markdown sources and the page each one becomes. Links between these files are rewritten to the pages.
const pageFor = {
  'LESSON_PLAN_GRADE_7.md': 'lesson-plan-grade-7.html',
  'LESSON_PLAN_GRADE_8.md': 'lesson-plan-grade-8.html',
  'STUDENT_RECORDS.md': 'student-records.html',
  'CURRICULUM_ALIGNMENT.md': 'curriculum-alignment.html'
};

const pages = [
  {
    kind: 'lesson-plan',
    grade: 7,
    source: 'LESSON_PLAN_GRADE_7.md',
    course: '1150700.html',
    companion: 'lesson-plan-grade-8.html',
    summary: 'Scratch 程式結構、迴圈、變數與防禦網專題'
  },
  {
    kind: 'lesson-plan',
    grade: 8,
    source: 'LESSON_PLAN_GRADE_8.md',
    course: '1150800.html',
    companion: 'lesson-plan-grade-7.html',
    summary: '清單資料追蹤、搜尋排序與模組化對決'
  },
  {
    kind: 'records',
    source: 'STUDENT_RECORDS.md',
    summary: '選一課，按「複製本課紀錄與要求」，貼到班級平台的線上文件或作業。'
  },
  {
    kind: 'alignment',
    source: 'CURRICULUM_ALIGNMENT.md',
    summary: '七、八年級 12 個單元與《科技領域課綱》學習內容、學習表現的逐課對照。'
  }
];

const escapeHtml = value => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

function assessment(item) {
  return `<p><strong>必交項目</strong> ${escapeHtml(item.evidence)}</p>\n<p><strong>怎樣算達標</strong> ${escapeHtml(item.successCriteria)}</p>`;
}

const byPage = {};
let map = read('curriculum-map.html');
for (const item of modules) {
  const { id, entry, title, goal, periods, tags, evidence, successCriteria, resources } = item;
  if (!evidence?.trim() || !successCriteria?.trim()) throw new Error(`${id} 缺少必交項目或達標條件。`);
  const { lessonPlan, records } = resources;
  if (lessonPlan !== `lesson-plan-grade-${item.grade}.html#lesson-${item.lesson}` || records !== `student-records.html#${id}`) {
    throw new Error(`${id} 的教案或學習紀錄連結與課次不符。`);
  }
  if (!title?.trim() || !goal?.trim() || !Number.isInteger(periods) || periods < 1) throw new Error(`${id} 的課名、目標或節數無效。`);
  const sequence = gradeModules(item.grade);
  const previous = sequence[sequence.indexOf(item) - 1]?.entry;
  const next = sequence[sequence.indexOf(item) + 1]?.entry;
  const overview = `1150${item.grade}00.html`;
  byPage[entry] = { title, goal, periods, evidence, successCriteria, lessonPlan, records, overview, previous, next };
  const card = new RegExp(`(<li><a href="${entry.replace('.', '\\.')}">[^\\n]*?<h4>)[^<]*(</h4><p>)[^<]*(</p><span class="map-evidence">)[^<]*(</span>)`, 'g');
  if ([...map.matchAll(card)].length !== 1) throw new Error(`${id} 應有一張成果卡片。`);
  map = map.replace(card, (_, start, meta, work, end) => `${start}${escapeHtml(title)}${meta}${escapeHtml(tags.join(' · '))} · 建議 ${periods} 節${work}必交｜${escapeHtml(evidence)}${end}`);
}
outputs.set('lesson-assessments.js', '// Generated from modules/ by npm run build:lesson-plans.\nwindow.LessonAssessments = ' + JSON.stringify(byPage, null, 2) + ';\n');
outputs.set('curriculum-map.html', map);

const deckFile = 'presentations/20261110.html';
const [seven, eight] = [7, 8].map(grade => periodsFor(gradeModules(grade)));
const deckPeriods = seven === eight ? `建議各 ${seven} 節` : `建議七年級 ${seven} 節、八年級 ${eight} 節`;
outputs.set(deckFile, read(deckFile).replace(/(<span data-course-periods>)[^<]*(<\/span>)/, `$1${deckPeriods}$2`));

for (const grade of [7, 8]) for (let lesson = 0; lesson <= 6; lesson++) {
  const entry = `1150${grade}0${lesson}.html`;
  const html = read(entry).replace(/<([a-z][\w-]*)\b([^>]*\bdata-scenario-text="([\w.]+)"[^>]*)>[\s\S]*?<\/\1>/gi, (whole, tag, attrs, key) => {
    const node = { dataset: { scenarioText: key } };
    applyPage({ querySelectorAll: selector => selector === '[data-scenario-text]' ? [node] : [] }, entry, active);
    if (typeof node.textContent !== 'string') throw new Error(`${entry} 的情境欄位 ${key} 找不到。`);
    return `<${tag}${attrs}>${escapeHtml(node.textContent)}</${tag}>`;
  }).replace(/(<a\b[^>]*\bdata-scenario-download\b[^>]*\bhref=")[^"]*(")/g, (_, start, end) => {
    const link = { setAttribute: (_, value) => { link.href = value; } };
    applyPage({ querySelectorAll: selector => selector === '[data-scenario-download]' ? [link] : [] }, entry, active);
    if (!link.href) throw new Error(`${entry} 的情境下載路徑無效。`);
    return `${start}${escapeHtml(link.href)}${end}`;
  });
  const navigation = byPage[entry];
  const synced = navigation ? html.replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtml(navigation.title)}｜資訊科技課程</title>`)
    .replace(/(<a\b[^>]*\bdata-course-direction="(next|previous|outline)"[^>]*\bhref=")([^"]+)(")/g,
    (whole, start, direction, href, end) => {
      if (direction === 'outline' && href === 'index.html') return whole;
      const destination = direction === 'outline' ? navigation.overview : navigation[direction];
      if (!destination) throw new Error(`${entry} 的 ${direction} 導覽超出課程範圍。`);
      return `${start}${destination}${end}`;
    }) : html;
  outputs.set(entry, synced);
}

// Copy one lesson's requirements and tables as HTML and plain text.
const copyTableScript = `
    <script>
    (() => {
        const status = document.getElementById('copy-status');
        document.querySelectorAll('.lesson-record, .lesson-table-scroll').forEach((wrapper, index) => {
            if (wrapper.matches('.lesson-table-scroll') && wrapper.closest('.lesson-record')) return;
            const record = wrapper.matches('.lesson-record');
            const content = record ? wrapper : wrapper.querySelector('table');
            const heading = record ? wrapper.querySelector('h3').textContent.trim() : (() => {
                for (let node = wrapper.previousElementSibling; node; node = node.previousElementSibling) {
                    if (/^H[23]$/.test(node.tagName)) return node.textContent.trim();
                }
                return '紀錄 ' + (index + 1);
            })();
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'copy-table-button';
            button.textContent = record ? '複製本課紀錄與要求' : '複製表格';
            button.setAttribute('aria-label', '複製「' + heading + '」' + (record ? '紀錄與要求' : '表格'));
            button.addEventListener('click', async () => {
                const copy = content.cloneNode(true);
                if (record) copy.querySelector('.copy-table-button')?.remove();
                const asText = table => [...table.rows].map(row => [...row.cells].map(cell => cell.textContent.trim()).join('\\t')).join('\\n');
                const plain = record ? [...copy.children].map(node => {
                    const table = node.querySelector('table');
                    return table ? asText(table) : node.textContent.trim();
                }).join('\\n\\n') : asText(copy);
                try {
                    await navigator.clipboard.write([new ClipboardItem({
                        'text/html': new Blob([copy.outerHTML], { type: 'text/html' }),
                        'text/plain': new Blob([plain], { type: 'text/plain' })
                    })]);
                    status.textContent = '已複製「' + heading + '」，可貼到線上文件或作業。';
                } catch {
                    const range = document.createRange();
                    if (record) {
                        range.setStartAfter(button);
                        range.setEndAfter(content.lastElementChild);
                    } else range.selectNode(content);
                    const selection = getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                    let copied = false;
                    try { copied = document.execCommand('copy'); } catch {}
                    status.textContent = copied
                        ? '已複製「' + heading + '」，可貼到線上文件或作業。'
                        : '已選取「' + heading + '」，請按 Ctrl+C（Mac 按 ⌘+C）複製。';
                }
            });
            if (record) wrapper.querySelector('h3').after(button);
            else wrapper.before(button);
        });
    })();
    </script>`;

for (const page of pages) {
  page.output = pageFor[page.source];
  const markdown = read(page.source);
  const match = /^# (.+)\r?\n/.exec(markdown);
  if (!match) throw new Error(`${page.source} must begin with an H1 title`);
  const title = match[1];
  const sections = [];
  const lessons = [];
  let html = marked.parse(markdown.slice(match[0].length), { gfm: true });
  html = html.replace(/<h2>(.*?)<\/h2>/g, (_, label) => {
    const id = `section-${sections.length + 1}`;
    sections.push({ id, label: label.replace(/<[^>]*>/g, '') });
    return `<h2 id="${id}">${label}</h2>`;
  });
  if (page.kind === 'lesson-plan') {
    // Stable anchors so each unit page can open its own lesson: lesson-plan-grade-7.html#lesson-3
    html = html.replace(/<h3>第 ([1-6]) 課[^<]*<\/h3>/g, (_, number) => {
      lessons.push(number);
      const item = byId.get(`g${page.grade}-0${number}`);
      const optional = routes[item.entry].filter(step => step.optional).map(step => escapeHtml(step.title));
      return `<h3 id="lesson-${number}">第 ${number} 課｜${escapeHtml(item.title)}</h3>\n<p><strong>建議節數</strong> ${item.periods} 節</p>\n${assessment(item)}\n<p><strong>選做活動</strong> ${optional.join('、')}</p>\n<p><a href="${item.resources.records}">開啟本課學習紀錄 ↗</a></p>`;
    });
  }
  if (page.kind === 'records') {
    const ids = new Set();
    html = html.replace(/<h3>[^<]+<\/h3>\s*<!-- assessment:(g[78]-0[1-6]) -->\s*([\s\S]*?)(?=<h[23][ >]|$)/g, (_, id, content) => {
      if (!byId.has(id) || ids.has(id) || !content.includes('<table>')) throw new Error(`${id} 的學習紀錄缺漏或重複。`);
      ids.add(id);
      const item = byId.get(id);
      return `<div class="lesson-record" id="${id}">\n<h3>第 ${item.lesson} 課｜${escapeHtml(item.title)}</h3>\n${assessment(item)}\n${content.trimEnd()}\n</div>\n`;
    });
    if (ids.size !== modules.length) throw new Error('學習紀錄應包含每一課。');
  }
  if (page.kind === 'alignment') {
    html = html.replace(/(<a href="(1150[78]0[1-6]\.html)">)[^<]*(<\/a>)/g,
      (_, start, entry, end) => `${start}${Number(entry[6])} ${escapeHtml(byPage[entry].title)}${end}`);
  }
  html = html.replace(/<table>([\s\S]*?)<\/table>/g, '<div class="lesson-table-scroll"><table>$1</table></div>');
  html = html.replace(/href="([A-Z0-9_]+\.md)(#[^"]*)?"/g, (whole, file, hash = '') =>
    pageFor[file] ? `href="${pageFor[file]}${hash}"` : whole);

  const navigation = sections.map(section =>
    `<a href="#${section.id}">${escapeHtml(section.label)}</a>`).join('\n                ');
  const lessonNavigation = lessons.length ? `
            <p class="lesson-nav__title lesson-nav__title--sub">逐課教學安排</p>
            <div class="lesson-nav__links">
                ${lessons.map(number => `<a href="#lesson-${number}">第 ${number} 課</a>`).join('\n                ')}
            </div>` : '';

  const isPlan = page.kind === 'lesson-plan';
  const units = gradeModules(page.grade);
  const totalPeriods = periodsFor(units);
  const planLength = `${units.length} 單元・建議 ${totalPeriods} 節`;
  const summary = isPlan ? `${page.summary}｜${planLength}` : page.summary;
  if (isPlan) html = html.replace('<!-- grade-periods -->', `${planLength}，每節約 45 分鐘。`);
  const gradeName = isPlan ? (page.grade === 7 ? '七' : '八') : '';
  const topLinks = isPlan
    ? `<a class="lesson-hero__link" href="${page.course}">前往${gradeName}年級課程 →</a>`
    : `<a class="lesson-hero__link" href="index.html#teacher-resources">教學資源 →</a>`;
  const footerLink = isPlan
    ? `<a href="${page.companion}">查看${page.grade === 7 ? '八' : '七'}年級教案 →</a>`
    : `<a href="${page.kind === 'records' ? 'curriculum-alignment.html">查看 108 課綱對照' : 'student-records.html">查看學生學習紀錄表'} →</a>`;
  const description = isPlan
    ? `${title}｜${planLength}`
    : `${title}：${page.summary}`;
  const bodyClass = isPlan && page.grade === 8 ? 'site-course site-course--g8 lesson-page' : 'site-course lesson-page';

  const document = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapeHtml(description)}">
    <title>${escapeHtml(title)}｜資訊科技課程教材</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="site-theme.css">
    <link rel="stylesheet" href="lesson-plan.css">
</head>
<body class="${bodyClass}">
    <header class="lesson-hero">
        <div class="lesson-hero__inner">
            <div class="lesson-hero__top">
                <a class="lesson-hero__link" href="index.html">← 返回網站首頁</a>
                ${topLinks}
            </div>
            <h1>${escapeHtml(title)}</h1>
            <p class="lesson-hero__summary">${escapeHtml(summary)}</p>
        </div>
    </header>
    <main class="lesson-shell">
        <nav class="lesson-nav" aria-label="${isPlan ? '教案章節' : '文件章節'}">
            <p class="lesson-nav__title">${isPlan ? '教案目錄' : '目錄'}</p>
            <div class="lesson-nav__links">
                ${navigation}
            </div>${lessonNavigation}
        </nav>
        <article class="lesson-content" aria-label="${escapeHtml(title)}">
${page.kind === 'records' ? '<p id="copy-status" class="copy-status" role="status"></p>\n' : ''}${html.trimEnd()}
        </article>
    </main>
    <footer class="lesson-footer">
        <div class="lesson-footer__inner">
            <span>115 學年度資訊科技課程教材・內容同步自 ${page.source}</span>
            ${footerLink}
        </div>
    </footer>${page.kind === 'records' ? copyTableScript : ''}
</body>
</html>
`;
  outputs.set(page.output, document);
}

for (const [file, content] of outputs) {
  if (fs.existsSync(path.join(root, file)) && read(file) === content) continue;
  if (check) {
    console.error(`${file} 尚未同步。請執行 npm run build:lesson-plans。`);
    process.exitCode = 1;
  } else {
    fs.writeFileSync(path.join(root, file), content, 'utf8');
    process.stdout.write(`Built ${file}\n`);
  }
}
