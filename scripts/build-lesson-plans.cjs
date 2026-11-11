// Render the Markdown teaching documents as static, printable pages.
// Run `npm install` once, then `npm run build:lesson-plans` after editing any source below.
const fs = require('node:fs');
const path = require('node:path');
const { marked } = require(process.argv[2] || 'marked');

const root = path.resolve(__dirname, '..');

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
    summary: 'Scratch 程式結構、迴圈、變數與防禦網專題｜6 單元・建議 12 節'
  },
  {
    kind: 'lesson-plan',
    grade: 8,
    source: 'LESSON_PLAN_GRADE_8.md',
    course: '1150800.html',
    companion: 'lesson-plan-grade-7.html',
    summary: '清單資料追蹤、搜尋排序與模組化對決｜6 單元・建議 12 節'
  },
  {
    kind: 'records',
    source: 'STUDENT_RECORDS.md',
    summary: '選一課的表格按「複製表格」，貼到班級平台的線上文件或作業，讓每位學生填寫自己的副本。'
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

// Lets a teacher paste one table into Google Docs, Word or a class platform as a real table.
const copyTableScript = `
    <script>
    (() => {
        const status = document.getElementById('copy-status');
        document.querySelectorAll('.lesson-table-scroll').forEach((wrapper, index) => {
            const table = wrapper.querySelector('table');
            const heading = (() => {
                for (let node = wrapper.previousElementSibling; node; node = node.previousElementSibling) {
                    if (/^H[23]$/.test(node.tagName)) return node.textContent.trim();
                }
                return '表格 ' + (index + 1);
            })();
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'copy-table-button';
            button.textContent = '複製表格';
            button.setAttribute('aria-label', '複製「' + heading + '」表格');
            button.addEventListener('click', async () => {
                const plain = [...table.rows].map(row => [...row.cells].map(cell => cell.textContent.trim()).join('\\t')).join('\\n');
                try {
                    await navigator.clipboard.write([new ClipboardItem({
                        'text/html': new Blob([table.outerHTML], { type: 'text/html' }),
                        'text/plain': new Blob([plain], { type: 'text/plain' })
                    })]);
                    status.textContent = '已複製「' + heading + '」，可貼到線上文件或作業。';
                } catch {
                    const range = document.createRange();
                    range.selectNode(table);
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
            wrapper.before(button);
        });
    })();
    </script>`;

for (const page of pages) {
  page.output = pageFor[page.source];
  const markdown = fs.readFileSync(path.join(root, page.source), 'utf8');
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
    html = html.replace(/<h3>(第 ([1-6]) 課[\s\S]*?)<\/h3>/g, (_, label, number) => {
      lessons.push(number);
      return `<h3 id="lesson-${number}">${label}</h3>`;
    });
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
  const gradeName = isPlan ? (page.grade === 7 ? '七' : '八') : '';
  const topLinks = isPlan
    ? `<a class="lesson-hero__link" href="${page.course}">前往${gradeName}年級課程 →</a>`
    : `<a class="lesson-hero__link" href="index.html#teacher-resources">教學資源 →</a>`;
  const footerLink = isPlan
    ? `<a href="${page.companion}">查看${page.grade === 7 ? '八' : '七'}年級教案 →</a>`
    : `<a href="${page.kind === 'records' ? 'curriculum-alignment.html">查看 108 課綱對照' : 'student-records.html">查看學生學習紀錄表'} →</a>`;
  const description = isPlan
    ? `${title}：6 單元、建議 12 節的 Scratch 資訊科技教學安排。`
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
            <p class="lesson-hero__summary">${escapeHtml(page.summary)}</p>
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
  fs.writeFileSync(path.join(root, page.output), document, 'utf8');
  process.stdout.write(`Built ${page.output}\n`);
}
