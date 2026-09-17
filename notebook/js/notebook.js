const Notebook = {
    canvas: null,
    _ro: null,

    // Текущее состояние
    pageIndex: [],           // ["p1","p2","p3"]
    activeIdx: 0,            // индекс в pageIndex
    currentPageNumber: 1,    // 1-based, для UI

    init() {
        this.canvas = document.getElementById('board');

        Renderer.init(this.canvas);
        Toolbar.init(this);

        this.loadOrCreateIndex();

        // Загружаем активную страницу в Strokes
        this.loadActivePage();

        Renderer.redrawAll(Strokes.list);

        Input.init(this, this.canvas);
        Toolbar.updateUndoRedo();
        Toolbar.updatePageControls();

        // Реагируем на изменение размеров РОДИТЕЛЯ
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

    // ============================================
    //  Инициализация индекса страниц
    // ============================================

    loadOrCreateIndex() {
        const saved = Storage.loadIndex();

        if (saved && Array.isArray(saved.pages) && saved.pages.length) {
            // Обрезаем, если MAX_PAGES уменьшили
            const trimmed = saved.pages.slice(0, CONFIG.MAX_PAGES);
            this.pageIndex = trimmed;
            this.activeIdx = Math.min(saved.active || 0, trimmed.length - 1);
        } else {
            // Первый запуск: создаём CONFIG.MAX_PAGES пустых страниц
            this.pageIndex = [];
            for (let i = 0; i < CONFIG.MAX_PAGES; i++) {
                this.pageIndex.push('p' + (i + 1));
            }
            this.activeIdx = 0;
            Storage.saveIndex({ pages: this.pageIndex, active: this.activeIdx });
        }

        this.currentPageNumber = this.activeIdx + 1;
    },

    // ============================================
    //  Загрузка / сохранение активной страницы
    // ============================================

    loadActivePage() {
        const id = this.pageIndex[this.activeIdx];
        const data = Storage.loadPage(id);
        Strokes.deserialize(data);
    },

    saveActivePage() {
        const id = this.pageIndex[this.activeIdx];
        Storage.savePage(id, Strokes.serialize());
    },

    // ============================================
    //  Переключение страниц
    // ============================================

    prevPage() {
        if (this.activeIdx <= 0) return;
        this.gotoPage(this.activeIdx - 1);
    },

    nextPage() {
        if (this.activeIdx >= this.pageIndex.length - 1) return;
        this.gotoPage(this.activeIdx + 1);
    },

    gotoPage(idx) {
        if (idx === this.activeIdx) return;
        if (idx < 0 || idx >= this.pageIndex.length) return;

        // 1. Сохранить текущую
        this.saveActivePage();

        // 2. Переключиться
        this.activeIdx = idx;
        this.currentPageNumber = idx + 1;

        // 3. Загрузить новую
        this.loadActivePage();
        Renderer.redrawAll(Strokes.list);

        // 4. Обновить UI
        Storage.saveIndex({ pages: this.pageIndex, active: this.activeIdx });
        Toolbar.updateUndoRedo();
        Toolbar.updatePageControls();
    },

    // ============================================
    //  Общий persist (вызывается после каждого штриха)
    // ============================================

    persist() {
        this.saveActivePage();
        Toolbar.updateUndoRedo();
    },

    // ============================================
    //  Undo / Redo / Clear — в рамках активной страницы
    // ============================================

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
    },

        // ============================================
    //  Импорт / экспорт
    // ============================================

    exportToFile() {
        const data = Storage.exportAll();

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });

        // Имя файла: notebook-2026-09-17.json
        const d = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const fname = `notebook-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fname;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    async importFromFile(file) {
        if (!file) return;

        let data;
        try {
            const text = await file.text();
            data = JSON.parse(text);
        } catch (e) {
            alert('Не удалось прочитать файл: ' + e.message);
            return;
        }

        const check = Storage.validateImport(data);
        if (!check.ok) {
            alert('Неверный файл: ' + check.error);
            return;
        }

        const msg = `Заменить текущий блокнот данными из файла?\n\n`
                  + `Страниц в файле: ${data.pagesCount || Object.keys(data.pages).length}\n`
                  + `Текущее содержимое всех страниц будет потеряно.`;

        if (!confirm(msg)) return;

        // Применяем
        const newIndex = Storage.importAll(data);

        // Обновляем состояние Notebook
        this.pageIndex = newIndex.pages;
        this.activeIdx = newIndex.active;
        this.currentPageNumber = newIndex.active + 1;

        // Перезагружаем активную страницу и перерисовываем
        this.loadActivePage();
        Renderer.redrawAll(Strokes.list);

        Toolbar.updateUndoRedo();
        Toolbar.updatePageControls();

        // Небольшое уведомление
        alert('Блокнот загружен из файла.');
    },
};