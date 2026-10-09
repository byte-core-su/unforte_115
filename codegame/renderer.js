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
        set(level, snapshot, animate = false) {
            const before = this.snapshot?.robot;
            this.level = level; this.snapshot = snapshot;
            this.lastMove = animate && before ? { from: before, to: snapshot.robot, started: performance.now(), jump: snapshot.last?.command === 'jump' } : null;
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
            ctx.setTransform(w / WIDTH, 0, 0, h / HEIGHT, 0, 0);
            this.paint(ctx, WIDTH, HEIGHT);
        }
        paint(ctx, width, height) {
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#f2f8ff'); gradient.addColorStop(1, '#e8eff9');
            ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#cddbef';
            for (let x = 20; x < width; x += 30) for (let y = 20; y < height; y += 30) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); }
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
            if (this.lastMove) {
                const t = Math.min(1, (performance.now() - this.lastMove.started) / 260);
                const ease = t * t * (3 - 2 * t);
                robot.row = this.lastMove.from.row + (this.lastMove.to.row - this.lastMove.from.row) * ease;
                robot.col = this.lastMove.from.col + (this.lastMove.to.col - this.lastMove.from.col) * ease;
                const startH = this.level.board[this.lastMove.from.row][this.lastMove.from.col];
                const endH = this.level.board[this.lastMove.to.row][this.lastMove.to.col];
                robot.height = startH + (endH - startH) * ease;
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
            ctx.restore();
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
            ctx.fillStyle = '#172c6540'; ctx.beginPath(); ctx.ellipse(0, 2, 20, 9, 0, 0, Math.PI * 2); ctx.fill();
            box(ctx, -17, -30, 34, 26, 8, '#5148d8');
            box(ctx, -21, -62, 42, 33, 10, '#fff');
            ctx.strokeStyle = '#3b3d89'; ctx.lineWidth = 2; ctx.stroke();
            box(ctx, -15, -54, 30, 17, 5, '#283e71');
            ctx.fillStyle = '#87e5ff'; ctx.beginPath(); ctx.arc(-7, -46, 3, 0, Math.PI * 2); ctx.arc(7, -46, 3, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#6a66ed'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -62); ctx.lineTo(0, -70); ctx.stroke();
            ctx.fillStyle = '#f7c74b'; ctx.beginPath(); ctx.arc(0, -73, 4, 0, Math.PI * 2); ctx.fill();
            box(ctx, -23, -23, 7, 18, 3, '#7570ee'); box(ctx, 16, -23, 7, 18, 3, '#7570ee');
            box(ctx, -14, -6, 10, 8, 3, '#302d8e'); box(ctx, 4, -6, 10, 8, 3, '#302d8e');
            // Direction indicator points to the next tile in the rendered camera orientation.
            const vectors = [[1, .54], [-1, .54], [-1, -.54], [1, -.54]];
            const [dx, dy] = vectors[direction];
            ctx.strokeStyle = '#f86b22'; ctx.fillStyle = '#f86b22'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(dx * 27, dy * 27); ctx.lineTo(dx * 42, dy * 42); ctx.stroke();
            const a = Math.atan2(dy, dx);
            polygon(ctx, [[dx * 44, dy * 44], [dx * 44 - Math.cos(a - .55) * 11, dy * 44 - Math.sin(a - .55) * 11], [dx * 44 - Math.cos(a + .55) * 11, dy * 44 - Math.sin(a + .55) * 11]], '#f86b22', '#f86b22');
            ctx.restore();
        }
    }
    root.CodeGameRenderer = { Renderer, WIDTH, HEIGHT };
})(globalThis);
