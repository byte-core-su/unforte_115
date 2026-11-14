// 學習路線引導：把一頁教材整理成「一步接一步」的單一路線。
// - 依序解鎖：還沒輪到的步驟區塊先隱藏，完成這一步（勾選完成標準）才開啟下一步。
// - 操作說明放在活動前，完成標準和繼續按鈕放在活動後。
// - 進度只存在本頁，重新整理就從頭開始；不保存、不傳送任何資料。
// - 教師示範模式：從「教師備課」開啟，或網址加 ?teacher=1／?route=all。只在目前分頁有效，
//   可直接跳到任一步、不必勾選完成標準，也可一鍵全部展開。
// 使用：LessonRoute.start({ steps: [...], next: { href, label } })
(() => {
  'use strict';

  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const teacher = window.TeacherDemo;
  const demo = teacher.isOn();
  if (demo) document.documentElement.setAttribute('data-teacher-route', '');

  function findAnchor(locator) {
    if (typeof locator === 'string') return document.querySelector(locator);
    if (locator.up) return document.querySelector(locator.up);
    if (locator.common) {
      const nodes = locator.common.map(selector => document.querySelector(selector));
      if (nodes.some(node => !node)) return null;
      let ancestor = nodes[0];
      while (ancestor && !nodes.every(node => ancestor.contains(node))) ancestor = ancestor.parentElement;
      return ancestor;
    }
    return null;
  }

  // A heading's region is its highest ancestor that does not also hold another step's anchor.
  function regionFor(anchor, locator, foreignAnchors) {
    if (typeof locator === 'string' || locator.common) return anchor;
    let region = anchor;
    while (region.parentElement && region.parentElement !== document.body &&
      !foreignAnchors.some(other => other !== anchor && region.parentElement.contains(other))) {
      region = region.parentElement;
    }
    return region;
  }

  function start(config) {
    let showAll = demo && teacher.showAll();
    const steps = config.steps.map((step, index) => ({ ...step, index, regions: [] }));
    let current = 0;
    let finished = false;
    let hintsShown = 0;
    let ticked = [];
    const skipped = new Set();

    function resolve() {
      const anchorsByStep = steps.map(step => (step.anchors || []).map(locator => ({ locator, node: findAnchor(locator) })));
      steps.forEach((step, index) => {
        const foreign = anchorsByStep.flatMap((list, other) => other === index ? [] : list.map(item => item.node)).filter(Boolean);
        const anchors = anchorsByStep[index];
        step.regions = anchors.filter(item => item.node).map(item => regionFor(item.node, item.locator, foreign));
        step.missing = anchors.some(item => !item.node);
      });
    }

    function apply() {
      const visible = new Set();
      steps.forEach(step => {
        if (showAll || finished || (step.index <= current && !skipped.has(step.index))) {
          step.regions.forEach(region => visible.add(region));
        }
      });
      steps.forEach(step => step.regions.forEach(region => {
        if (visible.has(region)) region.removeAttribute('data-route-locked');
        else region.setAttribute('data-route-locked', '');
      }));
      steps.filter(step => step.optional).forEach(step => {
        for (const locator of step.anchors || []) {
          const anchor = findAnchor(locator);
          if (!anchor) continue;
          const heading = anchor.matches('h2,h3,h4,h5') ? anchor : anchor.querySelector('h2,h3,h4,h5');
          if (!heading || heading.querySelector('.lesson-route__activity-tag')) continue;
          const badge = document.createElement('span');
          badge.className = 'lesson-route__activity-tag lesson-route__tag';
          badge.textContent = '選做';
          heading.prepend(badge);
        }
      });
    }

    // Some pages re-render parts of themselves; keep the locks on the fresh nodes.
    let pending = 0;
    new MutationObserver(() => {
      if (pending) return;
      pending = setTimeout(() => {
        pending = 0;
        if (steps.some(step => step.regions.some(region => !region.isConnected) || step.missing) || !panel.isConnected || !completion.isConnected) {
          resolve();
          placeControls();
        }
        apply();
      }, 300);
    }).observe(document.body, { childList: true, subtree: true });

    const panel = document.createElement('section');
    panel.className = 'lesson-route';
    panel.setAttribute('aria-label', '學習路線');
    const completion = document.createElement('section');
    completion.className = 'lesson-route lesson-route--completion';
    completion.setAttribute('aria-label', '完成這一步');
    const main = document.querySelector('main');
    main.after(panel, completion);
    const startButton = document.querySelector('[data-lesson-start]');
    const guide = document.querySelector('#learning-guide');

    function placeControls() {
      const unique = [...new Set(steps[current].regions)];
      const regions = unique.filter(region => !unique.some(other => other !== region && other.contains(region)))
        .sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
      if (!finished && regions.length) {
        // Place beside the current activity without moving any of its existing controls.
        if (regions[0].previousElementSibling !== panel) regions[0].before(panel);
        const last = regions.at(-1);
        if (last.nextElementSibling !== completion) last.after(completion);
      } else {
        const practice = document.querySelector('#adaptive-practice');
        const anchor = (finished || current === steps.length - 1) && practice ? practice : main;
        if (anchor.nextElementSibling !== panel) anchor.after(panel);
        if (panel.nextElementSibling !== completion) panel.after(completion);
      }
    }

    function reveal(target, block = 'nearest') {
      if (!target) return;
      target.focus({ preventScroll: true });
      const { top, bottom } = target.getBoundingClientRect();
      if (top < 0 || bottom > window.innerHeight - (block === 'start' ? 120 : 0)) {
        target.scrollIntoView({ behavior: 'instant', block });
      }
    }

    if (startButton) {
      const first = steps.find(step => step.index > 0 && !step.optional);
      const status = document.querySelector('.learning-guide__status');
      startButton.disabled = false;
      startButton.textContent = `開始：${first.title}`;
      startButton.addEventListener('click', () => {
        if (current === 0 && !finished) {
          if (first.missing && !first.regions.length) {
            if (status) status.textContent = '活動未能載入。請確認網路後重新整理。';
            return;
          }
          for (const step of steps.slice(1, first.index)) skipped.add(step.index);
          enter(first.index);
        } else if (finished) reveal(panel.querySelector('.lesson-route__title'));
        else {
          steps[current].review?.();
          reveal(panel.querySelector('.lesson-route__title'), 'start');
        }
      });
    }

    function scrollToStep(step) {
      if (step.index === current && !finished) {
        reveal(panel.querySelector('.lesson-route__title'), 'start');
        return;
      }
      const target = step.regions[0] || guide;
      if (!target) return;
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
    }

    function enter(index, { focus = true } = {}) {
      current = index;
      hintsShown = 0;
      ticked = [];
      apply();
      const step = steps[current];
      if (typeof step.enter === 'function') { try { step.enter(); } catch (error) { console.warn('lesson-route enter', error); } }
      render();
      placeControls();
      window.dispatchEvent(new Event('resize'));
      if (focus) requestAnimationFrame(() => reveal(panel.querySelector('.lesson-route__title'), 'start'));
      if (startButton && index > 0) startButton.textContent = '回到目前步驟';
    }

    function chips() {
      return steps.map(step => {
        const state = skipped.has(step.index) ? 'skipped' : finished || step.index < current ? 'done' : step.index === current ? 'current' : 'locked';
        const mark = state === 'done' ? '✓' : step.index + 1;
        const status = { done: '已完成', skipped: '已略過', locked: '尚未開啟', current: '目前步驟' }[state];
        return `<li><button type="button" class="lesson-route__chip is-${state}${step.optional ? ' is-optional' : ''}" data-chip="${step.index}" ${demo || state === 'done' || state === 'current' ? '' : 'disabled'} aria-label="第 ${step.index + 1} 步：${escapeHtml(step.title)}${step.optional ? '（選做）' : ''}，${status}"><span>${mark}</span>${escapeHtml(step.title)}${state === 'skipped' ? '（已略過）' : ''}</button></li>`;
      }).join('');
    }

    function render() {
      panel.hidden = Boolean(startButton && !demo && current === 0);
      completion.hidden = panel.hidden || finished;
      if (finished) {
        if (startButton) startButton.textContent = '查看本課完成結果';
        const next = config.next || (demo ? config.teacherFinish : null);
        panel.innerHTML = `
          <div class="lesson-route__bar">
            <span class="lesson-route__count">本課結束</span>
            <h2 class="lesson-route__title" tabindex="-1">${escapeHtml(config.finishTitle || (config.next ? '本課學習路線已完成' : '六課學習路線已完成'))}</h2>
            <div class="lesson-route__actions">
              ${next ? `<a class="lesson-route__primary" data-course-direction="next" href="${escapeHtml(next.href)}">${escapeHtml(next.label || '前往下一單元')} →</a>` : ''}
            </div>
          </div>
          <div class="lesson-route__body">
            <ol class="lesson-route__chips">${chips()}</ol>
            <p class="lesson-route__todo">${escapeHtml(config.finishText || '可以點上方的步驟，回去看做過的活動。')}</p>
          </div>`;
        return;
      }
      const step = steps[current];
      const checks = step.checks || [];
      const hints = step.hints || [];
      const { before, during, after } = step.questions || {};
      panel.innerHTML = `
        <div class="lesson-route__bar">
          <span class="lesson-route__count">第 ${current + 1}／${steps.length} 步</span>${demo ? '<span class="lesson-route__teacher">教師示範</span>' : ''}
          <h2 class="lesson-route__title" tabindex="-1">${escapeHtml(step.title)}${step.optional ? '<span class="lesson-route__tag">選做</span>' : ''}</h2>
          ${!demo && step.optional && step.regions.length ? '<div class="lesson-route__actions"><button type="button" data-action="skip">略過選做</button></div>' : ''}
        </div>
        ${demo ? `<div class="lesson-route__demo"><span>教師示範模式，可直接選取下方步驟。</span><button type="button" data-action="show-all">${showAll ? '恢復逐步路線' : '全部展開'}</button><button type="button" data-action="end-demo">結束示範</button></div>` : ''}
        <div class="lesson-route__body">
          ${demo ? `<ol class="lesson-route__chips">${chips()}</ol>` : ''}
          ${before ? `<p class="lesson-route__todo"><b>操作前先猜</b>${escapeHtml(before)}</p>` : ''}
          <p class="lesson-route__todo"><b>要做什麼</b>${escapeHtml(step.todo || '')}</p>
          ${step.evidence?.length ? `<ul class="evidence-list" role="list">${step.evidence.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
          ${during ? `<p class="lesson-route__todo"><b>操作中觀察</b>${escapeHtml(during)}</p>` : ''}
          ${after ? `<p class="lesson-route__todo"><b>做完後說明</b>${escapeHtml(after)}</p>` : ''}
          ${step.link ? `<p class="lesson-route__link"><a href="${escapeHtml(step.link.href)}" target="_blank" rel="noopener">${escapeHtml(step.link.label)}</a></p>` : ''}
          ${hints.length ? `<div class="lesson-route__hints">${hints.slice(0, hintsShown).map((hint, i) => `<p tabindex="-1"><b>提示 ${i + 1}</b>${escapeHtml(hint)}</p>`).join('')}${hintsShown < hints.length ? `<button type="button" data-action="hint">卡住了？看提示 ${hintsShown + 1}／${hints.length}</button>` : ''}</div>` : ''}
        </div>`;
      const action = current === steps.length - 1 ? '完成本課' : '完成這一步';
      completion.innerHTML = `
        <div class="lesson-route__body">
          ${checks.length ? `<fieldset class="lesson-route__checks"><legend>做完一項就勾一項</legend>${checks.map((check, i) => `<label><input type="checkbox" data-check="${i}" ${ticked[i] ? 'checked' : ''}> ${escapeHtml(check)}</label>`).join('')}</fieldset>` : ''}
          <p class="lesson-route__msg" role="status"></p>
          <div class="lesson-route__actions">
            ${step.optional && (demo || !step.regions.length) ? '<button type="button" data-action="skip">略過選做</button>' : ''}
            <button type="button" class="lesson-route__primary" data-action="done">${action}</button>
          </div>
        </div>`;
      keepCurrentChipVisible();
    }

    function keepCurrentChipVisible() {
      const row = panel.querySelector('.lesson-route__chips');
      const chip = panel.querySelector('.lesson-route__chip.is-current');
      if (row && chip) row.scrollLeft = chip.parentElement.offsetLeft - row.clientWidth / 2 + chip.offsetWidth / 2;
    }

    function handleClick(event) {
      const chip = event.target.closest('[data-chip]');
      if (chip) {
        const step = steps[Number(chip.dataset.chip)];
        if (demo && step.index !== current) { finished = false; enter(step.index); }
        else {
          step.review?.();
          scrollToStep(step);
        }
        return;
      }
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'show-all') { showAll = !showAll; apply(); render(); window.dispatchEvent(new Event('resize')); return; }
      if (action === 'end-demo') { teacher.end(); return; }
      if (action === 'hint') {
        hintsShown += 1;
        render();
        reveal(panel.querySelector('.lesson-route__hints p:last-of-type'));
        return;
      }
      if (action === 'skip' && steps[current].optional) { skipped.add(current); advance(); return; }
      if (action === 'done') {
        const boxes = [...completion.querySelectorAll('[data-check]')];
        const missing = demo ? [] : boxes.filter(box => !box.checked);
        if (missing.length) {
          const message = completion.querySelector('.lesson-route__msg');
          message.textContent = `還有 ${missing.length} 項沒勾選。做完並勾好後再按一次。`;
          reveal(missing[0]);
          return;
        }
        skipped.delete(current);
        advance();
      }
    }
    panel.addEventListener('click', handleClick);
    completion.addEventListener('click', handleClick);

    completion.addEventListener('change', event => {
      const box = event.target.closest('[data-check]');
      if (box) ticked[Number(box.dataset.check)] = box.checked;
    });

    function advance() {
      if (current < steps.length - 1) { enter(current + 1); return; }
      finished = true;
      apply();
      render();
      placeControls();
      reveal(panel.querySelector('.lesson-route__primary, .lesson-route__title'));
    }

    resolve();
    steps.filter(step => step.missing).forEach(step => console.warn(`lesson-route：找不到「${step.title}」的部分頁面區塊。`));
    enter(0, { focus: false });
    if (showAll && location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    }
  }

  // Wait until the page (including script-built or React parts) shows the anchors we need.
  function startWhenReady(config, timeout = 8000) {
    const needed = config.steps.flatMap(step => step.anchors || []);
    const began = Date.now();
    (function poll() {
      if (needed.every(locator => findAnchor(locator)) || Date.now() - began > timeout) start(config);
      else setTimeout(poll, 150);
    })();
  }

  window.LessonRoute = { start: startWhenReady, teacher };
})();
