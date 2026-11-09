// Build the editable Scratch 3 demonstration from the existing reference art.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { deflateRawSync } = require('node:zlib');
const { openZip } = require('./check-course-materials.cjs');
const { scenarios } = require('../course-scenarios.js');
const { scratch } = require('../course-materials.json').space['1150806.html'];
const root = path.resolve(__dirname, '..');
const moduleNames = scenarios.space.duel.modules;

const variables = Object.fromEntries(Object.entries({
  busy: '執行中', scenario: '測試案例', stockCount: '庫存筆數', quota: '每隊件數',
  index: '抽取位置', item: '抽到的裝備', ready: '可分配', round: '對決回合',
  ours: '我方戰力', theirs: '外星戰力', outcome: '本回合結果', duplicate: '發現重複',
  wins: '勝場', losses: '敗場', ties: '平手'
}).map(([id, name]) => [id, [name, 0]]));
const lists = Object.fromEntries(Object.entries({
  stock: '裝備庫存', shuffled: '裝備分配', squad: '小隊裝備', enemy: '外星裝備',
  trace: '對決紀錄', seen: '已出現裝備'
}).map(([id, name]) => [id, [name, []]]));
const messages = { reset: '清除回合畫面', roundView: '逐回合展示' };

const block = (opcode, inputs = {}, fields = {}, mutation) => ({ opcode, inputs, fields, mutation });
const number = value => [4, String(value)];
const string = value => [10, value];
const variable = id => [12, variables[id][0], id];
const listField = id => ({ LIST: [lists[id][0], id] });
const varField = id => ({ VARIABLE: [variables[id][0], id] });
const set = (id, value) => block('data_setvariableto', { VALUE: value }, varField(id));
const increment = id => block('data_changevariableby', { VALUE: number(1) }, varField(id));
const clear = id => block('data_deletealloflist', {}, listField(id));
const add = (id, value) => block('data_addtolist', { ITEM: value }, listField(id));
const remove = (id, index) => block('data_deleteoflist', { INDEX: index }, listField(id));
const at = (id, index) => block('data_itemoflist', { INDEX: index }, listField(id));
const length = id => block('data_lengthoflist', {}, listField(id));
const contains = (id, value) => block('data_listcontainsitem', { ITEM: value }, listField(id));
const compare = (op, a, b) => block(`operator_${op}`, { OPERAND1: a, OPERAND2: b });
const repeat = (times, body) => block('control_repeat', { TIMES: times, SUBSTACK: body });
const branch = (condition, yes, no) => block(no ? 'control_if_else' : 'control_if', { CONDITION: condition, SUBSTACK: yes, ...(no ? { SUBSTACK2: no } : {}) });
const join = (...parts) => parts.map(part => typeof part === 'string' ? string(part) : part).reduce((a, b) => block('operator_join', { STRING1: a, STRING2: b }));
const log = (...parts) => add('trace', join(...parts));
const required = () => block('operator_multiply', { NUM1: number(2), NUM2: variable('quota') });
const broadcast = id => block('event_broadcastandwait', { BROADCAST_INPUT: [11, messages[id], id] });
const mutation = name => ({ tagName: 'mutation', children: [], proccode: name, argumentids: '[]', argumentnames: '[]', argumentdefaults: '[]', warp: 'false' });
const call = name => block('procedures_call', {}, {}, mutation(name));

class Scripts {
  blocks = {};
  comments = {};
  nextId = 0;

  emit(node, parent, position) {
    const id = `b${++this.nextId}`;
    const shadow = node.opcode === 'procedures_prototype';
    const result = { opcode: node.opcode, next: null, parent, inputs: {}, fields: node.fields, shadow, topLevel: Boolean(position), ...position };
    if (node.mutation) result.mutation = node.mutation;
    this.blocks[id] = result;
    for (const [key, value] of Object.entries(node.inputs)) {
      if (Array.isArray(value) && typeof value[0] === 'number') {
        result.inputs[key] = value[0] === 12 ? [3, value, string('')] : [1, value];
      } else if (Array.isArray(value)) {
        result.inputs[key] = [2, this.stack(value, id)];
      } else {
        result.inputs[key] = [value.opcode === 'procedures_prototype' ? 1 : 2, this.emit(value, id)];
      }
    }
    return id;
  }

  stack(nodes, parent) {
    let first = null, previous = null;
    for (const node of nodes) {
      const id = this.emit(node, previous ?? parent);
      first ??= id;
      if (previous) this.blocks[previous].next = id;
      previous = id;
    }
    return first;
  }

  script(hat, body, x, y, note) {
    const id = this.emit(hat, null, { x, y });
    this.blocks[id].next = this.stack(body, id);
    if (note) {
      const comment = `note-${id}`;
      this.comments[comment] = { blockId: id, x: x + 480, y, width: 300, height: 90, minimized: true, text: note };
      this.blocks[id].comment = comment;
    }
  }

