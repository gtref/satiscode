/* ==========================================================================
   SATISCODE WEB IDE MAIN APPLICATION SCRIPT
   Uses shared main IDE internals (icons, themes, TabManager)
   ========================================================================== */

import { initIcons, getFileIcon, getFolderIcon, getChevronIcon, getUiIcon } from './shared/icons.js';
import { loadTheme, applyTheme, getAvailableThemes } from './shared/themes.js';
import { TabManager } from './shared/UI/tab_manager/tabman.js';

window.getFileIcon = getFileIcon;
window.getFolderIcon = getFolderIcon;
window.getChevronIcon = getChevronIcon;
window.getUiIcon = getUiIcon;

class WebMarkdownView {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.article = containerEl?.querySelector('.md-view-content');
  }

  render(markdown = '') {
    if (!this.containerEl) return;
    if (!this.article) {
      this.article = this.containerEl.ownerDocument.createElement('article');
      this.article.className = 'md-view-content';
      this.containerEl.replaceChildren(this.article);
    }

    if (!window.marked || !window.DOMPurify) {
      this.article.textContent = markdown;
      return;
    }
    const html = window.marked.parse(markdown);
    const clean = window.DOMPurify.sanitize(html);
    this.article.innerHTML = clean;
  }
}

const translations = {
  en: {
    newFile: 'New', openFile: 'Open', openFolder: 'Open Folder', saveFile: 'Save Zip', saveAs: 'Save As',
    find: 'Find', exit: 'Exit', explorer: 'Explorer',
    sourceLanguage: 'Select source language', sourceAuto: 'Auto', sourceC: 'C', sourceCpp: 'C++', sourceCss: 'CSS',
    sourceJavaScript: 'JavaScript', sourceHtml: 'HTML', sourceTypeScript: 'TypeScript', sourceJson: 'JSON', sourcePlainText: 'Plain Text', sourcePython: 'Python', sourceMarkdown: 'Markdown',
    interfaceTheme: 'Interface theme', darkTheme: 'Dark Theme', lightTheme: 'Light Theme',
    changeLanguage: 'Change interface language', sidebarViews: 'Sidebar views', problems: 'Problems',
    resizeProblems: 'Resize Problems panel', noProblems: 'No problems detected', treePrompt: 'Open a file to browse its folder',
    findInFile: 'Find in file', findPlaceholder: 'Find...', previousMatch: 'Previous match', nextMatch: 'Next match', close: 'Close',
    markdownViewMode: 'Markdown view mode', markdownPreview: 'Preview', markdownEdit: 'Edit',
    welcome: 'Welcome to Satiscode Web IDE', namePrompt: 'What should we call you?', yourName: 'Your name',
    notNow: 'Not now', continue: 'Continue', languageReady: 'language: ready', languagePlainText: 'language: plain text',
    operational: 'satiscode: Operational', fixsonReady: 'fixson: ready', fixsonStarting: 'fixson: starting'
  },
  es: {
    newFile: 'Nuevo', openFile: 'Abrir archivo', openFolder: 'Abrir carpeta', saveFile: 'Guardar Zip', saveAs: 'Guardar como',
    find: 'Buscar', exit: 'Salir', explorer: 'Explorador',
    sourceLanguage: 'Seleccionar lenguaje del archivo', sourceAuto: 'Automático', sourceC: 'C', sourceCpp: 'C++', sourceCss: 'CSS',
    sourceJavaScript: 'JavaScript', sourceHtml: 'HTML', sourceTypeScript: 'TypeScript', sourceJson: 'JSON', sourcePlainText: 'Texto sin formato', sourcePython: 'Python', sourceMarkdown: 'Markdown',
    interfaceTheme: 'Tema de la interfaz', darkTheme: 'Tema oscuro', lightTheme: 'Tema claro',
    changeLanguage: 'Cambiar el idioma de la interfaz', sidebarViews: 'Vistas de la barra lateral', problems: 'Problemas',
    resizeProblems: 'Cambiar el tamaño del panel de problemas', noProblems: 'No se detectaron problemas', treePrompt: 'Abre un archivo para explorar su carpeta',
    findInFile: 'Buscar en el archivo', findPlaceholder: 'Buscar...', previousMatch: 'Coincidencia anterior', nextMatch: 'Siguiente coincidencia', close: 'Cerrar',
    markdownViewMode: 'Modo de vista de Markdown', markdownPreview: 'Vista previa', markdownEdit: 'Editar',
    welcome: 'Te damos la bienvenida a Satiscode Web IDE', namePrompt: '¿Cómo te llamamos?', yourName: 'Tu nombre',
    notNow: 'Ahora no', continue: 'Continuar', languageReady: 'idioma: listo', languagePlainText: 'idioma: texto sin formato',
    operational: 'satiscode: operativo', fixsonReady: 'fixson: listo', fixsonStarting: 'fixson: iniciando'
  }
};

