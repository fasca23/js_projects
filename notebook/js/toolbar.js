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
        this.prevPageBtn = document.getElementById('btnPrevPage');
        this.nextPageBtn = document.getElementById('btnNextPage');
        this.pageLabel   = document.getElementById('pageLabel');
        this.transferBtn  = document.getElementById('btnTransfer');
        this.transferMenu = document.getElementById('transferMenu');
        this.exportBtn    = document.getElementById('btnExport');
        this.importBtn    = document.getElementById('btnImport');
        this.importInput  = document.getElementById('importFileInput');
        this.exportJpgBtn = document.getElementById('btnExportJpg');
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

        this.prevPageBtn.onclick = () => notebook.prevPage();
        this.nextPageBtn.onclick = () => notebook.nextPage();

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
            this.updateBrushPreview();
        };

        // Палитра
        this.buildPalette();

        // Стартуем с ручки и подтягиваем её сохранённый размер
        this.setTool('pen');
        this.initTransferMenu(notebook);
        this.updateUndoRedo();
        this.updatePageControls();
        this.updateBrushPreview();
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
        this.updateBrushPreview();
    },

    updateUndoRedo() {
        this.undoBtn.disabled = Strokes.history.length === 0;
        this.redoBtn.disabled = Strokes.redoStack.length === 0;
    },

    updatePageControls() {
        const p = Notebook.currentPageNumber;
        const total = CONFIG.MAX_PAGES;
        this.pageLabel.textContent = p + ' / ' + total;
        this.prevPageBtn.disabled = (p <= 1);
        this.nextPageBtn.disabled = (p >= total);
    },

        initTransferMenu(notebook) {
        const openMenu = () => {
            this.transferMenu.hidden = false;
        };
        const closeMenu = () => {
            this.transferMenu.hidden = true;
        };
        const toggleMenu = (e) => {
            e.stopPropagation();
            this.transferMenu.hidden ? openMenu() : closeMenu();
        };

        // Открыть/закрыть по клику на 📦
        this.transferBtn.onclick = toggleMenu;

        // Экспорт
        this.exportBtn.onclick = (e) => {
            e.stopPropagation();
            closeMenu();
            notebook.exportToFile();
        };

        // Экспорт текущей страницы в JPG
        this.exportJpgBtn.onclick = (e) => {
            e.stopPropagation();
            closeMenu();
            notebook.exportCurrentPageToImage();
        };

        // Импорт — открыть системный диалог выбора файла
        this.importBtn.onclick = (e) => {
            e.stopPropagation();
            closeMenu();
            this.importInput.value = '';   // чтобы повторный выбор того же файла сработал
            this.importInput.click();
        };

        // Когда пользователь выбрал файл
        this.importInput.onchange = () => {
            const file = this.importInput.files && this.importInput.files[0];
            if (file) notebook.importFromFile(file);
        };

        // Клик вне меню — закрыть
        document.addEventListener('click', (e) => {
            if (this.transferMenu.hidden) return;
            if (this.transferMenu.contains(e.target)) return;
            if (e.target === this.transferBtn) return;
            closeMenu();
        });

        // Esc — закрыть
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.transferMenu.hidden) {
                closeMenu();
            }
        });
    },

    updateBrushPreview() {
        const p = document.getElementById('brushPreview');
        if (!p) return;

        const size = this.size;
        p.style.width  = size + 'px';
        p.style.height = size + 'px';

        if (this.tool === 'eraser') {
            p.className = 'brush-preview eraser';
        } else {
            p.className = 'brush-preview pen';
            p.style.color = this.color;
        }
    }

};