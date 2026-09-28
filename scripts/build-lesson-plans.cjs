// Render the Markdown lesson plans as static, printable pages for GitHub Pages.
// Run `npm install` once, then `npm run build:lesson-plans` after editing a plan.
const fs = require('node:fs');
const path = require('node:path');
const { marked } = require(process.argv[2] || 'marked');

const root = path.resolve(__dirname, '..');
const pages = [
  {
    grade: 7,
    source: 'LESSON_PLAN_GRADE_7.md',
    output: 'lesson-plan-grade-7.html',
    course: '1150700.html',
    companion: 'lesson-plan-grade-8.html',
    summary: 'Scratch 程式結構、迴圈、變數與防禦網專題｜6 單元・建議 12 節'
  },
  {
    grade: 8,
    source: 'LESSON_PLAN_GRADE_8.md',
    output: 'lesson-plan-grade-8.html',
    course: '1150800.html',
    companion: 'lesson-plan-grade-7.html',
    summary: '清單資料追蹤、搜尋排序與模組化對決｜6 單元・建議 12 節'
  }
];

const escapeHtml = value => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

for (const page of pages) {
  const markdown = fs.readFileSync(path.join(root, page.source), 'utf8');
  const match = /^# (.+)\r?\n/.exec(markdown);
  if (!match) throw new Error(`${page.source} must begin with an H1 title`);
  const title = match[1];
  const sections = [];
  let html = marked.parse(markdown.slice(match[0].length), { gfm: true });
  html = html.replace(/<h2>(.*?)<\/h2>/g, (_, label) => {
    const id = `section-${sections.length + 1}`;
    sections.push({ id, label: label.replace(/<[^>]*>/g, '') });
    return `<h2 id="${id}">${label}</h2>`;
  });
  html = html.replace(/<table>([\s\S]*?)<\/table>/g, '<div class="lesson-table-scroll"><table>$1</table></div>');
  html = html.replace(/href="(CURRICULUM_ALIGNMENT|STUDENT_RECORDS)\.md"/g,
    (_, name) => `href="https://github.com/byte-core-su/unforte_115/blob/main/${name}.md" target="_blank" rel="noopener noreferrer"`);

  const navigation = sections.map(section =>
    `<a href="#${section.id}">${escapeHtml(section.label)}</a>`).join('\n                ');
  const document = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapeHtml(title)}：6 單元、建議 12 節的 Scratch 資訊科技教學安排。">
    <title>${escapeHtml(title)}｜資訊科技課程教材</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="site-theme.css">
    <link rel="stylesheet" href="lesson-plan.css">
</head>
<body class="site-course${page.grade === 8 ? ' site-course--g8' : ''} lesson-page">
    <header class="lesson-hero">
        <div class="lesson-hero__inner">
            <div class="lesson-hero__top">
                <a class="lesson-hero__link" href="index.html">← 返回網站首頁</a>
                <a class="lesson-hero__link" href="${page.course}">前往${page.grade === 7 ? '七' : '八'}年級課程 →</a>
            </div>
            <h1>${escapeHtml(title)}</h1>
            <p class="lesson-hero__summary">${escapeHtml(page.summary)}</p>
        </div>
    </header>
    <main class="lesson-shell">
        <nav class="lesson-nav" aria-label="教案章節">
            <p class="lesson-nav__title">教案目錄</p>
            <div class="lesson-nav__links">
                ${navigation}
            </div>
        </nav>
        <article class="lesson-content" aria-label="${escapeHtml(title)}">
${html.trimEnd()}
        </article>
    </main>
    <footer class="lesson-footer">
        <div class="lesson-footer__inner">
            <span>115 學年度資訊科技課程教材・內容同步自 ${page.source}</span>
            <a href="${page.companion}">查看${page.grade === 7 ? '八' : '七'}年級教案 →</a>
        </div>
    </footer>
</body>
</html>
`;
  fs.writeFileSync(path.join(root, page.output), document, 'utf8');
  process.stdout.write(`Built ${page.output}\n`);
}
