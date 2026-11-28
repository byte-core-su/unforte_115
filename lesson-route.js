// 學習路線引導：把一頁教材整理成「一步接一步」的單一路線。
// - 學生一次看一個步驟，完成後才開啟下一步。回看已完成的步驟不影響進度。
// - 操作說明放在活動前，完成標準和繼續按鈕放在活動後。
// - 步驟、文字草稿與積木程式保存在同一瀏覽器的設定檔。
// - 教師示範模式：從「教師備課」開啟，或網址加 ?teacher=1／?route=all。只在目前分頁有效，
//   可直接跳到任一步、不必勾選完成標準，也可一鍵全部展開。
// 使用：LessonRoute.start({ steps: [...], next: { href, label } })
(() => {
  'use strict';

  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const isProgram = step => Boolean(step?.anchors?.some(anchor => /^#(?:[\w-]+-)?block-program$/.test(anchor)));
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
    const steps = config.steps.map((step, index) => ({
      ...step, index, regions: [], parts: step.parts?.map(part => ({ ...part, regions: [] }))
    }));
    const key = `unforte:lesson:v1:${location.pathname}`;
    const version = JSON.stringify(steps.map(({ title, anchors, optional }) => [title, anchors, Boolean(optional)]));
    function readSaved() {
      if (demo) return {};
      try {
        const value = JSON.parse(localStorage.getItem(key));
        return value && typeof value === 'object' ? value : {};
      } catch { return {}; }
    }
    function save(patch) {
      if (demo) return false;
      try {
        localStorage.setItem(key, JSON.stringify({ ...readSaved(), ...patch }));
        return true;
      } catch { return false; }
    }
    const saved = readSaved();
    const route = saved.route;
    const resume = route?.version === version && Number.isInteger(route.current) &&
      route.current > 0 && route.current < steps.length;
    let storageAvailable = false;
    let current = 0;
    let viewing = null;
    let currentPart = 0;
    let reviewPart = 0;
    let finished = false;
    let hintsShown = 0;
    let ticked = [];
    let answer = '';
    const skipped = new Set();
    const answers = {};
    const viewedStep = () => steps[viewing ?? current];
    const partIndex = () => viewing === null ? currentPart : reviewPart;
    const atEnd = () => finished && viewing === null;
    const viewedPart = () => showAll || atEnd() ? undefined : viewedStep().parts?.[partIndex()];
    const hasNextPart = () => Boolean(viewedPart() && partIndex() + 1 < viewedStep().parts.length);
    const nextPart = () => hasNextPart() ? viewedStep().parts[partIndex() + 1] : null;
    const previousPartButton = '<button type="button" data-action="previous-part">回看前一小步</button>';
    let flowDialog;
    let flowTimer;

    function showFlowHint(content) {
      if (!flowDialog) {
        flowDialog = document.createElement('dialog');
        flowDialog.className = 'lesson-flow-hint';
        flowDialog.setAttribute('aria-labelledby', 'lesson-flow-hint-title');
        flowDialog.setAttribute('aria-describedby', 'lesson-flow-hint-content lesson-flow-hint-timing');
        flowDialog.innerHTML = `
          <form method="dialog" class="lesson-flow-hint__header">
            <h2 id="lesson-flow-hint-title">流程圖提示</h2>
            <button type="submit" autofocus>關閉</button>
          </form>
          <div id="lesson-flow-hint-content" data-flow-hint-content></div>
          <p id="lesson-flow-hint-timing">5 秒後自動關閉，可再開啟查看。</p>`;
        flowDialog.addEventListener('close', () => {
          if (!flowDialog.open) clearTimeout(flowTimer);
        });
        document.body.append(flowDialog);
      }
      if (flowDialog.open) return;
      clearTimeout(flowTimer);
      flowDialog.querySelector('[data-flow-hint-content]').innerHTML = content;
      flowDialog.showModal();
      flowDialog.scrollTop = 0;
      flowTimer = setTimeout(() => { if (flowDialog.open) flowDialog.close(); }, 5000);
    }

    function reviewActions() {
      const part = viewedPart();
      const followingPart = viewing < current || partIndex() < currentPart ? nextPart() : null;
      const available = steps.slice(viewing + 1, current + 1).filter(step => !skipped.has(step.index));
      const next = available[0];
      const program = available.find(isProgram);
      const resumeLabel = finished ? '回到終點' : '回到目前步驟';
      const stepLabel = step => step.index === current && !finished
        ? step.resumeLabel || `繼續：${step.title}`
        : step.reviewLabel || (isProgram(step) ? '重做積木實作' : `回看：${step.title}`);
      const primary = followingPart
        ? { action: 'next-part', label: part.reviewNextLabel || (isProgram(followingPart) ? '重做積木實作' : `回看：${followingPart.title}`) }
        : next ? { action: 'review-next', label: stepLabel(next) } : { action: 'resume', label: resumeLabel };
      const canShortcut = program && (followingPart ? !isProgram(followingPart) : program !== next);
      return { primary, next, program, shortcut: canShortcut ? stepLabel(program) : '' };
    }

    function saveRoute() {
      const part = steps[current].parts?.[currentPart]?.resume ? currentPart : undefined;
      storageAvailable = save({ route: { version, current, part, finished, skipped: [...skipped], answers, submitted: Boolean(ticked[0]) } });
    }

    function resolve() {
      const anchorsByStep = steps.map(step => (step.anchors || []).map(locator => ({ locator, node: findAnchor(locator) })));
      steps.forEach((step, index) => {
        const foreign = anchorsByStep.flatMap((list, other) => other === index ? [] : list.map(item => item.node)).filter(Boolean);
        const anchors = anchorsByStep[index];
        step.missing = anchors.some(item => !item.node);
        const resolveRegions = (items, excluded = foreign) => items.filter(item => item.node)
          .map(item => regionFor(item.node, item.locator, excluded));
        if (step.parts) {
          let start = 0;
          step.parts.forEach(part => {
            const end = part.anchors ? start : start + (part.anchorCount || 1);
            const items = part.anchors?.map(locator => ({ locator, node: findAnchor(locator) })) || anchors.slice(start, end);
            const otherParts = [...anchors.slice(0, start), ...anchors.slice(end)].map(item => item.node).filter(Boolean);
            part.regions = resolveRegions(items, [...foreign, ...otherParts]);
            if (items.some(item => !item.node)) step.missing = true;
            start = end;
          });
        }
        step.regions = step.parts ? step.parts.flatMap(part => part.regions) : resolveRegions(anchors);
      });
    }

    const viewedRegions = () => viewedPart()?.regions || viewedStep().regions;
    let hiddenBranches = new Set();

    function apply() {
      const visible = showAll ? steps.flatMap(step => step.regions) : atEnd() ? [] : viewedRegions();
      const opening = showAll || (!atEnd() && viewedStep().index === 0);
      preview?.setVisible(opening);
      guideHeading?.toggleAttribute('data-route-locked', !opening);
      const conceptVideo = !opening && missionCard?.querySelector('.learning-guide__video[open]');
      if (conceptVideo) conceptVideo.open = false;
      steps.forEach(step => step.regions.forEach(region => {
        region.toggleAttribute('data-route-locked', !visible.some(active => region.contains(active)));
      }));
      main.toggleAttribute('data-route-locked', !demo && !visible.some(region => main.contains(region)));
      const branches = new Set();
      function collectBranches(container, active) {
        if (active.includes(container)) return;
        for (const child of container.children) {
          const inside = active.filter(region => child.contains(region));
          if (inside.length) collectBranches(child, inside);
          else branches.add(child);
        }
      }
      const inMain = visible.filter(region => main.contains(region));
      if (!demo && inMain.length) collectBranches(main, inMain);
      for (const branch of hiddenBranches) if (!branches.has(branch)) branch.removeAttribute('data-route-outside-task');
      for (const branch of branches) branch.setAttribute('data-route-outside-task', '');
      hiddenBranches = branches;
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
        updateCompletion();
      }, 300);
    }).observe(document.body, { childList: true, subtree: true, attributeFilter: ['data-lesson-activity', 'data-program-passed', 'data-program-two-runs', 'data-program-three-runs'] });

    const panel = document.createElement('section');
    panel.className = 'lesson-route';
    panel.setAttribute('aria-label', '學習路線');
    const completion = document.createElement('section');
    completion.className = 'lesson-route lesson-route--completion';
    completion.setAttribute('aria-label', '完成這一步');
    const main = document.querySelector('main');
    main.classList.add('lesson-activity');
    if (window.BlockProgram) {
      const programs = { 'block-program': config.program, ...config.extraPrograms };
      for (const [id, task] of Object.entries(programs)) {
        if (!task) continue;
        const simulator = document.createElement('section');
        simulator.id = id;
        simulator.className = 'block-program';
        main.after(simulator);
        const draftKey = id === 'block-program' ? 'program' : id;
        window.BlockProgram.mount(simulator, task, demo ? undefined : {
          draft: saved[draftKey],
          onSave: program => save({ [draftKey]: program })
        });
      }
    }
    main.after(panel, completion);
    const startButton = document.querySelector('[data-lesson-start]');
    const guide = document.querySelector('#learning-guide');
    const guideHeading = document.getElementById('learning-guide-heading');
    const missionCard = guideHeading?.querySelector('.learning-guide__card');
    const preview = missionCard && window.LessonPreview?.mount(window.LearningGuide?.page, missionCard);
    const referenceNodes = (config.references || []).map(findAnchor).filter(Boolean);
    if (missionCard && referenceNodes.length) {
      const references = document.createElement('div');
      references.className = 'learning-guide__references';
      references.append(...referenceNodes);
      missionCard.append(references);
    }
    const progress = document.createElement('nav');
    progress.className = 'lesson-route lesson-route--progress';
    progress.setAttribute('aria-label', '本課進度');
    (guideHeading || guide || main).before(progress);

    const completionSlot = () => {
      const anchor = viewedPart()?.completionAnchor;
      return anchor ? findAnchor(anchor) : null;
    };

    function placeControls() {
      const unique = [...new Set(viewedRegions().map(region => main.contains(region) ? main : region))];
      const regions = unique.filter(region => !unique.some(other => other !== region && other.contains(region)))
        .sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
      if (!atEnd() && regions.length) {
        // Keep the route controls at the same width as the activity's outer container.
        if (regions[0].previousElementSibling !== panel) regions[0].before(panel);
        const slot = completionSlot();
        const last = regions.at(-1);
        if (slot) {
          if (completion.parentElement !== slot) slot.append(completion);
        } else if (last.nextElementSibling !== completion) last.after(completion);
      } else {
        const practice = document.querySelector('#adaptive-practice');
        const anchor = practice || main;
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
      const first = steps[1];
      const status = document.querySelector('.learning-guide__status');
      const entry = steps[0].entry;
      if (entry?.items && !demo) {
        const question = document.createElement('fieldset');
        question.className = 'lesson-route__checks lesson-route__entry';
        const latest = entry.items.at(-1);
        const targetPosition = entry.correct + 1;
        question.innerHTML = `<legend>同一筆資料，變數和清單怎麼記？</legend>
          <div class="lesson-route__entry-variable">
            <span>變數「最後登記」</span><strong data-entry-value>${escapeHtml(entry.items.at(-2))}</strong>
          </div>
          <p><strong>清單「登記紀錄」</strong></p>
          <ol class="lesson-route__entry-list" role="list">${entry.items.map((item, i) =>
            `<li${i === entry.items.length - 1 ? ' hidden' : ''}>
              <button type="button" data-entry-position="${i}" disabled>${escapeHtml(item)}</button>
            </li>`).join('')}</ol>
          <p data-entry-prompt>登記一筆新資料，觀察原來的清單。</p>
          <button class="lesson-route__entry-add" type="button" data-entry-add>登記：${escapeHtml(latest)}</button>`;
        const append = question.querySelector('[data-entry-add]');
        const choices = [...question.querySelectorAll('[data-entry-position]')];
        const applyRegistration = () => {
          question.querySelector('[data-entry-value]').textContent = latest;
          choices.at(-1).parentElement.hidden = false;
          choices.forEach(choice => { choice.disabled = false; });
          question.querySelector('[data-entry-prompt]').textContent = `從左到右找，點出還保留在清單中的第 ${targetPosition} 筆。`;
          append.disabled = true;
        };
        append.addEventListener('click', () => {
          applyRegistration();
          choices[0].focus({ preventScroll: true });
          status.textContent = `變數更新成「${latest}」，清單在末端多了一筆。`;
        });
        question.addEventListener('click', event => {
          const button = event.target.closest('[data-entry-position]');
          if (!button || current !== 0) return;
          const position = Number(button.dataset.entryPosition);
          if (position !== entry.correct) {
            status.textContent = `這是清單的第 ${position + 1} 筆。從最左邊的第 1 筆數過去。`;
            return;
          }
          startButton.disabled = false;
          button.setAttribute('data-correct', '');
          startButton.focus({ preventScroll: true });
          question.disabled = true;
          status.textContent = `變數現在記著「${latest}」，清單第 ${targetPosition} 筆還是「${entry.items[position]}」。`;
        });
        if (resume) {
          applyRegistration();
          choices[entry.correct].setAttribute('data-correct', '');
          question.querySelector('[data-entry-prompt]').textContent = `變數更新為最新一筆，清單仍能按位置找回第 ${targetPosition} 筆。`;
        }
        startButton.before(question);
        startButton.disabled = true;
      } else startButton.disabled = false;
      startButton.textContent = `開始：${first.title}`;
      startButton.addEventListener('click', () => {
        if (current === 0 && !finished) {
          if (!first.optional && first.missing && !first.regions.length) {
            if (status) status.textContent = '活動未能載入。請確認網路後重新整理。';
            return;
          }
          if (status) status.textContent = '';
          guide.querySelector('.lesson-route__entry')?.setAttribute('disabled', '');
          enter(first.index);
        } else showStep();
      });
    }

    function showStep(index = null, part = 0) {
      viewing = index;
      reviewPart = part;
      if (!atEnd()) viewedStep().review?.(viewing !== null);
      updateView();
      focusStep();
    }

    function focusStep() {
      requestAnimationFrame(() => {
        const programHeading = viewedRegions().find(region => region.classList.contains('block-program'))?.querySelector('h3');
        const heading = programHeading || (panel.hidden ? (guideHeading || guide)?.querySelector('h1') : panel.querySelector('.lesson-route__title'));
        if (programHeading) {
          reveal(programHeading, 'start');
          return;
        }
        if (panel.hidden) heading?.setAttribute('tabindex', '-1');
        heading?.focus({ preventScroll: true });
        progress.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
    }

    function updateView() {
      apply();
      renderProgress();
      render();
      placeControls();
      window.dispatchEvent(new Event('resize'));
    }

    function enter(index, { focus = true, submitted = false, part = 0 } = {}) {
      current = index;
      currentPart = part;
      viewing = null;
      hintsShown = 0;
      ticked = [submitted];
      answer = answers[index] || '';
      const step = steps[current];
      if (index > 0) saveRoute();
      updateView();
      if (typeof step.enter === 'function') { try { step.enter(); } catch (error) { console.warn('lesson-route enter', error); } }
      if (focus) focusStep();
      if (startButton && index > 0) startButton.textContent = '回到目前步驟';
    }

    function renderProgress() {
      const destination = steps.length;
      const reached = finished ? destination : current;
      const displayed = viewing ?? reached;
      const nodes = [...steps, { index: destination, title: '完成本課' }].map(step => {
        const { index, title, optional } = step;
        const endpoint = index === 0 ? '起點' : index === destination ? '終點' : '';
        const state = skipped.has(index) ? 'skipped' : index < reached ? 'done' : index === reached ? 'current' : 'locked';
        const mark = { skipped: '–', done: '✓' }[state] || (endpoint ? '●' : index);
        const status = { done: '已完成', skipped: '已略過', locked: '尚未開啟', current: '目前進度' }[state];
        const enabled = index === destination ? finished : demo || state === 'done' || state === 'current';
        return `<li class="is-${state}${endpoint ? ' is-endpoint' : ''}"><button type="button" data-node="${index}" ${enabled ? '' : 'disabled'} ${index === displayed ? 'aria-current="step"' : ''} aria-label="${endpoint ? `${endpoint}，` : ''}${escapeHtml(title)}${optional ? '（選做）' : ''}，${status}"><span class="lesson-route__dot" aria-hidden="true">${mark}</span><span class="lesson-route__node-label" aria-hidden="true">${escapeHtml(endpoint || title)}${optional ? '<small>選做</small>' : ''}</span></button></li>`;
      }).join('');
      progress.style.setProperty('--route-nodes', destination + 1);
      progress.innerHTML = `
        <ol class="lesson-route__nodes" role="list">${nodes}</ol>
        <div class="lesson-route__position">
          ${!atEnd() && viewedStep().period ? `<span class="lesson-route__period">第 ${viewedStep().period} 節</span>` : ''}
          <p role="status">${atEnd() ? '已到終點，本課完成' : viewing !== null ? `回看：${escapeHtml(viewedStep().title)}` : `目前：${escapeHtml(viewedStep().title)}`}</p>
          ${viewing !== null ? `<button type="button" data-action="resume">${finished ? '回到終點' : '回到目前步驟'}</button>` : ''}
        </div>
        ${!demo && current > 0 && storageAvailable ? `<details class="lesson-route__saved">
          <summary>本機進度</summary>
          <p>同一瀏覽器可接續步驟、文字答案和積木草稿。進行中的網頁活動重新開啟後可能要再做一次。</p>
          <button type="button" data-action="restart">清除本課進度與草稿</button>
        </details>` : ''}`;
    }

    function render() {
      panel.hidden = Boolean(startButton && !demo && viewedStep().index === 0);
      completion.hidden = panel.hidden || atEnd();
      if (atEnd()) {
        if (startButton) startButton.textContent = '查看本課完成結果';
        const next = config.next || (demo ? config.teacherFinish : null);
        panel.innerHTML = `
          <div class="lesson-route__bar">
            <span class="lesson-route__count">本課結束</span>
            <h2 class="lesson-route__title" tabindex="-1">${escapeHtml(config.finishTitle || '本課學習路線已完成')}</h2>
            <div class="lesson-route__actions">
              ${next ? `<a class="lesson-route__primary" data-course-direction="next" href="${escapeHtml(next.href)}">${escapeHtml(next.label || '前往下一單元')} →</a>` : ''}
            </div>
          </div>
          <div class="lesson-route__body">
            <p class="lesson-route__todo">${escapeHtml(config.finishText || '可以點上方的步驟，回去看做過的活動。')}</p>
          </div>`;
        return;
      }
      const step = viewedStep();
      const part = viewedPart();
      const backControl = part?.flowHint
        ? '<button type="button" data-action="flow-hint" aria-haspopup="dialog">流程圖提示</button>'
        : part && partIndex() > 0 ? previousPartButton : '';
      const choice = part && step.optional;
      const continuesPart = hasNextPart() && !choice;
      const checks = continuesPart ? [] : step.checks || [];
      const hints = viewing === null ? part?.hints || step.hints || [] : [];
      const { before, during, after } = step.questions || {};
      const todo = (viewing !== null && part?.reviewTodo) || part?.todo || step.todo;
      panel.innerHTML = `
        <div class="lesson-route__bar">
          <span class="lesson-route__count">${viewing !== null ? '回看步驟' : current === 0 ? '起點' : `第 ${current}／${steps.length - 1} 步`}</span>${demo ? '<span class="lesson-route__teacher">教師示範</span>' : ''}
          <h2 class="lesson-route__title" tabindex="-1">${escapeHtml(part?.title || step.title)}${step.optional ? '<span class="lesson-route__tag">選做</span>' : ''}</h2>
        </div>
        ${demo ? `<div class="lesson-route__demo"><span>教師示範模式，可直接選取上方步驟。</span><button type="button" data-action="show-all">${showAll ? '恢復逐步路線' : '全部展開'}</button><button type="button" data-action="end-demo">結束示範</button></div>` : ''}
        <div class="lesson-route__body">
          ${before ? `<p class="lesson-route__todo"><b>操作前先猜</b>${escapeHtml(before)}</p>` : ''}
          <p class="lesson-route__todo"><b>要做什麼</b>${escapeHtml(todo || '')}</p>
          ${step.evidence?.length ? `<ul class="evidence-list" role="list">${step.evidence.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
          ${viewing !== null && answers[step.index] ? `<p class="lesson-route__todo"><b>我的紀錄</b>${escapeHtml(answers[step.index])}</p>` : ''}
          ${during ? `<p class="lesson-route__todo"><b>操作中觀察</b>${escapeHtml(during)}</p>` : ''}
          ${after ? `<p class="lesson-route__todo"><b>做完後說明</b>${escapeHtml(after)}</p>` : ''}
          ${step.link ? `<p class="lesson-route__link"><a href="${escapeHtml(step.link.href)}" target="_blank" rel="noopener">${escapeHtml(step.link.label)}</a></p>` : ''}
          ${hints.length ? `<div class="lesson-route__hints">${hints.slice(0, hintsShown).map((hint, i) => `<p tabindex="-1"><b>提示 ${i + 1}</b>${escapeHtml(hint)}</p>`).join('')}${hintsShown < hints.length ? `<button type="button" data-action="hint">卡住了？看提示 ${hintsShown + 1}／${hints.length}</button>` : ''}</div>` : ''}
        </div>`;
      if (viewing !== null) {
        const { primary, shortcut } = reviewActions();
        completion.innerHTML = `<div class="lesson-route__body"><div class="lesson-route__actions">
          ${backControl}
          ${shortcut ? `<button type="button" data-action="review-program">${escapeHtml(shortcut)}</button>` : ''}
          <button type="button" class="lesson-route__primary" data-action="${primary.action}">${escapeHtml(primary.label)}</button>
        </div></div>`;
        return;
      }
      const next = continuesPart ? nextPart() : steps[current + 1];
      const action = (continuesPart && part.nextLabel) || (next ? next.startLabel || `前往${next.title}` : '完成本課');
      completion.innerHTML = `
        <div class="lesson-route__body">
          ${checks.length ? `<p class="lesson-route__todo"><b>怎樣算達標</b></p><ul class="evidence-list" role="list">${checks.map(check => `<li>${escapeHtml(check)}</li>`).join('')}</ul>` : ''}
          ${step.response && !continuesPart ? `<label class="lesson-route__response">${escapeHtml(step.response)}<textarea data-response rows="2" maxlength="300" placeholder="寫下一句具體的觀察或說明">${escapeHtml(answer)}</textarea></label>` : ''}
          ${step.submission ? `<label class="lesson-route__submit"><input type="checkbox" data-check="0" ${ticked[0] ? 'checked' : ''}> 已到班級平台繳交</label>` : ''}
          <p class="lesson-route__msg" role="status"></p>
          <div class="lesson-route__actions">
            ${backControl}
            ${choice && hasNextPart() ? '<button type="button" data-action="next-part">看下一項選做</button>' : ''}
            ${step.optional ? '<button type="button" data-action="skip">略過選做</button>' : ''}
            <button type="button" class="lesson-route__primary" data-action="done">${escapeHtml(action)}</button>
          </div>
        </div>`;
      updateCompletion();
    }

    function updateCompletion() {
      if (completion.hidden || viewing !== null) return false;
      const button = completion.querySelector('[data-action="done"]');
      if (!button) return false;
      const step = steps[current];
      const part = viewedPart();
      const continuesPart = hasNextPart() && !step.optional;
      const activity = continuesPart ? part.activity : step.activity;
      const boxes = [...completion.querySelectorAll('[data-check]')];
      const missing = demo ? [] : boxes.filter(box => !box.checked);
      const hasResponse = new Set(answer.toLowerCase().match(/[\p{L}\p{N}]/gu)).size >= 4;
      let message = '';
      if (!demo) {
        if (activity && !document.querySelector(activity.selector)) message = activity.pending;
        else if (!continuesPart && step.response && !hasResponse) message = '請先在上方寫下一句具體的說明。';
        else if (missing.length) message = '繳交後，請勾選「已到班級平台繳交」。';
      }
      const status = completion.querySelector('.lesson-route__msg');
      if (status.textContent !== message) status.textContent = message;
      button.disabled = Boolean(message);
      return !message;
    }

    function handleClick(event) {
      const node = event.target.closest('[data-node]');
      if (node && !node.disabled) {
        const index = Number(node.dataset.node);
        if (index === steps.length || (!finished && index === current)) showStep();
        else if (demo) { finished = false; enter(index); }
        else showStep(index);
        return;
      }
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'restart' && !demo) {
        if (!window.confirm('重新開始本課？這會刪除這個瀏覽器上的本課進度、答案和積木草稿。')) return;
        try { localStorage.removeItem(key); } catch { return; }
        location.reload();
        return;
      }
      if (action === 'resume') { showStep(); return; }
      if (viewing !== null && (action === 'review-next' || action === 'review-program')) {
        const { next, program } = reviewActions();
        const target = action === 'review-next' ? next : program;
        if (target) showStep(target.index === current && !finished ? null : target.index);
        return;
      }
      if (action === 'show-all') { showAll = !showAll; apply(); render(); window.dispatchEvent(new Event('resize')); return; }
      if (action === 'end-demo') { teacher.end(); return; }
      if (action === 'flow-hint') {
        const content = viewedPart()?.flowHint?.();
        if (content) showFlowHint(content);
        return;
      }
      if (action === 'previous-part' && viewing === null && partIndex() > 0 && !viewedStep().optional) {
        showStep(current, partIndex() - 1);
        return;
      }
      if (action === 'previous-part' || action === 'next-part') {
        changePart(partIndex() + (action === 'previous-part' ? -1 : 1));
        return;
      }
      if (action === 'hint') {
        hintsShown += 1;
        render();
        reveal(panel.querySelector('.lesson-route__hints p:last-of-type'));
        return;
      }
      if (action === 'skip' && viewing === null && steps[current].optional) { skipped.add(current); advance(); return; }
      if (action === 'done') {
        if (!updateCompletion()) return;
        const step = viewedStep();
        if (hasNextPart() && !step.optional) {
          changePart(currentPart + 1);
          return;
        }
        skipped.delete(current);
        advance();
      }
    }
    progress.addEventListener('click', handleClick);
    panel.addEventListener('click', handleClick);
    completion.addEventListener('click', handleClick);

    completion.addEventListener('change', event => {
      const box = event.target.closest('[data-check]');
      if (box) {
        ticked[Number(box.dataset.check)] = box.checked;
        saveRoute();
        updateCompletion();
      }
    });
    completion.addEventListener('input', event => {
      if (event.target.matches('[data-response]')) {
        answer = event.target.value;
        answers[current] = answer;
        saveRoute();
        updateCompletion();
      }
    });

    function changePart(index) {
      if (!viewedPart() || !viewedStep().parts[index]) return;
      if (viewing === current && index >= currentPart) {
        if (index === currentPart) showStep();
        return;
      }
      if (viewing === null) {
        currentPart = index;
        saveRoute();
      } else reviewPart = index;
      hintsShown = 0;
      updateView();
      focusStep();
    }

    function advance() {
      if (current < steps.length - 1) { enter(current + 1); return; }
      finished = true;
      saveRoute();
      updateView();
      focusStep();
    }

    resolve();
    steps.filter(step => step.missing).forEach(step => console.warn(`lesson-route：找不到「${step.title}」的部分頁面區塊。`));
    if (resume) {
      for (const step of steps) {
        const value = route.answers?.[step.index];
        if (step.response && typeof value === 'string') answers[step.index] = value.slice(0, 300);
      }
      if (Array.isArray(route.skipped)) {
        route.skipped.forEach(index => {
          if (Number.isInteger(index) && index < route.current && steps[index]?.optional) skipped.add(index);
        });
      }
      finished = route.current === steps.length - 1 && route.finished === true;
      guide?.querySelector('.lesson-route__entry')?.setAttribute('disabled', '');
      if (startButton) startButton.disabled = false;
    }
    const savedPart = resume && steps[route.current].parts?.[route.part]?.resume ? route.part : 0;
    enter(resume ? route.current : 0, { focus: false, submitted: resume && route.submitted === true, part: savedPart });
    if (showAll && location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    }
  }

  // Wait until the page (including script-built or React parts) shows the anchors we need.
  function startWhenReady(config, timeout = 8000) {
    const simulatorAnchors = new Set(['#block-program', ...Object.keys(config.extraPrograms || {}).map(id => '#' + id)]);
    const anchors = config.steps.flatMap(step => [
      ...(step.anchors || []), ...(step.parts || []).flatMap(part => part.anchors || [])
    ]);
    const needed = [...anchors, ...(config.references || [])].filter(locator => !simulatorAnchors.has(locator));
    const began = Date.now();
    (function poll() {
      if (needed.every(locator => findAnchor(locator)) || Date.now() - began > timeout) start(config);
      else setTimeout(poll, 150);
    })();
  }

  window.LessonRoute = { start: startWhenReady, teacher };
})();
