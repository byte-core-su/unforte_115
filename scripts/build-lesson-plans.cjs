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
routeContext.window.LessonAssessments = Object.fromEntries(modules.map(item => [item.entry, { activity: item.activity, records: item.resources.records, successCriteria: item.successCriteria }]));
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
    summary: '積木程式結構、迴圈、變數與防禦網專題'
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
    summary: '七、八年級各 6 份紀錄表。選一課，就能開啟該課的完整紀錄表。'
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

function evidenceList(items) {
  return `<ul class="evidence-list" role="list">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function assessment(item) {
  return `<p><strong>必交項目</strong></p>\n${evidenceList(item.evidence)}\n<p><strong>怎樣算達標</strong> ${escapeHtml(item.successCriteria)}</p>`;
}

function overviewCards(grade) {
  return gradeModules(grade).map(({ lesson, title, periods, entry, evidence }) => `                <li class="course-overview__item">
                    <a class="course-overview__card" href="${entry}" aria-labelledby="overview-number-${lesson} overview-lesson-${lesson}">
                        <div class="course-overview__meta">
                            <span id="overview-number-${lesson}">第 ${lesson} 課</span>
                            <span>建議 ${periods} 節</span>
                        </div>
                        <h3 id="overview-lesson-${lesson}">${escapeHtml(title)}</h3>
                        <div class="course-overview__work">
                            <p>必交項目</p>
                            ${evidenceList(evidence)}
                        </div>
                        <span class="course-overview__open" aria-hidden="true">進入第 ${lesson} 課 →</span>
                    </a>
                </li>`).join('\n');
}

function overviewScenarios(grade) {
  return gradeModules(grade).map(({ lesson }) => `                <li><strong data-scenario-text="cards.${lesson - 1}.title"></strong><p data-scenario-text="cards.${lesson - 1}.description"></p></li>`).join('\n');
}

function activityQuestions({ questions }) {
  return `<p><strong>操作前先猜</strong> ${escapeHtml(questions.before)}</p>\n<p><strong>操作中觀察</strong> ${escapeHtml(questions.during)}</p>\n<p><strong>做完後說明</strong> ${escapeHtml(questions.after)}</p>`;
}

const byPage = {};
let map = read('curriculum-map.html');
const teacherCards = new Map();
for (const item of modules) {
  const { id, entry, title, goal, periods, tags, evidence, successCriteria, resources } = item;
  if (!Array.isArray(evidence) || !evidence.length || evidence.some(entry => typeof entry !== 'string' || !entry.trim()) || !successCriteria?.trim()) {
    throw new Error(`${id} 缺少必交項目或達標條件。`);
  }
  const { lessonPlan, records } = resources;
  if (lessonPlan !== `lesson-plan-grade-${item.grade}.html#lesson-${item.lesson}` || records !== `student-record-${id}.html`) {
    throw new Error(`${id} 的教案或學習紀錄連結與課次不符。`);
  }
  if (!title?.trim() || !goal?.trim() || !Number.isInteger(periods) || periods < 1) throw new Error(`${id} 的課名、目標或節數無效。`);
  const sequence = gradeModules(item.grade);
  const previous = sequence[sequence.indexOf(item) - 1]?.entry;
  const next = sequence[sequence.indexOf(item) + 1]?.entry;
  const overview = `1150${item.grade}00.html`;
  byPage[entry] = { title, goal, periods, evidence, successCriteria, lessonPlan, records, overview, previous, next, activity: item.activity };
  const card = new RegExp(`(<li><a href="${entry.replace('.', '\\.')}">[^\\n]*?<h4>)[^<]*(</h4><p>)[^<]*(</p><!-- map-evidence -->)[^\\n]*?(<!-- /map-evidence -->)`, 'g');
  if ([...map.matchAll(card)].length !== 1) throw new Error(`${id} 應有一張成果卡片。`);
  map = map.replace(card, (_, start, meta, work, end) => `${start}${escapeHtml(title)}${meta}${escapeHtml(tags.join(' · '))} · 建議 ${periods} 節${work}<div class="map-evidence"><strong>必交項目</strong>${evidenceList(evidence)}</div>${end}`);
  teacherCards.set(entry, `<div class="teacher-map__links" role="group" aria-label="第 ${item.lesson} 課資源">
                        <a href="${lessonPlan}">教案</a>
                        <a href="${entry}">教材</a>
                        <a href="${records}">紀錄表</a>
                    </div>`);
}
outputs.set('lesson-assessments.js', '// Generated from modules/ by npm run build:lesson-plans.\nwindow.LessonAssessments = ' + JSON.stringify(byPage, null, 2) + ';\n');
outputs.set('curriculum-map.html', map);

