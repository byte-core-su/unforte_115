const fs = require('node:fs');
const path = require('node:path');
const { inflateRawSync } = require('node:zlib');
const materials = require('../course-materials.json');
const catalog = require('../course-scenarios.js');

const requireValue = (condition, message) => { if (!condition) throw new Error(message); };

// Read standard stored/deflated ZIP entries in memory; never unpack files to disk.
function openZip(buffer) {
  let end = buffer.length - 22;
  const first = Math.max(0, end - 0xffff);
  for (; end >= first; end--) {
    if (buffer.readUInt32LE(end) === 0x06054b50 && end + 22 + buffer.readUInt16LE(end + 20) === buffer.length) break;
  }
  requireValue(end >= first, '找不到 ZIP 中央目錄');
  const total = buffer.readUInt16LE(end + 10);
  const offset = buffer.readUInt32LE(end + 16);
  const limit = offset + buffer.readUInt32LE(end + 12);
  requireValue(buffer.readUInt32LE(end + 4) === 0 && buffer.readUInt16LE(end + 8) === total && total < 0xffff && limit <= end, '不支援的 ZIP 格式');
  const entries = new Map();
  let cursor = offset;
  for (let index = 0; index < total; index++) {
    requireValue(cursor + 46 <= limit && buffer.readUInt32LE(cursor) === 0x02014b50, 'ZIP 目錄項目無效');
    const nameEnd = cursor + 46 + buffer.readUInt16LE(cursor + 28);
    const next = nameEnd + buffer.readUInt16LE(cursor + 30) + buffer.readUInt16LE(cursor + 32);
    requireValue(next <= limit, 'ZIP 目錄項目超出範圍');
    const name = buffer.toString('utf8', cursor + 46, nameEnd);
    requireValue(!entries.has(name), `ZIP 內有重複路徑：${name}`);
    entries.set(name, {
      flags: buffer.readUInt16LE(cursor + 8), method: buffer.readUInt16LE(cursor + 10),
      compressed: buffer.readUInt32LE(cursor + 20), size: buffer.readUInt32LE(cursor + 24),
      header: buffer.readUInt32LE(cursor + 42)
    });
    cursor = next;
  }
  return {
    has: name => entries.has(name),
    read(name) {
      const entry = entries.get(name);
      requireValue(entry, `ZIP 內找不到 ${name}`);
      const { flags, method, compressed, size, header } = entry;
      requireValue(!(flags & 1) && [0, 8].includes(method) && size <= 32 * 1024 * 1024, `不支援讀取 ZIP 項目：${name}`);
      requireValue(header + 30 <= offset && buffer.readUInt32LE(header) === 0x04034b50, `ZIP 項目標頭無效：${name}`);
      const start = header + 30 + buffer.readUInt16LE(header + 26) + buffer.readUInt16LE(header + 28);
      requireValue(start + compressed <= offset, `ZIP 項目超出資料範圍：${name}`);
      const raw = buffer.subarray(start, start + compressed);
      const data = method === 0 ? raw : inflateRawSync(raw, { maxOutputLength: Math.max(1, size) });
      requireValue(data.length === size, `ZIP 項目大小不符：${name}`);
      return data;
    }
  };
}

