const AVAILABLE_THEMES = ['dark', 'light']; 
const themeCache = new Map(); 

export async function loadTheme(themeId) {
    if (themeCache.has(themeId)) return themeCache.get(themeId); 
    const response = await fetch(`./themes/${themeId}.json`); 
    const theme = await response.json(); 
    themeCache.set(themeId, theme);
    return theme; 
}

export async function applyTheme(themeId) {
    const theme = await loadTheme(themeId); 

    // 1. Apply colors to UI elements
    const root = document.documentElement; 
    Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value); 
    }); 

    // 2. Monaco theme
    if (window.monaco) monaco.editor.setTheme(theme.monacoTheme); 

    // 3. Localstorage
    localStorage.setItem('satiscode-theme', themeId); 
}

export async function getAvailableThemes() {
    return Promise.all(AVAILABLE_THEMES.map(loadTheme)); 
}