// Reuse the complete concept map, including the grade-specific relations, on the teacher page.
const mapSection = map.match(/<section id="course-map"[\s\S]*?<\/section>/)?.[0];
if (!mapSection) throw new Error('找不到課程地圖。');
const teacherMap = mapSection
  .replace('class="curriculum-map"', 'class="curriculum-map teacher-map"')
  .replace('七、八年級單元關聯', '課程地圖')
  .replace('每年級 6 個單元，每單元建議 2 節。點選單元開啟教材。', '先選年級。用單元圖卡找教案、教材和紀錄表，或切到概念關聯圖看各課如何銜接。')
  .replace('name="course-map-view" checked', 'name="course-map-view"')
  .replace('id="course-map-cards" type="radio" name="course-map-view"', 'id="course-map-cards" type="radio" name="course-map-view" checked')
  .replace('>成果卡片</label>', '>單元圖卡</label>')
  .replace(/<li><a href="(1150[78]0[1-6]\.html)">([^\n]+)<\/a><\/li>/g,
    (_, entry, body) => `<li><a class="teacher-map__lesson" href="${entry}">${body}</a>${teacherCards.get(entry)}</li>`);
const teacherPage = 'teacher-resources.html';
const teacherTemplate = read(teacherPage);
const teacherSlot = /(<!-- teacher-course-map -->)[\s\S]*?(<!-- \/teacher-course-map -->)/;
if (!teacherSlot.test(teacherTemplate)) throw new Error('教師備課頁缺少課程地圖位置。');
outputs.set(teacherPage, teacherTemplate.replace(teacherSlot, (_, start, end) => `${start}\n        ${teacherMap}\n        ${end}`));

const deckFile = 'presentations/20261110.html';
const [seven, eight] = [7, 8].map(grade => periodsFor(gradeModules(grade)));
const deckPeriods = seven === eight ? `建議各 ${seven} 節` : `建議七年級 ${seven} 節、八年級 ${eight} 節`;
outputs.set(deckFile, read(deckFile).replace(/(<span data-course-periods>)[^<]*(<\/span>)/, `$1${deckPeriods}$2`));

