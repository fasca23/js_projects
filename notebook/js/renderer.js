const Renderer = {
    canvas: null,
    ctx: null,
    dpr: 1,
    width: 0,
    height: 0,
    gridOn: false,

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
    },

    resize() {
        if (!this.canvas) return;
        const dpr = window.devicePixelRatio || 1;

        // Размер берём у родителя canvas — это позволяет встраивать блокнот
        // в любой контейнер (в т.ч. в {% block content %} сайта).
        const parent = this.canvas.parentElement;
        const rect = parent.getBoundingClientRect();
        const w = Math.max(1, Math.floor(rect.width));
        const h = Math.max(1, Math.floor(rect.height));

        this.dpr = dpr;
        this.width = w;
        this.height = h;

        this.canvas.width = Math.floor(w * dpr);
        this.canvas.height = Math.floor(h * dpr);
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    clear() {
        const { ctx, width, height } = this;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = CONFIG.COLORS.CANVAS_BG;
        ctx.fillRect(0, 0, width, height);
        if (this.gridOn) this.drawGrid();
    },

    drawGrid() {
        const { ctx, width, height } = this;
        const step = CONFIG.COLORS.GRID_STEP;
        ctx.save();
        ctx.strokeStyle = CONFIG.COLORS.GRID;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = step; x < width; x += step) {
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, height);
        }
        for (let y = step; y < height; y += step) {
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(width, y + 0.5);
        }
        ctx.stroke();
        ctx.restore();
    },

    applyStrokeStyle(stroke) {
        const ctx = this.ctx;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = stroke.e ? CONFIG.COLORS.ERASER : stroke.c;
        ctx.lineWidth = stroke.s;
    },

    drawStroke(stroke) {
        const pts = stroke.p;
        if (!pts.length) return;

        const ctx = this.ctx;
        ctx.save();
        this.applyStrokeStyle(stroke);

        ctx.beginPath();
        if (pts.length === 1) {
            // точка — рисуем кружок
            ctx.arc(pts[0].x, pts[0].y, stroke.s / 2, 0, Math.PI * 2);
            ctx.fillStyle = stroke.e ? CONFIG.COLORS.ERASER : stroke.c;
            ctx.fill();
            ctx.restore();
            return;
        }

        ctx.moveTo(pts[0].x, pts[0].y);

        // Сглаживание через квадратичные кривые
        for (let i = 1; i < pts.length - 1; i++) {
            const midX = (pts[i].x + pts[i + 1].x) / 2;
            const midY = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
        }
        const last = pts[pts.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
        ctx.restore();
    },

    // рисует только последний сегмент (для плавности при движении)
    drawLastSegment(stroke) {
        const pts = stroke.p;
        if (pts.length < 2) {
            this.drawStroke(stroke);
            return;
        }

        const ctx = this.ctx;
        ctx.save();
        this.applyStrokeStyle(stroke);

        const n = pts.length;
        const p0 = pts[n - 3] || pts[0];
        const p1 = pts[n - 2];
        const p2 = pts[n - 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
        ctx.stroke();
        ctx.restore();
    },

    redrawAll(strokes) {
        this.clear();
        for (let i = 0; i < strokes.length; i++) {
            this.drawStroke(strokes[i]);
        }
    },

    toggleGrid() {
        this.gridOn = !this.gridOn;
        return this.gridOn;
    }
};