let currentFilePath = null;
let manualLanguage = null;
let currentLanguage = 'en';
let fixsonStartPromise = null;
const fixsonDocuments = new WeakMap();
let fixsonRequestId = 0;
const fixsonPendingRequests = new Map();
let currentProblems = [];

let appSettings = await window.api.getSettings();
currentLanguage = appSettings.language || 'en';

const languageByExtension = new Map([
  ['.html', 'html'], ['.htm', 'html'], ['.css', 'css'], ['.scss', 'scss'],
  ['.js', 'javascript'], ['.jsx', 'javascript'], ['.mjs', 'javascript'],
  ['.ts', 'typescript'], ['.tsx', 'typescript'], ['.json', 'json'],
  ['.py', 'python'], ['.md', 'markdown'], ['.markdown', 'markdown'],
  ['.c', 'c'], ['.cpp', 'cpp'], ['.cc', 'cpp'], ['.h', 'cpp']
]);

function extensionForPath(filePath) {
  if (!filePath) return '';
  const fileName = filePath.split(/[\\/]/).pop() || '';
  const extIndex = fileName.lastIndexOf('.');
  return extIndex >= 0 ? fileName.slice(extIndex).toLowerCase() : '';
}

function languageForPath(filePath) {
  const ext = extensionForPath(filePath);
  return languageByExtension.get(ext) || 'plaintext';
}

function activeLanguage(filePath) {
  return manualLanguage || languageForPath(filePath || '');
}

function updateSourceLanguageLabel() {
  const lang = activeLanguage(currentFilePath);
  const labels = translations[currentLanguage] || translations.en;
  const languageLabels = {
    auto: labels.sourceAuto, c: labels.sourceC, cpp: labels.sourceCpp, css: labels.sourceCss,
    javascript: labels.sourceJavaScript, html: labels.sourceHtml, typescript: labels.sourceTypeScript,
    json: labels.sourceJson, python: labels.sourcePython, plaintext: labels.sourcePlainText, markdown: labels.sourceMarkdown
  };
  const icons = { auto: '◇', c: 'C', cpp: 'C++', css: '#', javascript: 'JS', html: '<>', typescript: 'TS', json: '{}', python: 'Py', plaintext: 'Aa', markdown: 'MD' };

  const labelEl = document.getElementById('source-language-label');
  const badgeEl = document.querySelector('#source-language-btn .language-badge');
  if (labelEl) labelEl.textContent = languageLabels[lang] || languageLabels.auto;
  if (badgeEl) badgeEl.textContent = icons[lang] || icons.auto;
}

function renderProblems() {
  const list = document.getElementById('problems-list');
  const count = document.getElementById('problems-count');
  if (count) count.textContent = String(currentProblems.length);

  if (list) {
    const labels = translations[currentLanguage] || translations.en;
    if (currentProblems.length > 0) {
      list.innerHTML = currentProblems.map((prob) => `
        <div class="problem">
          <span class="problem-icon">×</span>
          <span class="problem-message">${escapeHtml(prob.message)}</span>
        </div>
      `).join('');
    } else {
      const nameNotice = appSettings.userName ? `, ${escapeHtml(appSettings.userName)}` : '';
      list.innerHTML = `<div id="no-problems">${labels.noProblems}${nameNotice}.</div>`;
    }
  }
}

function escapeHtml(val) {
  return String(val).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

function applyInterfaceLanguage(lang) {
  currentLanguage = translations[lang] ? lang : 'en';
  const labels = translations[currentLanguage];
  document.documentElement.lang = currentLanguage;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    if (labels[el.dataset.i18n]) el.textContent = labels[el.dataset.i18n];
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    if (labels[el.dataset.i18nAria]) el.setAttribute('aria-label', labels[el.dataset.i18nAria]);
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    if (labels[el.dataset.i18nTitle]) el.title = labels[el.dataset.i18nTitle];
  });

  renderProblems();
  updateSourceLanguageLabel();
}

// Initialize Monaco and Main App
require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.57.0/min/vs' } });