function inspectMaterials({ root = path.resolve(__dirname, '..'), registry = materials, scenarios = catalog.scenarios } = {}) {
  const errors = [], warnings = [], checked = [];
  const readFile = name => {
    const file = path.resolve(root, name);
    const relative = path.relative(root, file);
    requireValue(relative && !relative.startsWith('..') && !path.isAbsolute(relative), `資源必須是專案內路徑：${name}`);
    requireValue(fs.existsSync(file) && fs.statSync(file).isFile(), `找不到資源：${name}`);
    return fs.readFileSync(file);
  };
  const readText = name => readFile(name).toString('utf8');
  const hasId = (html, id) => html.includes(`id="${id}"`);
  const includesAll = (actual, expected, label, check) => {
    for (const value of expected ?? []) check(actual.includes(value), `${label}缺少「${value}」`);
  };
  const checkAssets = (project, zip, check) => {
    const assets = new Set(project.targets.flatMap(target => [...target.costumes, ...target.sounds].map(asset => asset.md5ext)));
    for (const asset of assets) check(zip.has(asset), `Scratch 缺少造型／音效檔：${asset}`);
    return assets.size;
  };

  for (const [profile, lessons] of Object.entries(registry)) {
    const scenario = scenarios[profile];
    if (!scenario) { errors.push(`找不到情境設定：${profile}`); continue; }
    for (const [page, material] of Object.entries(lessons)) {
      const key = `${profile}/${page}`;
      const check = (condition, message) => { if (!condition) errors.push(`${key}：${message}`); };
      const warn = (code, message) => warnings.push({ key, code, message });
      try {
        const { grade, lesson, overview, animation, scratch, lessonPlan, record, presentation } = material;
        const archive = scenario.grades[grade].archive;
        check(page === `1150${grade}0${lesson}.html`, '年級與課號不符');
        const html = readText(page);
        const overviewHtml = readText(overview);
        check(html.includes('src="course-scenarios.js"'), '課程頁未載入情境設定');
        check(overviewHtml.includes('data-scenario-download'), '總覽未接入情境下載路徑');
        check(overviewHtml.includes(page) || overviewHtml.includes('openLesson(${lesson.id})'), '總覽沒有單元入口');
        const config = animation.config.split('.').reduce((value, part) => value?.[part], scenario);
        check(Boolean(config), `找不到動畫對應設定 ${animation.config}`);
        for (const id of animation.hostIds) check(hasId(html, id), `找不到動畫區塊 #${id}`);
        for (const name of animation.functions) check(html.includes(`function ${name}(`), `找不到動畫入口 ${name}`);

        const sb3 = openZip(openZip(readFile(archive)).read(scratch.entry));
        const project = JSON.parse(sb3.read('project.json').toString('utf8'));
        const stage = project.targets.find(target => target.isStage);
        requireValue(stage, 'Scratch 專案缺少舞台');
        check(scratch.role === 'reference', '試行清單中的 Scratch 檔應標示為參考範例');
        includesAll(project.targets.map(target => target.name), scratch.sprites, 'Scratch 角色', check);
        includesAll(Object.values(stage.variables).map(([name]) => name), scratch.stageVariables, '舞台變數', check);
        includesAll(Object.values(stage.lists).map(([name]) => name), scratch.stageLists, '舞台清單', check);
        includesAll(Object.values(stage.broadcasts), scratch.broadcasts, '舞台廣播', check);
        const assets = checkAssets(project, sb3, check);
        let demo;
        if (scratch.demo) {
          check(scratch.demo.role === 'assessment-demo', '模組化示範的用途標記錯誤');
          check(html.includes(`href="${scratch.demo.file}"`), '課程頁未連結模組化示範');
          const demoZip = openZip(readFile(scratch.demo.file));
          demo = JSON.parse(demoZip.read('project.json').toString('utf8'));
          checkAssets(demo, demoZip, check);
          const demoStage = demo.targets.find(target => target.isStage);
          includesAll(Object.values(demoStage?.lists ?? {}).map(([name]) => name), [...scratch.stageLists, '對決紀錄'], '示範清單', check);
          const blocks = demo.targets.flatMap(target => Object.values(target.blocks));
          const definitions = blocks.filter(block => block?.opcode === 'procedures_prototype').map(block => block.mutation.proccode);
          const expected = scenario.duel.modules;
          check(definitions.length === expected.length && expected.every(name => definitions.includes(name)), '示範必須提供教案指定的四個自訂積木');
        }

        if (scratch.costumeMapping) {
          const { count, sprites } = scratch.costumeMapping;
          const grades = html.match(/const grades = (\[[^\r\n]+\]);/)?.[1];
          requireValue(grades, '找不到網頁裝備等級順序');
          const gradeOrder = JSON.parse(grades);
          const webOrder = scenario.duel.types.flatMap(type => gradeOrder.map(value => `${type.replace(/^[^\p{L}\p{N}]+/u, '')}${value}`));
          check(webOrder.length === count, '網頁裝備項目數與造型編號數不符');
          const mismatches = [];
          for (const sprite of sprites) {
            const target = project.targets.find(item => item.name === sprite);
            check(target?.costumes.length >= count, `${sprite}缺少對應的造型`);
            if (!target) continue;
            const mismatch = webOrder.findIndex((name, index) => target.costumes[index]?.name !== name);
            if (mismatch !== -1) {
              mismatches.push(`${sprite}造型 ${mismatch + 1}：網頁「${webOrder[mismatch]}」，Scratch「${target.costumes[mismatch]?.name ?? '缺少'}」`);
            }
            if (demo) {
              const demoCostumes = demo.targets.find(item => item.name === sprite)?.costumes ?? [];
              check(demoCostumes.length >= count && webOrder.every((name, index) => demoCostumes[index]?.name === name), `${sprite}的示範造型編號未與網頁同步`);
            }
          }
          if (mismatches.length) warn('costume-order', `${mismatches.join('；')}。`);
        }

        const source = readText(lessonPlan.source);
        const planHtml = readText(lessonPlan.html);
        const start = planHtml.indexOf(`id="${lessonPlan.sectionId}"`);
        const end = planHtml.indexOf(`id="${lessonPlan.assessmentId}"`);
        check(source.split(/\r?\n/).includes(`### ${lessonPlan.heading}`), '教案 Markdown 缺少指定單元標題');
        const headingTag = new RegExp(`<h3(?: id="lesson-[1-6]")?>${lessonPlan.heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h3>`);
        check(start !== -1 && end > start && headingTag.test(planHtml.slice(start, end)), 'HTML 教案與指定單元或評量段落不符');
        check(readText(record.file).split(/\r?\n/).includes(`## ${record.heading}`), '學習紀錄表缺少指定段落');

        const deck = readText(presentation.file);
        for (const { fragment, kind, text } of presentation.references) {
          const marker = deck.indexOf(`id="${fragment}"`);
          const boundary = deck.indexOf(kind === 'slide' ? '</section>' : '</table>', marker);
          check(marker !== -1 && boundary > marker && deck.slice(marker, boundary).includes(text), `簡報位置 #${fragment} 未包含「${text}」`);
        }
        checked.push({ key, archive, entry: scratch.entry, assets, demo: scratch.demo?.file });
      } catch (error) { errors.push(`${key}：${error.message}`); }
    }
  }
  return { checked, errors, warnings };
}

if (require.main === module) {
  const { checked, errors, warnings } = inspectMaterials();
  for (const item of checked) console.log(`${item.key}：${item.archive} → ${item.entry}（${item.assets} 個 Scratch 造型／音效資源）`);
  for (const item of checked.filter(item => item.demo)) console.log(`模組化示範：${item.demo}，四個自訂積木及造型編號已核對。`);
  for (const item of warnings) console.warn(`待同步 ${item.key}：${item.message}`);
  for (const error of errors) console.error(`錯誤 ${error}`);
  console.log(`已檢查 ${checked.length} 課；${errors.length} 個缺漏或錯誤，${warnings.length} 個版本差異。`);
  process.exitCode = errors.length ? 1 : 0;
}

module.exports = { inspectMaterials, openZip };
