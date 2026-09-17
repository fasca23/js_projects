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
    }
};