  procedure(name, body, x, y, note) {
    this.script(block('procedures_definition', { custom_block: block('procedures_prototype', {}, {}, mutation(name)) }), body, x, y, note);
  }
}

function controllerScripts() {
  const scripts = new Scripts();
  const runCase = (count, label) => [
    set('busy', number(1)), set('scenario', string(label)), set('stockCount', number(count)), set('quota', number(6)),
    ...moduleNames.map(call), set('busy', number(0))
  ];
  const cases = [[24, '數量足夠'], [8, '數量不足'], [12, '修正後重測不重複']];
  scripts.script(block('event_whenflagclicked'), runCase(...cases[0]), 24, 24, '綠旗先跑足夠案例。按 2 看分配如何停止，再按 3 把庫存由 8 改為 12 後重測。');
  cases.forEach(([count, label], index) => {
    scripts.script(block('event_whenkeypressed', {}, { KEY_OPTION: [String(index + 1), null] }), [
      branch(compare('equals', variable('busy'), number(0)), runCase(count, label))
    ], 24 + index * 370, 340);
  });

  scripts.procedure(moduleNames[0], [
    ...Object.keys(lists).map(clear), broadcast('reset'),
    ...['ready', 'duplicate', 'wins', 'losses', 'ties', 'ours', 'theirs'].map(id => set(id, number(0))),
    set('round', number(1)), set('item', number(1)),
    repeat(variable('stockCount'), [add('stock', variable('item')), increment('item')]),
    log('案例：', variable('scenario'), '｜庫存 ', length('stock'), '，每隊 ', variable('quota'))
  ], 24, 775, '輸入是庫存筆數與每隊件數。建立唯一編號 1 到庫存筆數，並清除上一輪資料。');

  scripts.procedure(moduleNames[1], [
    repeat(length('stock'), [
      set('index', block('operator_random', { FROM: number(1), TO: length('stock') })),
      set('item', at('stock', variable('index'))), add('shuffled', variable('item')), remove('stock', variable('index'))
    ]),
    log('洗牌後：待分配 ', length('shuffled'), '，原庫存 ', length('stock'))
  ], 580, 775, '每次從剩餘庫存抽一項，搬到裝備分配再移除原項；筆數不變且不會重複抽到。');

  const take = target => repeat(variable('quota'), [add(target, at('shuffled', number(1))), remove('shuffled', number(1))]);
  scripts.procedure(moduleNames[2], [
    branch(compare('lt', length('shuffled'), required()), [
      log('不足：需要 ', required(), '，目前 ', length('shuffled'), '；不分配')
    ], [
      take('squad'), take('enemy'), set('ready', number(1)),
      log('分配後：我方 ', length('squad'), '、外星 ', length('enemy'), '、剩餘 ', length('shuffled'))
    ])
  ], 1120, 775, '先確認兩隊總需求；不足時保留完整待分配清單，不分配一半。足夠時將第 1 項移到隊伍清單再刪除。');

  const verify = id => branch(contains('seen', variable(id)), [set('duplicate', number(1))], [add('seen', variable(id))]);
  scripts.procedure(moduleNames[3], [
    branch(compare('equals', variable('ready'), number(1)), [
      repeat(variable('quota'), [
        set('ours', at('squad', variable('round'))), set('theirs', at('enemy', variable('round'))),
        verify('ours'), verify('theirs'),
        branch(compare('gt', variable('ours'), variable('theirs')), [set('outcome', string('勝')), increment('wins')], [
          branch(compare('lt', variable('ours'), variable('theirs')), [set('outcome', string('敗')), increment('losses')], [set('outcome', string('平手')), increment('ties')])
        ]),
        log('回合 ', variable('round'), '｜我方 ', variable('ours'), '：外星 ', variable('theirs'), ' → ', variable('outcome')),
        broadcast('roundView'), block('control_wait', { DURATION: number(0.25) }), increment('round')
      ]),
      log('結果：', variable('wins'), ' 勝、', variable('losses'), ' 敗、', variable('ties'), ' 平手'),
      branch(compare('equals', variable('duplicate'), number(0)), [log('驗證：兩隊裝備沒有重複')], [log('驗證失敗：出現重複裝備')])
    ], [log('未執行對決：請修正庫存或每隊件數後重測')])
  ], 1800, 775, '用同一索引讀取兩隊資料，記錄數值與勝敗；已出現清單用於檢查跨隊不重複。');
  return scripts;
}

function weaponScripts(power) {
  const scripts = new Scripts();
  const receive = id => block('event_whenbroadcastreceived', {}, { BROADCAST_OPTION: [messages[id], id] });
  scripts.script(receive('reset'), [block('looks_hide')], 24, 24);
  scripts.script(receive('roundView'), [block('looks_switchcostumeto', { COSTUME: variable(power) }), block('looks_show')], 24, 170);
  return scripts;
}

