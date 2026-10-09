(function (root) {
    'use strict';
    const WIDTH = 900;
    const HEIGHT = 560;
    const polygon = (ctx, points, fill, stroke = '#93aac0') => {
        ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
        ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 1.4; ctx.stroke();
    };
    const box = (ctx, x, y, w, h, radius, fill) => {
        ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fillStyle = fill; ctx.fill();
    };

    class Renderer {
        constructor(canvas) {
            this.canvas = canvas;
            this.rotation = 0;
            this.level = null;
            this.snapshot = null;
            this.lastMove = null;
            this.raf = null;
            this.observer = new ResizeObserver(() => this.draw());
            this.observer.observe(canvas);
        }
        set(level, snapshot, animate = false, duration = 650) {
            const before = this.snapshot?.robot;
            if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
            const command = snapshot.last?.command;
            const moved = before && (before.row !== snapshot.robot.row || before.col !== snapshot.robot.col);
            const turn = command === 'left' ? -1 : command === 'right' ? 1 : 0;
            const reducedMotion = root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
            this.level = level; this.snapshot = snapshot;
            this.lastMove = animate && before && !reducedMotion && (moved || turn) ? { from: before, to: snapshot.robot, started: performance.now(), duration, jump: command === 'jump' && moved, turn } : null;
            this.draw();
        }
        rotate() { this.rotation = (this.rotation + 1) % 4; this.lastMove = null; this.draw(); }
        project(row, col, height) {
            let x = col - (this.level.board[0].length - 1) / 2;
            let y = row - (this.level.board.length - 1) / 2;
            for (let i = 0; i < this.rotation; i++) [x, y] = [-y, x];
            return { x: (x - y) * 48, y: (x + y) * 26 - height * 29, depth: x + y };
        }
        draw() {
            if (!this.level || !this.snapshot) return;
            const canvas = this.canvas;
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(root.devicePixelRatio || 1, 2);
            const w = Math.max(1, Math.round(rect.width * dpr));
            const h = Math.max(1, Math.round(rect.height * dpr));
            if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
            const ctx = canvas.getContext('2d');
            // Fit the board to its available height without stretching tiles or the robot.
            ctx.setTransform(w / WIDTH, 0, 0, w / WIDTH, 0, 0);
            this.paint(ctx, WIDTH, h * WIDTH / w);
        }
        paint(ctx, width, height, animate = true) {
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#f2f8ff'); gradient.addColorStop(1, '#e8eff9');
            ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
            const tiles = [];
            this.level.board.forEach((row, r) => row.forEach((z, c) => {
                if (z !== null) tiles.push({ row: r, col: c, z, ...this.project(r, c, z) });
            }));
            const minX = Math.min(...tiles.map(t => t.x)) - 50;
            const maxX = Math.max(...tiles.map(t => t.x)) + 50;
            const minY = Math.min(...tiles.map(t => t.y)) - 82;
            const maxY = Math.max(...tiles.map(t => this.project(t.row, t.col, 0).y)) + 45;
            const scale = Math.min(1.75, (width - 120) / (maxX - minX), (height - 110) / (maxY - minY));
            ctx.save(); ctx.translate(width / 2, height / 2 + 18); ctx.scale(scale, scale); ctx.translate(-(minX + maxX) / 2, -(minY + maxY) / 2);
            const goals = new Set(this.level.goals.map(([r, c]) => `${r},${c}`));
            const lit = new Set(this.snapshot.lit);
            let moving = false;
            let robot = { ...this.snapshot.robot };
            let lift = 0;
            if (animate && this.lastMove) {
                const t = Math.min(1, (performance.now() - this.lastMove.started) / this.lastMove.duration);
                const ease = t * t * (3 - 2 * t);
                robot.row = this.lastMove.from.row + (this.lastMove.to.row - this.lastMove.from.row) * ease;
                robot.col = this.lastMove.from.col + (this.lastMove.to.col - this.lastMove.from.col) * ease;
                const startH = this.level.board[this.lastMove.from.row][this.lastMove.from.col];
                const endH = this.level.board[this.lastMove.to.row][this.lastMove.to.col];
                robot.height = startH + (endH - startH) * ease;
                // Signed quarter-turns also interpolate correctly across north/east (3 ↔ 0).
                robot.direction = this.lastMove.turn ? this.lastMove.from.direction + this.lastMove.turn * ease : this.lastMove.to.direction;
                lift = this.lastMove.jump ? Math.sin(t * Math.PI) * 30 : 0;
                moving = t < 1;
            }
            const position = this.project(robot.row, robot.col, robot.height ?? this.level.board[this.snapshot.robot.row][this.snapshot.robot.col]);
            tiles.sort((a, b) => a.depth - b.depth || a.col - b.col);
            let robotDrawn = false;
            for (const tile of tiles) {
                if (!robotDrawn && tile.depth > position.depth + .01) { this.paintRobot(ctx, position.x, position.y - lift, (robot.direction + this.rotation) % 4); robotDrawn = true; }
                const { x, y } = tile;
                const base = this.project(tile.row, tile.col, 0).y + 18;
                polygon(ctx, [[x - 48, y], [x, y + 26], [x, base + 26], [x - 48, base]], '#bacbdf');
                polygon(ctx, [[x, y + 26], [x + 48, y], [x + 48, base], [x, base + 26]], '#94adc9');
                const id = `${tile.row},${tile.col}`;
                const goal = goals.has(id);
                const active = lit.has(id);
                polygon(ctx, [[x, y - 26], [x + 48, y], [x, y + 26], [x - 48, y]], active ? '#ffdc62' : goal ? '#459be8' : '#eff5fc', active ? '#d5a731' : goal ? '#2071bd' : '#b1c3d8');
                if (goal) {
                    ctx.fillStyle = active ? '#ad7414' : '#fff'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center'; ctx.fillText(active ? '✓' : '·', x, y + 6);
                }
                if (!robotDrawn && Math.abs(tile.depth - position.depth) < .01 && tile.row === this.snapshot.robot.row && tile.col === this.snapshot.robot.col) {
                    this.paintRobot(ctx, position.x, position.y - lift, (robot.direction + this.rotation) % 4); robotDrawn = true;
                }
            }
            if (!robotDrawn) this.paintRobot(ctx, position.x, position.y - lift, (robot.direction + this.rotation) % 4);
            // Draw the heading above the tiles so high steps cannot hide it.
            this.paintHeading(ctx, position.x, position.y, robot.direction + this.rotation);
            ctx.restore();
            const direction = (this.snapshot.robot.direction + this.rotation) % 4;
            const turning = this.snapshot.last?.command === 'left' || this.snapshot.last?.command === 'right';
            box(ctx, 22, 18, turning ? 280 : 170, 48, 12, '#fff4df');
            ctx.fillStyle = '#a64808'; ctx.font = 'bold 23px "Microsoft JhengHei", system-ui'; ctx.textAlign = 'left';
            ctx.fillText(`${['↘', '↙', '↖', '↗'][direction]} 朝${['東', '南', '西', '北'][this.snapshot.robot.direction]}${turning ? this.snapshot.last.command === 'left' ? ' · ↶ 左轉' : ' · ↷ 右轉' : ''}`, 38, 50);
            ctx.fillStyle = '#415976'; ctx.font = '18px "Microsoft JhengHei", system-ui'; ctx.textAlign = 'left';
            ctx.fillText('藍色：待點亮', 30, height - 26); ctx.fillText('黃色：已點亮', 225, height - 26);
            ctx.textAlign = 'right'; ctx.fillText(`已點亮 ${this.snapshot.lit.length} / ${this.level.goals.length}`, width - 30, height - 26);
            if (moving) {
                if (this.raf) cancelAnimationFrame(this.raf);
                this.raf = requestAnimationFrame(() => { this.raf = null; this.draw(); });
            }
        }
        paintRobot(ctx, x, y, direction) {
            ctx.save(); ctx.translate(x, y);
            const angle = direction * Math.PI / 2;
            const dx = Math.cos(angle) - Math.sin(angle);
            const dy = Math.cos(angle) + Math.sin(angle);
            ctx.fillStyle = '#172c6540'; ctx.beginPath(); ctx.ellipse(0, 2, 20, 9, 0, 0, Math.PI * 2); ctx.fill();
            box(ctx, -17, -30, 34, 26, 8, '#5148d8');
            box(ctx, -21, -62, 42, 33, 10, dy > 0 ? '#fff' : '#bfc2f7');
            ctx.strokeStyle = '#3b3d89'; ctx.lineWidth = 2; ctx.stroke();
            // The face follows the front; north/west expose the back of the head.
            if (dy > 0) {
                const faceX = dx * 5;
                box(ctx, faceX - 14, -54, 28, 17, 5, '#283e71');
                ctx.fillStyle = '#87e5ff'; ctx.beginPath(); ctx.arc(faceX - 6, -46, 3, 0, Math.PI * 2); ctx.arc(faceX + 6, -46, 3, 0, Math.PI * 2); ctx.fill();
            } else {
                box(ctx, dx * 4 - 10, -53, 20, 15, 4, '#9699dd');
                ctx.strokeStyle = '#6267af'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(dx * 4 - 5, -48); ctx.lineTo(dx * 4 + 5, -48); ctx.moveTo(dx * 4 - 5, -43); ctx.lineTo(dx * 4 + 5, -43); ctx.stroke();
            }
            ctx.strokeStyle = '#6a66ed'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -62); ctx.lineTo(0, -70); ctx.stroke();
            ctx.fillStyle = '#f7c74b'; ctx.beginPath(); ctx.arc(0, -73, 4, 0, Math.PI * 2); ctx.fill();
            box(ctx, -23, -23, 7, 18, 3, '#7570ee'); box(ctx, 16, -23, 7, 18, 3, '#7570ee');
            box(ctx, -14, -6, 10, 8, 3, '#302d8e'); box(ctx, 4, -6, 10, 8, 3, '#302d8e');
            ctx.restore();
        }
        paintHeading(ctx, x, y, direction) {
            ctx.save(); ctx.translate(x, y);
            const angle = direction * Math.PI / 2;
            const dx = Math.cos(angle) - Math.sin(angle), dy = (Math.cos(angle) + Math.sin(angle)) * .54;
            ctx.strokeStyle = '#ffb76d'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.ellipse(0, 0, 35, 19, 0, 0, Math.PI * 2); ctx.stroke();
            const points = [[-13, -5], [8, -5], [8, -12], [27, 0], [8, 12], [8, 5], [-13, 5]].map(([along, across]) => [dx * (43 + along) - dy * across, dy * (43 + along) + dx * across]);
            ctx.shadowColor = '#fff'; ctx.shadowBlur = 5;
            polygon(ctx, points, '#f86b22', '#fff');
            ctx.restore();
        }
    }
    root.CodeGameRenderer = { Renderer, WIDTH, HEIGHT };
})(globalThis);
