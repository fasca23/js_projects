const Strokes = {
    list: [],
    history: [],       // стек для undo
    redoStack: [],     // стек для redo
    maxHistory: CONFIG.HISTORY_LIMIT,

    reset() {
        this.list = [];
        this.history = [];
        this.redoStack = [];
    },

    pushHistory() {
        this.history.push(JSON.stringify(this.list));
        if (this.history.length > this.maxHistory) this.history.shift();
        this.redoStack = [];
    },

    undo() {
        if (!this.history.length) return false;
        this.redoStack.push(JSON.stringify(this.list));
        this.list = JSON.parse(this.history.pop());
        return true;
    },

    redo() {
        if (!this.redoStack.length) return false;
        this.history.push(JSON.stringify(this.list));
        this.list = JSON.parse(this.redoStack.pop());
        return true;
    },

    start(color, size, isEraser) {
        this.pushHistory();
        const stroke = {
            c: color,
            s: size,
            e: isEraser,
            p: []
        };
        this.list.push(stroke);
        return stroke;
    },

    addPoint(stroke, x, y) {
        if (!stroke || stroke.p.length >= CONFIG.MAX_POINTS_PER_STROKE) return false;

        const px = Math.round(x);
        const py = Math.round(y);
        const last = stroke.p[stroke.p.length - 1];
        if (last) {
            const dx = px - last.x;
            const dy = py - last.y;
            const min = CONFIG.MIN_POINT_DIST;
            if (dx * dx + dy * dy < min * min) return false;
        }
        stroke.p.push({ x: px, y: py });
        return true;
    },

    clear() {
        if (this.list.length) this.pushHistory();
        this.list = [];
    },

    // --- сериализация для localStorage ---

    serialize() {
        return this.list.map(s => ({
            c: s.c,
            s: s.s,
            e: s.e ? 1 : 0,
            p: s.p.flatMap(pt => [pt.x, pt.y])
        }));
    },

    deserialize(data) {
        this.reset();
        if (!Array.isArray(data)) return;
        this.list = data.map(s => {
            const flat = Array.isArray(s.p) ? s.p : [];
            const points = [];
            for (let i = 0; i < flat.length - 1; i += 2) {
                points.push({ x: flat[i], y: flat[i + 1] });
            }
            return {
                c: s.c || CONFIG.DEFAULT_COLOR,
                s: s.s || CONFIG.DEFAULT_SIZE,
                e: !!s.e,
                p: points
            };
        });
    }
};