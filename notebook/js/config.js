const CONFIG = {
    STORAGE_KEY: 'notebook_strokes_v1',
    HISTORY_LIMIT: 50,
    
    DEFAULT_COLOR: '#00ff41',
    DEFAULT_SIZE: 3,
    MIN_SIZE: 1,
    MAX_SIZE: 40,
    
    MIN_POINT_DIST: 2,       // минимальное расстояние между точками (px)
    MAX_POINTS_PER_STROKE: 5000,
    
    PALETTE: ['#00ff41', '#ffd700', '#ffffff', '#ff0040', '#00aaff', '#cc44cc'],
    
    COLORS: {
        CANVAS_BG: '#000000',
        ERASER: '#000000',
        GRID: '#0a2a0a',
        GRID_STEP: 24
    },
    
    MAX_PAGES: 5,
    STORAGE_PAGE_PREFIX: 'notebook_page_',
    STORAGE_INDEX_KEY: 'notebook_pages_index',
};