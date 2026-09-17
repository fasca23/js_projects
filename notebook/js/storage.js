const Storage = {
    // ============================================
    //  Индекс страниц: список id и номер активной
    // ============================================

    loadIndex() {
        try {
            const raw = localStorage.getItem(CONFIG.STORAGE_INDEX_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (!data || !Array.isArray(data.pages)) return null;
            return data;
        } catch (e) {
            console.warn('Storage.loadIndex error:', e);
            return null;
        }
    },

    saveIndex(index) {
        try {
            localStorage.setItem(CONFIG.STORAGE_INDEX_KEY, JSON.stringify(index));
            return true;
        } catch (e) {
            console.warn('Storage.saveIndex error:', e);
            return false;
        }
    },

    // ============================================
    //  Одна страница: массив штрихов
    // ============================================

    loadPage(pageId) {
        try {
            const raw = localStorage.getItem(CONFIG.STORAGE_PAGE_PREFIX + pageId);
            if (!raw) return [];
            const data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.warn('Storage.loadPage error:', e);
            return [];
        }
    },

    savePage(pageId, strokesSerialized) {
        try {
            localStorage.setItem(
                CONFIG.STORAGE_PAGE_PREFIX + pageId,
                JSON.stringify(strokesSerialized)
            );
            return true;
        } catch (e) {
            console.warn('Storage.savePage error:', e);
            return false;
        }
    },

    // ============================================
    //  Утилиты
    // ============================================

    clearAllPages() {
        try {
            const idx = this.loadIndex();
            if (idx && Array.isArray(idx.pages)) {
                idx.pages.forEach(id => {
                    localStorage.removeItem(CONFIG.STORAGE_PAGE_PREFIX + id);
                });
            }
            localStorage.removeItem(CONFIG.STORAGE_INDEX_KEY);
        } catch (e) {
            console.warn('Storage.clearAllPages error:', e);
        }
    },

        // ============================================
    //  Экспорт / импорт всех данных блокнота
    // ============================================

    /**
     * Собирает объект со всеми страницами блокнота для сохранения в файл.
     * Читает ТОЛЬКО ключи с префиксом CONFIG.STORAGE_PAGE_PREFIX
     * и CONFIG.STORAGE_INDEX_KEY.
     */
    exportAll() {
        const index = this.loadIndex() || { pages: [], active: 0 };
        const pages = {};

        (index.pages || []).forEach(id => {
            pages[id] = this.loadPage(id);
        });

        return {
            app: 'notebook',
            version: 1,
            exportedAt: new Date().toISOString(),
            pagesCount: (index.pages || []).length,
            activeIndex: index.active || 0,
            pages: pages
        };
    },

    /**
     * Проверяет, что файл наш и что формат понятен.
     * Ничего не пишет в localStorage.
     */
    validateImport(data) {
        if (!data || typeof data !== 'object') {
            return { ok: false, error: 'Файл не содержит JSON-объекта' };
        }
        if (data.app !== 'notebook') {
            return { ok: false, error: 'Это файл другого приложения' };
        }
        if (typeof data.version !== 'number' || data.version < 1) {
            return { ok: false, error: 'Неизвестная версия файла' };
        }
        if (!data.pages || typeof data.pages !== 'object') {
            return { ok: false, error: 'В файле нет данных страниц' };
        }
        return { ok: true };
    },

    /**
     * Удаляет из localStorage ТОЛЬКО наши ключи — notebook_page_* и
     * notebook_pages_index. Ничего чужого (csrf, сессии и т.п.) не трогает.
     */
    clearNotebookKeys() {
        try {
            const idx = this.loadIndex();
            if (idx && Array.isArray(idx.pages)) {
                idx.pages.forEach(id => {
                    localStorage.removeItem(CONFIG.STORAGE_PAGE_PREFIX + id);
                });
            }
            localStorage.removeItem(CONFIG.STORAGE_INDEX_KEY);
        } catch (e) {
            console.warn('Storage.clearNotebookKeys error:', e);
        }
    },

    /**
     * Заменяет содержимое блокнота данными из файла.
     * Порядок:
     *   1. Валидация уже прошла до вызова.
     *   2. Собираем id страниц из файла, обрезаем/дополняем до MAX_PAGES.
     *   3. Удаляем старые notebook_* ключи.
     *   4. Пишем новые.
     *   5. Возвращаем актуальный { pages: [...], active: N }
     *      чтобы Notebook мог обновить своё состояние.
     */
    importAll(data) {
        const max = CONFIG.MAX_PAGES;

        // id страниц из файла
        let pageIds = Object.keys(data.pages || {});

        // Сортируем "p1, p2, ..., p10" — числовая сортировка по цифрам
        pageIds.sort((a, b) => {
            const na = parseInt(String(a).replace(/\D/g, ''), 10) || 0;
            const nb = parseInt(String(b).replace(/\D/g, ''), 10) || 0;
            return na - nb;
        });

        // Обрезаем до MAX_PAGES
        pageIds = pageIds.slice(0, max);

        // Дополняем пустыми, если в файле было меньше
        let nextNum = 1;
        while (pageIds.length < max) {
            let candidate = 'p' + nextNum;
            while (pageIds.includes(candidate)) {
                nextNum++;
                candidate = 'p' + nextNum;
            }
            pageIds.push(candidate);
            nextNum++;
        }

        // Удаляем старые ключи
        this.clearNotebookKeys();

        // Пишем новые
        pageIds.forEach(id => {
            const strokes = Array.isArray(data.pages[id]) ? data.pages[id] : [];
            if (strokes.length) {
                this.savePage(id, strokes);
            }
        });

        const active = Math.min(
            Math.max(0, data.activeIndex || 0),
            pageIds.length - 1
        );

        const index = { pages: pageIds, active };
        this.saveIndex(index);

        return index;
    },
};