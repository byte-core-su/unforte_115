const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const registry = JSON.parse(fs.readFileSync(path.join(root,'modules/registry.json'),'utf8'));
const modules = registry.files.map(file => JSON.parse(fs.readFileSync(path.join(root,'modules',file),'utf8')));

test('builder workflow selects, reorders, imports, rejects invalid imports and opens a portable course', async () => {
  const kit = await import('../course-kit.mjs');
  const nodes = new Map();
  function node(id) {
    if (!nodes.has(id)) nodes.set(id,{ id, value:'', textContent:'', innerHTML:'', hidden:false, disabled:false, handlers:{}, addEventListener(event,handler){this.handlers[event]=handler;}, focus(){} });
    return nodes.get(id);
  }
  const picks = modules.map(module=>({dataset:{module:module.id},checked:false}));
  const memory = new Map();
  const storage = {getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)};
  const context = { ...kit, e:kit.escapeHtml, console, JSON, location:{hash:'',pathname:'/course-builder.html',search:'',href:''}, history:{replaceState(){}}, document:{getElementById:node,querySelectorAll:()=>picks,querySelector:()=>null},localStorage:storage,loadCatalog:async()=>modules,saveDraft:course=>{storage.setItem(kit.DRAFT_KEY,JSON.stringify(course));return true;} };
  const source = fs.readFileSync(path.join(root,'course-builder.mjs'),'utf8').replace(/^import[^\n]*\n/,'').replace(/start\(\)\.catch\(error => status\(error.message\)\);\s*$/,'');
  vm.createContext(context);
  vm.runInContext(source,context);
  await vm.runInContext('start()',context);
  assert.equal(node('composer').hidden,false);
  assert.equal(node('open-course').disabled,true);
  node('course-title').value='資料與幾何跨年級課';
  node('course-title').handlers.input();
  for (const id of ['g8-03','g7-04']) {
    const pick=picks.find(item=>item.dataset.module===id);pick.checked=true;
    node('module-catalog').handlers.change({target:pick});
  }
  assert.equal(node('open-course').disabled,false);
  assert.match(node('prerequisite-notes').innerHTML,/清單基本操作與搜尋/);
  const move={dataset:{id:'g7-04',move:'-1'}};
  node('selected-modules').handlers.click({target:{closest:()=>move}});
  assert.deepEqual(JSON.parse(memory.get(kit.DRAFT_KEY)).moduleIds,['g7-04','g8-03']);
  node('open-course').handlers.click();
  const opened=kit.decodeCourse(context.location.href.slice('course.html'.length),modules);
  assert.equal(opened.title,'資料與幾何跨年級課');
  assert.deepEqual(opened.moduleIds,['g7-04','g8-03']);
  const imported={schemaVersion:1,courseVersion:'V-2',title:'只上清單與平均',description:'資料短課',moduleIds:['g8-01','g8-03']};
  const fileInput={files:[{size:100,text:async()=>JSON.stringify(imported)}],value:'my-course.json'};
  await node('import-course').handlers.change({target:fileInput});
  assert.equal(node('course-title').value,imported.title);
  assert.deepEqual(JSON.parse(memory.get(kit.DRAFT_KEY)),imported);
  assert.equal(node('prerequisite-notes').hidden,true);
  fileInput.files=[{size:100,text:async()=>JSON.stringify({...imported,moduleIds:['unknown']})}];
  await node('import-course').handlers.change({target:fileInput});
  assert.match(node('status').textContent,/匯入失敗/);
  assert.deepEqual(JSON.parse(memory.get(kit.DRAFT_KEY)),imported);
  const remove={dataset:{remove:'g8-01'}};
  node('selected-modules').handlers.click({target:{closest:()=>remove}});
  assert.deepEqual(JSON.parse(memory.get(kit.DRAFT_KEY)).moduleIds,['g8-03']);
});
