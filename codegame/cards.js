(function (root) {
    'use strict';
    const sections = ['main', 'p1', 'p2'];
    function editPlan(level, programs, source, target) {
        if (!source || !target || !sections.includes(target.section) || !Number.isInteger(target.index) || target.index < 0 || target.index > level.capacity[target.section]) return null;
        const lists = Object.fromEntries(sections.map(section => [section, programs[section].map((command, index) => ({ command, from: { section, index } }))]));
        let card, mode = '插入';
        if (source.kind === 'palette') {
            if (!level.commands.includes(source.command)) return null;
            card = { command: source.command, from: null };
        } else if (source.kind === 'program' && sections.includes(source.section) && Number.isInteger(source.index)) {
            card = lists[source.section][source.index]; if (!card) return null;
            mode = '移動';
        } else return null;
        const destination = lists[target.section];
        let index = Math.min(target.index, destination.length);
        if (source.kind === 'program') {
            if (source.section !== target.section && destination.length >= level.capacity[target.section]) return null;
            lists[source.section].splice(source.index, 1);
            if (source.section === target.section && source.index < index) index--;
        } else if (destination.length >= level.capacity[target.section]) {
            if (!target.replace || index >= destination.length) return null;
            destination.splice(index, 1); mode = '替換';
        }
        if (destination.length >= level.capacity[target.section]) return null;
        destination.splice(index, 0, card);
        return describe(lists, target.section, index, mode);
    }
    function removePlan(programs, source) {
        if (source?.kind !== 'program' || !sections.includes(source.section) || !Number.isInteger(source.index) || !programs[source.section][source.index]) return null;
        const lists = Object.fromEntries(sections.map(section => [section, programs[section].map((command, index) => ({ command, from: { section, index } }))]));
        lists[source.section].splice(source.index, 1);
        return describe(lists, source.section, source.index, '刪除');
    }
    function describe(lists, section, index, mode) {
        return {
            programs: Object.fromEntries(sections.map(name => [name, lists[name].map(card => card.command)])), section, index, mode,
            moves: sections.flatMap(name => lists[name].flatMap((card, index) => card.from ? [{ from: card.from, to: { section: name, index } }] : []))
        };
    }
    const paths = {
        forward: ['M16 28V5 M7 14L16 5L25 14'],
        left: ['M25 27V17Q25 8 16 8H5 M12 2L5 8L12 14'],
        right: ['M7 27V17Q7 8 16 8H27 M20 2L27 8L20 14'],
        jump: ['M5 26C5 3 27 3 27 16 M21 10L27 16L31 10', 'M3 29H12 M22 25H30'],
        light: ['M12 23V20C3 13 8 4 16 4S29 13 20 20V23Z M12 27H20 M14 31H18']
    };
    function icon(command) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 32 34'); svg.setAttribute('aria-hidden', 'true'); svg.classList.add('card-icon');
        if (command === 'p1' || command === 'p2') {
            const text = document.createElementNS(svg.namespaceURI, 'text'); text.setAttribute('x', '16'); text.setAttribute('y', '24'); text.setAttribute('text-anchor', 'middle'); text.textContent = command.toUpperCase(); svg.append(text);
        } else for (const d of paths[command] || []) {
            const path = document.createElementNS(svg.namespaceURI, 'path'); path.setAttribute('d', d); svg.append(path);
        }
        return svg;
    }
    const selector = position => `.slot[data-section="${position.section}"][data-index="${position.index}"]`;
    class CardDrag {
        constructor(options) {
            this.options = options; this.drag = null; this.suppressUntil = 0;
            document.addEventListener('pointermove', event => this.move(event), { passive: false });
            document.addEventListener('pointerup', event => this.end(event));
            document.addEventListener('pointercancel', () => this.cancel());
            document.addEventListener('keydown', event => { if (event.key === 'Escape' && this.drag) { this.cancel(); event.preventDefault(); } });
            document.addEventListener('visibilitychange', () => { if (document.hidden) this.cancel(); });
            document.addEventListener('click', event => {
                if (performance.now() < this.suppressUntil && event.target.closest('.slot,.command-button')) { event.preventDefault(); event.stopImmediatePropagation(); }
            }, true);
        }
        bind(element, source) {
            element.draggable = false;
            element.addEventListener('pointerdown', event => {
                if (event.button !== 0 || !event.isPrimary || this.drag) return;
                this.drag = { source, element, pointer: event.pointerId, x: event.clientX, y: event.clientY, rect: element.getBoundingClientRect(), started: false, ghost: null, target: null, plan: null };
                element.setPointerCapture(event.pointerId);
            });
        }
        move(event) {
            const drag = this.drag; if (!drag || event.pointerId !== drag.pointer) return;
            if (!drag.started && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
            event.preventDefault();
            if (!drag.started) {
                drag.started = true; this.options.start(); drag.ghost = this.clone(drag.element, drag.rect); drag.element.classList.add('drag-origin'); document.body.classList.add('dragging-cards');
            }
            drag.lastX = event.clientX; drag.lastY = event.clientY;
            if (!this.scrollFrame && (event.clientY < 55 || event.clientY > root.innerHeight - 55)) this.scrollFrame = requestAnimationFrame(() => this.scroll());
            drag.ghost.style.left = `${event.clientX - drag.rect.width / 2}px`; drag.ghost.style.top = `${event.clientY - drag.rect.height / 2}px`;
            this.clearTarget();
            const hit = document.elementFromPoint(event.clientX, event.clientY);
            const trash = hit?.closest('#card-trash'), slot = hit?.closest('.slot');
            const { level, programs } = this.options.context();
            if (trash && drag.source.kind === 'program') {
                drag.target = trash; drag.plan = removePlan(programs, drag.source);
            } else if (slot) {
                const section = slot.dataset.section, slotIndex = Number(slot.dataset.index), list = programs[section], rect = slot.getBoundingClientRect();
                const full = list.length >= level.capacity[section], replace = drag.source.kind === 'palette' && full;
                const after = !replace && slotIndex < list.length && event.clientX > rect.left + rect.width / 2;
                drag.target = slot;
                drag.plan = editPlan(level, programs, drag.source, { section, index: slotIndex + (after ? 1 : 0), replace });
                slot.classList.toggle('drop-after', after);
            }
            if (drag.target) {
                drag.target.classList.add(drag.plan ? 'drop-target' : 'drop-invalid');
                drag.target.dataset.dropLabel = drag.plan?.mode || '已滿';
            }
            drag.ghost.classList.toggle('cannot-drop', !drag.plan);
        }
        end(event) {
            const drag = this.drag; if (!drag || event.pointerId !== drag.pointer) return;
            // Use the release position as well: native input can coalesce its final pointer move.
            if (drag.started || Math.hypot(event.clientX - drag.x, event.clientY - drag.y) >= 6) this.move(event);
            if (!drag.started) { this.cleanup(); return; }
            event.preventDefault(); this.suppressUntil = performance.now() + 300;
            const positions = this.positions(), plan = drag.plan, ghost = drag.ghost, source = drag.source;
            this.cleanup(false);
            if (!plan) { this.land(ghost, drag.element.getBoundingClientRect()); this.options.cancelled?.(); return; }
            this.options.commit(plan);
            this.animateMoves(positions, plan.moves, source.kind === 'program' ? source : null);
            if (plan.mode === '刪除') this.fade(ghost);
            else this.land(ghost, document.querySelector(selector(plan))?.getBoundingClientRect() || drag.rect);
        }
        clearTarget() {
            const target = this.drag?.target;
            if (target) { target.classList.remove('drop-target', 'drop-invalid', 'drop-after'); delete target.dataset.dropLabel; }
            if (this.drag) { this.drag.target = null; this.drag.plan = null; }
        }
        scroll() {
            this.scrollFrame = null;
            const drag = this.drag; if (!drag?.started) return;
            const speed = drag.lastY < 55 ? -12 : drag.lastY > root.innerHeight - 55 ? 12 : 0;
            if (!speed) return;
            const before = root.scrollY; root.scrollBy(0, speed);
            if (root.scrollY !== before) this.move({ pointerId: drag.pointer, clientX: drag.lastX, clientY: drag.lastY, preventDefault() {} });
        }
        cleanup(removeGhost = true) {
            const drag = this.drag; if (!drag) return;
            if (this.scrollFrame) { cancelAnimationFrame(this.scrollFrame); this.scrollFrame = null; }
            this.clearTarget(); drag.element.classList.remove('drag-origin'); document.body.classList.remove('dragging-cards');
            if (drag.element.hasPointerCapture(drag.pointer)) drag.element.releasePointerCapture(drag.pointer);
            if (removeGhost) drag.ghost?.remove(); this.drag = null;
        }
        cancel() {
            const drag = this.drag; if (!drag) return;
            if (drag.started) { this.suppressUntil = performance.now() + 300; this.cleanup(false); this.land(drag.ghost, drag.element.getBoundingClientRect()); this.options.cancelled?.(); }
            else this.cleanup();
        }
        clone(element, rect) {
            const ghost = element.cloneNode(true); ghost.removeAttribute('id'); ghost.removeAttribute('aria-label'); ghost.setAttribute('aria-hidden', 'true'); ghost.tabIndex = -1;
            ghost.classList.remove('selected', 'executing'); ghost.classList.add('floating-card');
            Object.assign(ghost.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` }); document.body.append(ghost); return ghost;
        }
        positions() { return new Map([...document.querySelectorAll('.slot.filled')].map(element => [`${element.dataset.section}:${element.dataset.index}`, element.getBoundingClientRect()])); }
        animateMoves(before, moves, skip) {
            if (this.reduced()) return;
            for (const move of moves) {
                if (skip && skip.section === move.from.section && skip.index === move.from.index) continue;
                const from = before.get(`${move.from.section}:${move.from.index}`), element = document.querySelector(selector(move.to)); if (!from || !element) continue;
                const to = element.getBoundingClientRect(), dx = from.left - to.left, dy = from.top - to.top;
                if (dx || dy) element.animate([{ transform: `translate(${dx}px,${dy}px)`, opacity: .65 }, { transform: 'translate(0,0)', opacity: 1 }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
            }
        }
        fly(element, destination) {
            const ghost = this.clone(element, element.getBoundingClientRect()); this.land(ghost, destination.getBoundingClientRect());
        }
        reduced() { return root.matchMedia?.('(prefers-reduced-motion: reduce)').matches; }
        land(ghost, rect) {
            if (!ghost) return; if (this.reduced()) { ghost.remove(); return; }
            const from = ghost.getBoundingClientRect(); ghost.classList.remove('cannot-drop');
            const destination = `translate(${rect.left - from.left}px,${rect.top - from.top}px) rotate(0) scale(${rect.width / from.width},${rect.height / from.height})`;
            const animation = ghost.animate([{ transform: 'translate(0,0) rotate(-5deg) scale(1.05)', opacity: .95, offset: 0 }, { transform: destination, opacity: .95, offset: .85 }, { transform: destination, opacity: 0, offset: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
            animation.finished.then(() => ghost.remove(), () => ghost.remove());
        }
        fade(ghost) { if (this.reduced()) { ghost.remove(); return; } const animation = ghost.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.2)', opacity: 0 }], { duration: 200, fill: 'forwards' }); animation.finished.then(() => ghost.remove(), () => ghost.remove()); }
    }
    const api = { editPlan, removePlan, icon, CardDrag };
    if (typeof module === 'object' && module.exports) module.exports = api; else root.CodeGameCards = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
