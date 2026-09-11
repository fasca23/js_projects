const Notebook = {
    init() {
        this.canvas = document.getElementById('board');
        Renderer.init(this.canvas);
        Toolbar.init(this);

        Strokes.deserialize(Storage.load());
        Renderer.redrawAll(Strokes.list);
        Toolbar.updateUndoRedo();

        Input.init(this, this.canvas);

        window.addEventListener('resize', () => {
            Renderer.resize();
            Renderer.redrawAll(Strokes.list);
        });
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