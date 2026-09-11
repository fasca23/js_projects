const Notebook = {
    canvas: null,
    _ro: null,

    init() {
        this.canvas = document.getElementById('board');
        Renderer.init(this.canvas);
        Toolbar.init(this);

        Strokes.deserialize(Storage.load());
        Renderer.redrawAll(Strokes.list);
        Toolbar.updateUndoRedo();

        Input.init(this, this.canvas);

        // Реагируем на изменение размеров РОДИТЕЛЯ (контейнера сайта),
        // а не только окна. Это критично для встраивания.
        const parent = this.canvas.parentElement;
        if (window.ResizeObserver) {
            this._ro = new ResizeObserver(() => {
                Renderer.resize();
                Renderer.redrawAll(Strokes.list);
            });
            this._ro.observe(parent);
        } else {
            window.addEventListener('resize', () => {
                Renderer.resize();
                Renderer.redrawAll(Strokes.list);
            });
        }
    },

    persist() {
        Storage.save(Strokes.serialize());
        Toolbar.updateUndoRedo();
    },

    undo() {
        if (Strokes.undo()) {
            Renderer.redrawAll(Strokes.list);
            this.persist();
        }
    },

    redo() {
        if (Strokes.redo()) {
            Renderer.redrawAll(Strokes.list);
            this.persist();
        }
    },

    clearAll() {
        Strokes.clear();
        Renderer.redrawAll(Strokes.list);
        this.persist();
    },

    toggleGrid() {
        const on = Renderer.toggleGrid();
        Toolbar.gridBtn.classList.toggle('active', on);
        Renderer.redrawAll(Strokes.list);
    }
};