const backdrop = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
  <rect width="480" height="360" fill="#101827"/>
  <rect x="8" y="169" width="464" height="77" rx="12" fill="#1e293b" stroke="#334155"/>
  <g font-family="Microsoft JhengHei, sans-serif" fill="#e2e8f0">
    <text x="12" y="21" font-size="16" font-weight="bold">八年級第 6 課｜四個自訂積木</text>
    <text x="12" y="40" font-size="12">綠旗或 1：足夠　2：不足　3：修正後重測</text>
    <text x="25" y="193" font-size="13" fill="#93c5fd">小隊裝備</text>
    <text x="384" y="193" font-size="13" fill="#d8b4fe">外星裝備</text>
    <text x="227" y="215" font-size="13" fill="#94a3b8">比較</text>
  </g>
</svg>`;

function projectFiles(referenceZip) {
  const reference = JSON.parse(referenceZip.read('project.json').toString('utf8'));
  const artwork = Buffer.from(backdrop);
  const assetId = createHash('md5').update(artwork).digest('hex');
  const background = { name: '模組化對決', bitmapResolution: 1, dataFormat: 'svg', assetId, md5ext: `${assetId}.svg`, rotationCenterX: 240, rotationCenterY: 180 };
  const stage = { ...reference.targets.find(target => target.isStage), variables, lists, broadcasts: messages, blocks: {}, comments: {}, costumes: [background], sounds: [], currentCostume: 0 };
  const empty = { variables: {}, lists: {}, broadcasts: {}, sounds: [], currentCostume: 0 };
  const controllerBase = reference.targets.find(target => target.name === 'check');
  const { blocks, comments } = controllerScripts();
  const controller = { ...controllerBase, ...empty, blocks, comments, costumes: controllerBase.costumes.slice(0, 1), name: '對決控制台', visible: false, layerOrder: 1 };
  const weapons = scratch.costumeMapping.sprites.map((name, index) => {
    const source = reference.targets.find(target => target.name === name);
    const { blocks, comments } = weaponScripts(index === 0 ? 'ours' : 'theirs');
    return { ...source, ...empty, blocks, comments, x: index === 0 ? -88 : 88, y: -27, size: 26, direction: 90, visible: false, layerOrder: index + 2 };
  });
  const targets = [stage, controller, ...weapons];
  const monitors = ['stock', 'shuffled', 'squad', 'enemy', 'trace'].map((id, index) => ({
    id, mode: 'list', opcode: 'data_listcontents', params: { LIST: lists[id][0] }, spriteName: null,
    value: [], width: id === 'trace' ? 464 : 111, height: id === 'trace' ? 96 : 112,
    x: id === 'trace' ? 8 : 8 + 117 * index, y: id === 'trace' ? 253 : 49, visible: true
  }));
  const files = new Map([['project.json', Buffer.from(JSON.stringify({ targets, monitors, extensions: [], meta: reference.meta }))], [background.md5ext, artwork]]);
  for (const target of targets.slice(1)) for (const costume of target.costumes) {
    if (!files.has(costume.md5ext)) files.set(costume.md5ext, referenceZip.read(costume.md5ext));
  }
  return files;
}

function packZip(files) {
  const table = Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    return value;
  });
  const local = [], directory = [];
  let offset = 0;
  for (const [name, data] of files) {
    const filename = Buffer.from(name), compressed = deflateRawSync(data);
    let crc = 0xffffffff;
    for (const byte of data) crc = (crc >>> 8) ^ table[(crc ^ byte) & 255];
    crc = (crc ^ 0xffffffff) >>> 0;
    const header = Buffer.alloc(30), entry = Buffer.alloc(46);
    header.writeUInt32LE(0x04034b50); entry.writeUInt32LE(0x02014b50);
    header.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x800, 6); header.writeUInt16LE(8, 8); header.writeUInt16LE(0x21, 12);
    header.writeUInt32LE(crc, 14); header.writeUInt32LE(compressed.length, 18); header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(filename.length, 26);
    header.copy(entry, 6, 4, 30); entry.writeUInt32LE(offset, 42);
    local.push(header, filename, compressed); directory.push(entry, filename);
    offset += header.length + filename.length + compressed.length;
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(files.size, 8); end.writeUInt16LE(files.size, 10);
  end.writeUInt32LE(directory.reduce((size, part) => size + part.length, 0), 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, ...directory, end]);
}

function buildDemo() {
  const archive = openZip(fs.readFileSync(path.join(root, scenarios.space.grades[8].archive)));
  return packZip(projectFiles(openZip(archive.read(scratch.entry))));
}

if (require.main === module) {
  const file = path.join(root, '1150806-demo.sb3');
  fs.writeFileSync(file, buildDemo());
  console.log(`已產生 ${scratch.demo.file}`);
}

module.exports = { buildDemo };
