const Input = {
    notebook: null,
    drawing: false,
    activeStroke: null,

    init(notebook, canvas) {
        this.notebook = notebook;
        this.canvas = canvas;

        canvas.addEventListener('mousedown', this.onDown.bind(this));
        canvas.addEventListener('mousemove', this.onMove.bind(this));
        window.addEventListener('mouseup', this.onUp.bind(this));
        canvas.addEventListener('mouseleave', this.onUp.bind(this));

        canvas.addEventListener('touchstart', this.onDown.bind(this), { passive: false });
        canvas.addEventListener('touchmove', this.onMove.bind(this), { passive: false });
        canvas.addEventListener('touchend', this.onUp.bind(this));
        canvas.addEventListener('touchcancel', this.onUp.bind(this));

        window.addEventListener('keydown', this.onKey.bind(this));
    },

    pos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: cx - rect.left, y: cy - rect.top };
    },

    onDown(e) {
        e.preventDefault();
        const { x, y } = this.pos(e);

        this.drawing = true;
        this.activeStroke = Strokes.start(
            Toolbar.color,
            Toolbar.size,
            Toolbar.tool === 'eraser'
        );
        Strokes.addPoint(this.activeStroke, x, y);
        Renderer.drawStroke(this.activeStroke);
    },

    onMove(e) {
        if (!this.drawing) return;
        e.preventDefault();
        const { x, y } = this.pos(e);
        const added = Strokes.addPoint(this.activeStroke, x, y);
        if (added) {
            Renderer.drawLastSegment(this.activeStroke);
        }
    },

    onUp() {
        if (!this.drawing) return;
        this.drawing = false;
        this.activeStroke = null;
        this.notebook.persist();
    },

    onKey(e) {
        if (e.target.tagName === 'INPUT') return;
        const k = e.key.toLowerCase();
        const t = this.notebook.toolbar;

        if (k === 'e' || k === 'у') Toolbar.setTool('pen');
        if (k === 'l' || k === 'д') Toolbar.setTool('eraser');
        else if ((e.ctrlKey || e.metaKey) && k === 'z') {
            e.preventDefault();
            this.notebook.undo();
        } else if ((e.ctrlKey || e.metaKey) && (k === 'y' || (k === 'z' && e.shiftKey))) {
            e.preventDefault();
            this.notebook.redo();
        } else if (k === 'g' || k === 'п') {
            this.notebook.toggleGrid();
        }
    }
};