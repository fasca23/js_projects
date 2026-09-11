const Storage = {
    save(strokes) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(strokes));
            return true;
        } catch (e) {
            console.warn('Storage.save error:', e);
            return false;
        }
    },

    load() {
        try {
            const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (!raw) return [];
            const data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.warn('Storage.load error:', e);
            return [];
        }
    },

    clear() {
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
        } catch (e) {
            console.warn('Storage.clear error:', e);
        }
    }
};