require(['vs/editor/editor.main'], async function (monaco) {
  window.monaco = monaco;

  // Initialize SVG Icon system
  await initIcons();
  if (document.getElementById('language-button-icon')) {
    document.getElementById('language-button-icon').innerHTML = getUiIcon('translate') || '🌐';
  }

  async function loadWebTheme(themeId) {
    const response = await fetch(`./shared/themes/${themeId}.json`);
    return await response.json();
  }

  async function applyWebTheme(themeId) {
    try {
      const theme = await loadWebTheme(themeId);
      const root = document.documentElement;
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
      });
      if (window.monaco && window.editor) monaco.editor.setTheme(theme.monacoTheme);
    } catch {
      monaco.editor.setTheme(themeId === 'light' ? 'vs' : 'vs-dark');
    }
  }

  const savedTheme = appSettings.theme || 'dark';
  document.getElementById('theme-select').value = savedTheme;
  await applyWebTheme(savedTheme);

  window.editor = monaco.editor.create(document.getElementById('editor'), {
    value: '',
    language: 'plaintext',
    theme: savedTheme === 'light' ? 'vs' : 'vs-dark',
    automaticLayout: true
  });

  const markdownView = new WebMarkdownView(document.getElementById('markdown-preview'));

  function updateMarkdownDisplay(tab) {
    const isMarkdown = Boolean(tab && ['.md', '.markdown'].includes(extensionForPath(tab.filePath || '')));
    const isPreview = isMarkdown && tab.markdownMode !== 'edit';
    document.getElementById('markdown-mode-controls').hidden = !isMarkdown;
    document.getElementById('markdown-preview-button').setAttribute('aria-pressed', String(isPreview));
    document.getElementById('markdown-edit-button').setAttribute('aria-pressed', String(isMarkdown && !isPreview));
    document.getElementById('editor').hidden = isPreview;
    document.getElementById('markdown-preview').hidden = !isPreview;
    if (isPreview) markdownView.render(tab.model.getValue());
  }

  // --- FIXSON JSON LSP Integration ---
  window.api.onFixsonMessage((msg) => {
    if (msg.method === 'textDocument/publishDiagnostics') {
      const tab = tabManager.tabs.find((tab) => fixsonDocuments.get(tab)?.uri === msg.params?.uri);
      if (!tab) return;
      const diagnostics = msg.params?.diagnostics || [];
      fixsonDocuments.get(tab).diagnostics = diagnostics;
      const markers = diagnostics.map((d) => ({
        startLineNumber: d.range.start.line + 1,
        startColumn: d.range.start.character + 1,
        endLineNumber: d.range.end.line + 1,
        endColumn: d.range.end.character + 1,
        message: d.message,
        severity: monaco.MarkerSeverity.Error,
        source: 'fixson'
      }));
      monaco.editor.setModelMarkers(tab.model, 'fixson', markers);
      if (tab !== tabManager.getActiveTab()) return;
      currentProblems = diagnostics;
      renderProblems();
    } else if (msg.id !== undefined && fixsonPendingRequests.has(msg.id)) {
      const request = fixsonPendingRequests.get(msg.id);
      fixsonPendingRequests.delete(msg.id);
      if (msg.error) request.reject(msg.error); else request.resolve(msg.result);
    }
  });

  async function startFixsonServer(tab = tabManager.getActiveTab()) {
    if (!tab) return null;
    if (!fixsonStartPromise) fixsonStartPromise = window.api.startFixson();
    await fixsonStartPromise;
    let document = fixsonDocuments.get(tab);
    if (!document) {
      document = {
        uri: tab.filePath ? monaco.Uri.file(tab.filePath).toString() : `untitled:${tab.id}`,
        version: 1,
        diagnostics: []
      };
      fixsonDocuments.set(tab, document);
      window.api.sendFixsonMessage({
        method: 'textDocument/didOpen',
        params: {
          textDocument: {
            uri: document.uri,
            languageId: 'json',
            version: document.version,
            text: tab.model.getValue()
          }
        }
      });
    }
    return document;
  }

  monaco.languages.registerCompletionItemProvider('json', {
    triggerCharacters: ['"'],
    provideCompletionItems: async () => {
      const document = await startFixsonServer();
      if (!document) return { suggestions: [] };
      const id = ++fixsonRequestId;
      return new Promise((resolve, reject) => {
        fixsonPendingRequests.set(id, { resolve, reject });
        window.api.sendFixsonMessage({
          id,
          method: 'textDocument/completion',
          params: { textDocument: { uri: document.uri } }
        });
      }).then((res) => {
        const items = res?.items || [];
        return {
          suggestions: items.map((item) => ({
            label: item.label,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: `"${item.label}": ""`
          }))
        };
      }).catch(() => ({ suggestions: [] }));
    }
  });

  window.editor.onDidChangeModelContent(async () => {
    const activeTab = tabManager.getActiveTab();
    if (activeTab && !activeTab.isDirty) {
      activeTab.isDirty = true;
      tabManager.render();
    }

    if (activeTab && activeLanguage(currentFilePath) === 'json') {
      const text = activeTab.model.getValue();
      const document = await startFixsonServer(activeTab);
      window.api.sendFixsonMessage({
        method: 'textDocument/didChange',
        params: {
          textDocument: { uri: document.uri, version: ++document.version },
          contentChanges: [{ text }]
        }
      });
    }
  });

  async function saveTab(tab) {
    if (!tab) return false;
    const savedPath = await window.api.saveFile({ filePath: tab.filePath, content: tab.model.getValue() });
    if (!savedPath) return false;

    tab.filePath = savedPath;
    tab.title = savedPath.split(/[\\/]/).pop();
    tab.isDirty = false;

    if (tab.id === tabManager.activeTabId) {
      currentFilePath = savedPath;
      monaco.editor.setModelLanguage(tab.model, languageForPath(savedPath));
      updateMarkdownDisplay(tab);
      updateSourceLanguageLabel();
    }
    tabManager.render();
    await refreshDirectory();
    return true;
  }

  const tabManager = new TabManager(
    document.getElementById('tab-bar'),
    (tab) => {
      if (tab) {
        manualLanguage = null;
        currentFilePath = tab.filePath;
        window.editor.setModel(tab.model);
        monaco.editor.setModelLanguage(tab.model, activeLanguage(currentFilePath));
        updateMarkdownDisplay(tab);
        updateSourceLanguageLabel();

        if (activeLanguage(currentFilePath) === 'json') {
          currentProblems = fixsonDocuments.get(tab)?.diagnostics || [];
          renderProblems();
          startFixsonServer(tab);
        } else {
          currentProblems = [];
          monaco.editor.setModelMarkers(window.editor.getModel(), 'fixson', []);
          renderProblems();
        }
      } else {
        currentFilePath = null;
        const emptyModel = monaco.editor.createModel('', 'plaintext');
        window.editor.setModel(emptyModel);
        updateMarkdownDisplay(null);
      }
    },
    (tab) => saveTab(tab)
  );

  let untitledCounter = 1;
  function createNewTab() {
    manualLanguage = null;
    const title = `Untitled-${untitledCounter++}`;
    const model = monaco.editor.createModel('', 'plaintext');
    tabManager.openTab(null, model, title);
  }

  tabManager.onNewTabRequest = () => createNewTab();

  async function refreshDirectory() {
    const workspacePath = await window.api.getWorkspacePath();
    const entries = await window.api.listDirectory(workspacePath);
    const treeRoot = document.getElementById('tree-root');
    treeRoot.innerHTML = '';

    entries.forEach((entry) => {
      const row = document.createElement('div');
      row.className = 'tree-entry';
      row.title = entry.path;

      const icon = document.createElement('span');
      icon.className = 'tree-icon';
      icon.innerHTML = getFileIcon(entry.name);

      const label = document.createElement('span');
      label.textContent = entry.name;

      row.append(icon, label);
      treeRoot.appendChild(row);

      row.addEventListener('click', async () => {
        const file = await window.api.readFile(entry.path);
        if (file) {
          const existingTab = tabManager.getTabByFilePath(file.path);
          if (existingTab) {
            tabManager.setActive(existingTab.id);
          } else {
            const lang = languageForPath(file.path);
            const model = monaco.editor.createModel(file.content || '', lang);
            tabManager.openTab(file.path, model, file.path.split(/[\\/]/).pop());
          }
        }
      });
    });
  }

  await refreshDirectory();

  // Open package.json or first file automatically
  const dirFiles = await window.api.listDirectory();
  if (dirFiles && dirFiles.length > 0) {
    const targetFile = dirFiles.find((f) => f.name === 'package.json') || dirFiles[0];
    const first = await window.api.readFile(targetFile.path);
    const model = monaco.editor.createModel(first.content, languageForPath(first.path));
    tabManager.openTab(first.path, model, first.path.split(/[\\/]/).pop());
  } else {
    createNewTab();
  }

  // Bind Toolbar Buttons
  document.getElementById('new-btn').addEventListener('click', () => createNewTab());
  document.getElementById('open-btn').addEventListener('click', async () => {
    const file = await window.api.openFile();
    if (file) {
      const model = monaco.editor.createModel(file.content, languageForPath(file.path));
      tabManager.openTab(file.path, model, file.path.split(/[\\/]/).pop());
      await refreshDirectory();
    }
  });
  document.getElementById('open-folder-btn').addEventListener('click', async () => {
    const folderPath = await window.api.openFolder();
    if (folderPath) await refreshDirectory();
  });
  document.getElementById('save-btn').addEventListener('click', async () => {
    await window.api.saveProjectZip();
  });

  // Source Language Dropdown
  document.getElementById('source-language-btn').addEventListener('click', () => {
    const options = document.getElementById('source-language-options');
    options.hidden = !options.hidden;
  });
  document.querySelectorAll('[data-source-language]').forEach((option) => {
    option.addEventListener('click', () => {
      const lang = option.dataset.sourceLanguage;
      manualLanguage = lang === 'auto' ? null : lang;
      const selectedLanguage = activeLanguage(currentFilePath);
      monaco.editor.setModelLanguage(window.editor.getModel(), selectedLanguage);
      if (selectedLanguage === 'json') startFixsonServer();
      updateSourceLanguageLabel();
      document.getElementById('source-language-options').hidden = true;
    });
  });

  // Theme Select
  document.getElementById('theme-select').addEventListener('change', async (event) => {
    appSettings = await window.api.setTheme(event.target.value);
    await applyWebTheme(event.target.value);
  });

  // Interface Language Menu
  const languageButton = document.getElementById('language-button');
  const languageOptions = document.getElementById('language-options');
  languageButton.addEventListener('click', () => {
    languageOptions.hidden = !languageOptions.hidden;
  });
  languageOptions.addEventListener('click', async (event) => {
    const option = event.target.closest('[data-language]');
    if (!option) return;
    appSettings = await window.api.setLanguage(option.dataset.language);
    applyInterfaceLanguage(appSettings.language);
    languageOptions.hidden = true;
  });

  // Markdown controls
  document.getElementById('markdown-preview-button').addEventListener('click', () => {
    const tab = tabManager.getActiveTab();
    if (!tab) return;
    tab.markdownMode = 'preview';
    updateMarkdownDisplay(tab);
  });
  document.getElementById('markdown-edit-button').addEventListener('click', () => {
    const tab = tabManager.getActiveTab();
    if (!tab) return;
    tab.markdownMode = 'edit';
    updateMarkdownDisplay(tab);
    window.editor.focus();
  });

  // Find Dialog
  let findMatches = [];
  let currentMatchIndex = -1;
  let findDecorations = [];

  function openFindDialog() {
    const dialog = document.getElementById('find-dialog');
    dialog.classList.remove('hidden');
    const input = document.getElementById('find-input');
    input.focus();
    input.select();
  }

  function closeFindDialog() {
    document.getElementById('find-dialog').classList.add('hidden');
    document.getElementById('find-input').value = '';
    findDecorations = window.editor.deltaDecorations(findDecorations, []);
    findMatches = [];
    currentMatchIndex = -1;
    window.editor.focus();
  }

  document.getElementById('find-btn').addEventListener('click', openFindDialog);
  document.getElementById('find-close-btn').addEventListener('click', closeFindDialog);
  document.getElementById('find-input').addEventListener('input', (event) => {
    const model = window.editor.getModel();
    findDecorations = window.editor.deltaDecorations(findDecorations, []);
    const query = event.target.value;
    if (!query) {
      findMatches = [];
      currentMatchIndex = -1;
      document.getElementById('find-match-count').textContent = 'No results';
      return;
    }
    findMatches = model.findMatches(query, true, false, false, null, false);
    currentMatchIndex = findMatches.length > 0 ? 0 : -1;
    const decorations = findMatches.map((m) => ({
      range: m.range,
      options: { inlineClassName: 'find-match-highlight' }
    }));
    findDecorations = window.editor.deltaDecorations(findDecorations, decorations);
    if (currentMatchIndex >= 0) {
      const range = findMatches[currentMatchIndex].range;
      window.editor.revealRangeInCenter(range);
      window.editor.setSelection(range);
    }
    document.getElementById('find-match-count').textContent = findMatches.length
      ? `${currentMatchIndex + 1}/${findMatches.length}`
      : 'No results';
  });

  // Name Dialog Setup
  const nameDialog = document.getElementById('name-setup-dialog');
  const nameInput = document.getElementById('user-name-input');
  document.getElementById('name-setup-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    appSettings = await window.api.setUserName(nameInput.value);
    nameDialog.close();
    renderProblems();
  });
  document.getElementById('skip-name-setup').addEventListener('click', async () => {
    appSettings = await window.api.setUserName('');
    nameDialog.close();
  });

  if (!appSettings.namePromptCompleted) {
    nameDialog.showModal();
    nameInput.focus();
  }

  applyInterfaceLanguage(appSettings.language || 'en');
});
