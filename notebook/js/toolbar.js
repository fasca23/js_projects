const Toolbar = {
    tool: 'pen',
    color: CONFIG.DEFAULT_COLOR,

    // Два независимых размера для каждого инструмента
    sizes: {
        pen: CONFIG.DEFAULT_SIZE,
        eraser: CONFIG.DEFAULT_SIZE * 4   // ластик обычно толще
    },

    // Геттер: всегда отдаёт размер активного инструмента.
    // Благодаря этому Input и остальной код продолжают читать Toolbar.size
    // и ничего менять в других файлах не надо.
    get size() {
        return this.sizes[this.tool];
    },
    set size(v) {
        this.sizes[this.tool] = v;
    },

    notebook: null,

    init(notebook) {
        this.notebook = notebook;

        this.penBtn = document.getElementById('btnPen');
        this.eraserBtn = document.getElementById('btnEraser');
        this.undoBtn = document.getElementById('btnUndo');
        this.redoBtn = document.getElementById('btnRedo');
        this.clearBtn = document.getElementById('btnClear');
        this.gridBtn = document.getElementById('btnGrid');
        this.colorInput = document.getElementById('colorPicker');
        this.sizeInput = document.getElementById('sizeSlider');
        this.sizeLabel = document.getElementById('sizeLabel');
        this.paletteEl = document.getElementById('palette');

        // Инструменты
        this.penBtn.onclick = () => this.setTool('pen');
        this.eraserBtn.onclick = () => this.setTool('eraser');

        // Действия
        this.undoBtn.onclick = () => notebook.undo();
        this.redoBtn.onclick = () => notebook.redo();
        this.clearBtn.onclick = () => {
            if (confirm('Очистить весь блокнот?')) notebook.clearAll();
        };
        this.gridBtn.onclick = () => notebook.toggleGrid();

        // Цвет
        this.colorInput.value = this.color;
        this.colorInput.oninput = (e) => {
            this.color = e.target.value;
            this.setTool('pen');
            this.highlightSwatch(null);
        };

        // Ползунок толщины — меняет размер ТОЛЬКО активного инструмента
        this.sizeInput.min = CONFIG.MIN_SIZE;
        this.sizeInput.max = CONFIG.MAX_SIZE;
        this.sizeInput.oninput = (e) => {
            this.size = Number(e.target.value);
            this.sizeLabel.textContent = this.size;
        };

        // Палитра
        this.buildPalette();

        // Стартуем с ручки и подтягиваем её сохранённый размер
        this.setTool('pen');
        this.updateUndoRedo();
    },

    buildPalette() {
        this.paletteEl.innerHTML = '';
        CONFIG.PALETTE.forEach(c => {
            const b = document.createElement('button');
            b.className = 'swatch';
            b.style.background = c;
            b.dataset.color = c;
            b.title = c;
            b.onclick = () => {
                this.color = c;
                this.colorInput.value = c;
                this.setTool('pen');
                this.highlightSwatch(c);
            };
            this.paletteEl.appendChild(b);
        });
        this.highlightSwatch(this.color);
    },

    highlightSwatch(color) {
        this.paletteEl.querySelectorAll('.swatch').forEach(el => {
            el.classList.toggle('active', el.dataset.color === color);
        });
    },

    setTool(t) {
        this.tool = t;
        this.penBtn.classList.toggle('active', t === 'pen');
        this.eraserBtn.classList.toggle('active', t === 'eraser');

        // Подтягиваем сохранённый размер для выбранного инструмента
        // и синхронизируем UI ползунка
        const s = this.sizes[t];
        this.sizeInput.value = s;
        this.sizeLabel.textContent = s;
    },

    updateUndoRedo() {
        this.undoBtn.disabled = Strokes.history.length === 0;
        this.redoBtn.disabled = Strokes.redoStack.length === 0;
    }
};