for (const grade of [7, 8]) for (let lesson = 0; lesson <= 6; lesson++) {
  const entry = `1150${grade}0${lesson}.html`;
  const source = lesson ? read(entry) : read(entry)
    .replace(/(<!-- overview-cards -->)[\s\S]*?(<!-- \/overview-cards -->)/,
      (_, start, end) => `${start}\n${overviewCards(grade)}\n                ${end}`)
    .replace(/(<!-- overview-scenarios -->)[\s\S]*?(<!-- \/overview-scenarios -->)/,
      (_, start, end) => `${start}\n${overviewScenarios(grade)}\n                ${end}`);
  const html = source.replace(/<([a-z][\w-]*)\b([^>]*\bdata-scenario-text="([\w.]+)"[^>]*)>[\s\S]*?<\/\1>/gi, (whole, tag, attrs, key) => {
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
            const heading = record ? document.querySelector('h1').textContent.trim() : (() => {
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
                if (record) {
                    copy.querySelector('.copy-table-button')?.remove();
                    const title = document.createElement('h2');
                    title.textContent = heading;
                    copy.prepend(title);
                }
                const asText = table => [...table.rows].map(row => [...row.cells].map(cell => cell.textContent.trim()).join('\\t')).join('\\n');
                const plain = record ? [...copy.children].map(node => {
                    const table = node.querySelector('table');
                    if (table) return asText(table);
                    if (node.matches('ul')) return [...node.children].map(item => '• ' + item.textContent.trim()).join('\\n');
                    return node.textContent.trim();
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
            if (record) wrapper.prepend(button);
            else wrapper.before(button);
        });
    })();
    </script>`;

const recordBodies = new Map();
const recordsSource = 'STUDENT_RECORDS.md';
const recordsIndexMarkdown = read(recordsSource).replace(/^### [^\n]+\n<!-- assessment:(g[78]-0[1-6]) -->\s*([\s\S]*?)(?=^#{2,3} |$(?![\s\S]))/gm,
  (_, id, content) => {
    if (!byId.has(id) || recordBodies.has(id)) throw new Error(`${id} 的學習紀錄缺漏或重複。`);
    const html = marked.parse(content.trim(), { gfm: true }).trimEnd();
    if (!html.includes('<table>')) throw new Error(`${id} 的學習紀錄缺少表格。`);
    recordBodies.set(id, html);
    return '';
  });
if (recordBodies.size !== modules.length) throw new Error('學習紀錄應包含每一課。');

for (const page of [...pages, ...modules.map(item => ({ kind: 'record', source: recordsSource, item }))]) {
  const { item } = page;
  const grade = item?.grade ?? page.grade;
  const gradeName = grade === 7 ? '七' : '八';
  const markdown = page.kind === 'records' ? recordsIndexMarkdown : item ? '' : read(page.source);
  const match = /^# (.+)\r?\n/.exec(markdown);
  if (!item && !match) throw new Error(`${page.source} must begin with an H1 title`);
  const title = item ? `${gradeName}年級第 ${item.lesson} 課｜${item.title}` : match[1];
  const sections = [];
  const lessons = [];
  let html = item
    ? `<div class="lesson-record" id="${item.id}">\n${assessment(item)}${item.activity ? `\n${activityQuestions(item.activity)}` : ''}\n${recordBodies.get(item.id)}\n</div>`
    : marked.parse(markdown.slice(match[0].length), { gfm: true });
  if (page.kind === 'records') {
    for (const [number, label] of [[7, '七年級'], [8, '八年級']]) {
      const links = gradeModules(number).map(unit =>
        `<li id="${unit.id}"><a href="${unit.resources.records}"><span>第 ${unit.lesson} 課</span><strong>${escapeHtml(unit.title)}</strong></a></li>`);
      html = html.replace(`<h2>${label}</h2>`, `<h2>${label}</h2>\n<ul class="lesson-record-links" id="grade-${number}" role="list">\n${links.join('\n')}\n</ul>`);
    }
  }
  html = html.replace(/<h2>(.*?)<\/h2>/g, (_, label) => {
    const id = `section-${sections.length + 1}`;
    sections.push({ id, label: label.replace(/<[^>]*>/g, '') });
    return `<h2 id="${id}">${label}</h2>`;
  });
  if (page.kind === 'records') {
    const instructions = html.match(/<h2 id="section-1">([^<]+)<\/h2>\n([\s\S]*?)(?=<h2 id="section-2">)/);
    if (!instructions) throw new Error('學習紀錄表目錄缺少填寫說明。');
    const [section, label, content] = instructions;
    html = html.replace(section, '') + `\n<details id="section-1" class="lesson-record-help"><summary>${label}</summary>\n${content}</details>`;
    sections.push(sections.shift());
  }
  if (page.kind === 'lesson-plan') {
    // Stable anchors so each unit page can open its own lesson: lesson-plan-grade-7.html#lesson-3
    html = html.replace(/<h3>第 ([1-6]) 課[^<]*<\/h3>/g, (_, number) => {
      lessons.push(number);
      const item = byId.get(`g${page.grade}-0${number}`);
      const optional = routes[item.entry].filter(step => step.optional).map(step => escapeHtml(step.title));
      const activity = item.activity ? `\n<p><strong>網頁示範</strong> ${escapeHtml(item.activity.preview)}</p>\n<p><strong>積木程式實作</strong> ${escapeHtml(item.activity.practice)}</p>\n${activityQuestions(item.activity)}` : '';
      return `<h3 id="lesson-${number}">第 ${number} 課｜${escapeHtml(item.title)}</h3>\n<p><strong>建議節數</strong> ${item.periods} 節</p>\n${assessment(item)}\n<p><strong>選做活動</strong> ${optional.join('、')}</p>\n<p><a href="${item.resources.records}">開啟本課學習紀錄 ↗</a></p>${activity}`;
    });
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
  const summary = item ? '學習紀錄表。教師可複製這一課的要求與表格，貼到班級平台的線上作業。'
    : isPlan ? `${page.summary}｜${planLength}` : page.summary;
  if (isPlan) html = html.replace('<!-- grade-periods -->', `${planLength}，每節約 45 分鐘。`);
  const topLinks = item
    ? `<a class="lesson-hero__link" href="${item.entry}">回到本課教材 →</a>`
    : isPlan
    ? `<a class="lesson-hero__link" href="${page.course}">前往${gradeName}年級課程 →</a>`
    : `<a class="lesson-hero__link" href="teacher-resources.html">教師備課 →</a>`;
  const footerLink = item
    ? `<a href="${item.resources.lessonPlan}">查看本課教案 →</a>`
    : isPlan
    ? `<a href="${page.companion}">查看${page.grade === 7 ? '八' : '七'}年級教案 →</a>`
    : `<a href="${page.kind === 'records' ? 'curriculum-alignment.html">查看 108 課綱對照' : 'student-records.html">查看學生學習紀錄表'} →</a>`;
  const description = isPlan
    ? `${title}｜${planLength}`
    : `${title}｜${summary}`;
  const backLink = item
    ? '<a class="lesson-hero__link" href="student-records.html">← 學習紀錄表目錄</a>'
    : isPlan
      ? '<a class="lesson-hero__link" href="teacher-resources.html">← 回到教師備課</a>'
      : '<a class="lesson-hero__link" href="index.html">← 返回網站首頁</a>';
  const bodyClass = grade === 8 ? 'site-course site-course--g8 lesson-page' : 'site-course lesson-page';

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
                ${backLink}
                ${topLinks}
            </div>
            <h1>${escapeHtml(title)}</h1>
            <p class="lesson-hero__summary">${escapeHtml(summary)}</p>
        </div>
    </header>
    <main class="lesson-shell">${navigation ? `
        <nav class="lesson-nav" aria-label="${isPlan ? '教案章節' : '文件章節'}">
            <p class="lesson-nav__title">${isPlan ? '教案目錄' : '目錄'}</p>
            <div class="lesson-nav__links">
                ${navigation}
            </div>${lessonNavigation}
        </nav>` : ''}
        <article class="lesson-content" aria-label="${escapeHtml(title)}">
${page.kind === 'records' || item ? '<p id="copy-status" class="copy-status" role="status"></p>\n' : ''}${html.trimEnd()}
        </article>
    </main>
    <footer class="lesson-footer">
        <div class="lesson-footer__inner">
            <span>115 學年度資訊科技課程教材・內容同步自 ${page.source}</span>
            ${footerLink}
        </div>
    </footer>${page.kind === 'records' || item ? copyTableScript : ''}
</body>
</html>
`;
  outputs.set(item?.resources.records ?? pageFor[page.source], document);
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
