const Input = {
    notebook: null,
    drawing: false,
    activeStroke: null,

    init(notebook, canvas) {
        this.notebook = notebook;
        this.canvas = canvas;
        this.preview = document.getElementById('brushPreview');

        canvas.addEventListener('mousedown', this.onDown.bind(this));
        canvas.addEventListener('mousemove', this.onMove.bind(this));
        window.addEventListener('mouseup', this.onUp.bind(this));

        canvas.addEventListener('mouseleave', () => {
            this.onUp();
            if (this.preview) this.preview.hidden = true;
        });

        canvas.addEventListener('touchstart', this.onDown.bind(this), { passive: false });
        canvas.addEventListener('touchstart', () => {
            if (this.preview) this.preview.hidden = true;
        }, { passive: true });
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

        // Двигаем/показываем кружок и в момент клика
        this._updatePreviewPosition(e);

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
        // Двигаем кружок-индикатор под курсором (для мыши и пера, не для тача)
        this._updatePreviewPosition(e);

        if (!this.drawing) return;
        e.preventDefault();
        const { x, y } = this.pos(e);
        const added = Strokes.addPoint(this.activeStroke, x, y);
        if (added) {
            Renderer.drawLastSegment(this.activeStroke);
        }
    },

    _updatePreviewPosition(e) {
        if (!this.preview) return;

        // На тачах кружок не показываем
        if (e.touches || e.pointerType === 'touch') {
            this.preview.hidden = true;
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        this.preview.style.left = cx + 'px';
        this.preview.style.top  = cy + 'px';
        this.preview.hidden = false;
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