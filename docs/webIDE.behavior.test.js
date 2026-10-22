const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const vm = require('node:vm');
const { test } = require('node:test');

const webDir = path.join(__dirname, 'webIDE');
const read = (file) => readFileSync(file, 'utf8');

class Element {
  constructor() { this.listeners = {}; this.children = []; this.style = { setProperty() {} }; this.dataset = {}; this.classList = { add() {}, remove() {} }; }
  addEventListener(type, listener) { this.listeners[type] = listener; }
  setAttribute() {}
  querySelector() { return null; }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.append(child); }
  removeChild(child) { this.children = this.children.filter((item) => item !== child); }
  replaceChildren(...children) { this.children = children; }
  focus() {}
  showModal() {}
  click() { return this.onclick?.(); }
}

function createDocument() {
  const elements = new Map();
  const options = ['json', 'python', 'auto'].map((language) => Object.assign(new Element(), { dataset: { sourceLanguage: language } }));
  const document = {
    body: new Element(), documentElement: new Element(),
    createElement: () => new Element(),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new Element());
      return elements.get(id);
    },
    querySelector: () => new Element(),
    querySelectorAll: (selector) => selector === '[data-source-language]' ? options : []
  };
  return { document, options };
}

function createApi() {
  const { document } = createDocument();
  const downloads = [];
  const window = {};
  const errors = [];
  const context = vm.createContext({ window, document, localStorage: { getItem: () => null }, alert() {}, console: { ...console, error: (...args) => errors.push(args) },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} } });
  vm.runInContext(read(path.join(webDir, 'web-api.js')), context);
  class JSZip {
    constructor() { this.files = new Map(); downloads.push(this.files); }
    file(name, content) { this.files.set(name, content); }
    async generateAsync() { return {}; }
  }
  return { window, document, downloads, JSZip, errors };
}

test('ZIP saves report failures and persist existing and new files only as real file paths', async () => {
  const { window, downloads, JSZip, errors } = createApi();
  const api = window.api;
  assert.equal(await api.saveFile(), null);
  assert.equal(await api.saveFile({ filePath: '/workspace/missing.txt' }), null);
  assert.equal(await api.saveProjectZip(), false);
  assert.equal(await api.saveFile({ filePath: '/workspace/new.txt', content: 'keep unsaved text' }), null);
  window.JSZip = JSZip;
  assert.equal(await api.saveFile({ filePath: '/workspace/new.txt', content: 'saved' }), '/workspace/new.txt');
  assert.equal(downloads.at(-1).get('workspace/new.txt'), 'saved');
  const first = await api.saveFile({ content: '' });
  const second = await api.saveFile({ content: 'second' });
  assert.match(first, /^\/workspace\/[^/]+\.txt$/);
  assert.notEqual(first, second);
  assert.equal((await api.readFile(second)).content, 'second');
  assert.equal(downloads.at(-1).get(second.slice(1)), 'second');
  assert.equal(await api.saveProjectZip(), true);
  window.JSZip = class extends JSZip { async generateAsync() { throw new Error('export failed'); } };
  assert.equal(await api.saveFile({ filePath: first, content: 'retry me' }), null);
  assert.equal((await api.readFile(first)).content, 'retry me');
  assert.equal(errors.length, 1);
});

test('directory fallback retains nested paths and duplicate basenames in exports and listings', async () => {
  const { window, document, downloads, JSZip } = createApi();
  window.JSZip = JSZip;
  document.createElement = (tag) => {
    if (tag !== 'input') return new Element();
    const input = new Element();
    input.files = [
      { name: 'same.txt', webkitRelativePath: 'project/left/same.txt', text: async () => 'left' },
      { name: 'same.txt', webkitRelativePath: 'project/right/same.txt', text: async () => 'right' },
      { name: 'fallback.txt', text: async () => 'fallback' }
    ];
    input.onclick = () => input.onchange();
    return input;
  };
  assert.equal(await window.api.openFolder(), '/project');
  const left = await window.api.listDirectory('/project/left');
  assert.equal(left[0].name, 'same.txt');
  assert.equal(left[0].path, '/project/left/same.txt');
  await window.api.saveProjectZip();
  assert.equal(downloads.at(-1).get('project/left/same.txt'), 'left');
  assert.equal(downloads.at(-1).get('project/right/same.txt'), 'right');
  assert.equal(downloads.at(-1).get('project/fallback.txt'), 'fallback');
});

test('Markdown fails closed when either dependency is missing and sanitizes parsed output', () => {
  const source = read(path.join(webDir, 'app.js'));
  const view = source.slice(source.indexOf('class WebMarkdownView'), source.indexOf('const translations'));
  const markdown = '<img src=x onerror=alert(1)>';
  for (const window of [{}, { marked: { parse() { throw new Error('must not parse'); } } }, { DOMPurify: { sanitize() { throw new Error('must not sanitize'); } } }]) {
    const article = { set innerHTML(_) { throw new Error('unsafe HTML assignment'); } };
    vm.runInNewContext(`${view}\nnew WebMarkdownView(container).render(markdown);`, { window, markdown, container: { querySelector: () => article } });
    assert.equal(article.textContent, markdown);
  }
  const article = {};
  vm.runInNewContext(`${view}\nnew WebMarkdownView(container).render(markdown);`, {
    window: { marked: { parse: (text) => { assert.equal(text, markdown); return 'parsed'; } }, DOMPurify: { sanitize: (html) => { assert.equal(html, 'parsed'); return 'clean'; } } },
    markdown, container: { querySelector: () => article }
  });
  assert.equal(article.innerHTML, 'clean');
});

function loadModule(file, globals, exports) {
  const source = read(file).replace(/\bexport /g, '').replaceAll('import.meta.url', JSON.stringify(pathToFileURL(file).href));
  return vm.runInNewContext(`${source}\n({ ${exports.join(', ')} });`, { URL, console, ...globals });
}

test('root and shared loaders use module-relative URLs, reject HTTP failures, and resolve icon aliases', async () => {
  for (const dir of [path.join(__dirname, '..'), path.join(webDir, 'shared')]) {
    const iconsFile = path.join(dir, 'icons.js');
    const map = { ui: { newFile: 'fallback' }, extensions: { '.custom': 'custom' }, languages: { javascript: 'js', python: 'py', plaintext: 'txt', c: 'c' } };
    let ok = true;
    const icons = loadModule(iconsFile, { fetch: async (url) => {
      assert.equal(url.href, new URL('./icons/style1/icons.json', pathToFileURL(iconsFile)).href);
      return { ok, status: 404, json: async () => { assert.equal(ok, true); return map; } };
    }, console: { error() {} } }, ['initIcons', 'getFileIcon']);
    await icons.initIcons();
    for (const [file, expected] of [[null, 'fallback'], ['', 'fallback'], ['c', 'fallback'], ['README', 'fallback'], ['file.JS', 'js'], ['a.py', 'py'], ['a.txt', 'txt'], ['a.custom', 'custom'], ['a.c', 'c'], ['a.unknown', 'fallback']]) {
      assert.equal(icons.getFileIcon(file), expected);
    }
    ok = false;
    await icons.initIcons();
    assert.equal(icons.getFileIcon('a.js'), 'js');
    const themesFile = path.join(dir, 'themes.js');
    let calls = 0;
    const theme = { colors: {} };
    const themes = loadModule(themesFile, { fetch: async (url) => {
      calls++;
      assert.equal(url.href, new URL('./themes/dark.json', pathToFileURL(themesFile)).href);
      return { ok, status: 503, json: async () => { assert.equal(ok, true); return theme; } };
    } }, ['loadTheme']);
    await assert.rejects(themes.loadTheme('dark'), /dark.*503/);
    ok = true;
    assert.equal(await themes.loadTheme('dark'), theme);
    assert.equal(await themes.loadTheme('dark'), theme);
    assert.equal(calls, 2);
  }
});

async function createApp() {
  const { window } = createApi();
  const { document: appDocument, options } = createDocument();
  const messages = [];
  let starts = 0;
  let ready;
  let tabs;
  let onChange;
  let complete;
  let start;
  const started = new Promise((resolve) => { start = resolve; });
  window.api.startFixson = () => { starts++; return started; };
  const send = window.api.sendFixsonMessage;
  window.api.sendFixsonMessage = (msg) => { messages.push(msg); send(msg); };
  const model = (text, language) => ({ getValue: () => text, setValue(value) { text = value; }, language });
  const editor = { setModel(value) { this.model = value; }, getModel() { return this.model; }, getValue() { return this.model.getValue(); }, onDidChangeModelContent(cb) { onChange = cb; } };
  const monaco = { Uri: { file: (file) => ({ toString: () => `file://${file}` }) }, MarkerSeverity: { Error: 8 }, editor: { create: () => editor, createModel: model, setTheme() {}, setModelLanguage: (model, language) => { model.language = language; }, setModelMarkers: (model, owner, markers) => { model.markers = markers; } }, languages: { CompletionItemKind: { Property: 1 }, registerCompletionItemProvider: (_, provider) => { complete = provider; } } };
  const tabSource = path.join(__dirname, '..', 'UI', 'tab_manager', 'tabman.js');
  const { TabManager } = loadModule(tabSource, { confirm: () => true }, ['TabManager']);
  const require = (_, callback) => { ready = callback(monaco); };
  require.config = () => {};
  const source = read(path.join(webDir, 'app.js')).replace(/^import .*;$/gm, '');
  const context = vm.createContext({ window, document: appDocument, console, require, initIcons: async () => {}, getFileIcon: () => '', getFolderIcon() {}, getChevronIcon() {}, getUiIcon() {}, fetch: async () => ({ json: async () => ({ colors: {} }) }), TabManager: class extends TabManager { constructor(...args) { super(...args); tabs = this; } } });
  await vm.runInContext(`(async () => { ${source}\n })()`, context);
  await ready;
  return { window, document: appDocument, tabs, editor, options, model, messages, start, change: () => onChange(), complete: () => complete.provideCompletionItems(), starts: () => starts };
}

const tick = async () => { await new Promise((resolve) => setImmediate(resolve)); };

test('JSON tabs open independently and retain stable URIs, increasing versions, and tab-local diagnostics', async () => {
  const app = await createApp();
  const first = app.tabs.getActiveTab();
  app.tabs.openTab('/workspace/second.json', app.model('{}', 'json'));
  const second = app.tabs.getActiveTab();
  app.start();
  await tick();
  const opens = () => app.messages.filter((msg) => msg.method === 'textDocument/didOpen');
  assert.equal(app.starts(), 1);
  assert.equal(opens().length, 2);
  assert.ok(opens().every((msg) => msg.params.textDocument.version === 1));
  assert.notEqual(opens()[0].params.textDocument.uri, opens()[1].params.textDocument.uri);
  for (const tab of [first, second, first]) {
    app.tabs.setActive(tab.id);
    tab.model.setValue('{');
    await app.change();
  }
  const changes = app.messages.filter((msg) => msg.method === 'textDocument/didChange');
  assert.deepEqual(changes.map((msg) => msg.params.textDocument.version), [2, 2, 3]);
  assert.equal(opens().length, 2);
  app.options[1].listeners.click();
  assert.equal(first.model.language, 'python');
  app.tabs.setActive(second.id);
  assert.equal(second.model.language, 'json');
  app.tabs.setActive(first.id);
  assert.equal(first.model.language, 'json');
  app.tabs.openTab(null, app.model('', 'plaintext'), 'Untitled');
  app.options[0].listeners.click();
  await tick();
  const untitledUri = opens().at(-1).params.textDocument.uri;
  assert.match(untitledUri, /^untitled:/);
  await app.change();
  await app.complete();
  assert.equal(app.messages.at(-1).params.textDocument.uri, untitledUri);
  assert.equal(opens().length, 3);
  assert.equal(first.model.markers.length, 1);
  assert.equal(second.model.markers.length, 1);
  app.tabs.openTab(null, app.model('{}', 'plaintext'), 'Another untitled');
  app.options[0].listeners.click();
  await tick();
  assert.equal(opens().length, 4);
  assert.notEqual(opens().at(-1).params.textDocument.uri, untitledUri);
  assert.equal(opens().at(-1).params.textDocument.version, 1);
});


test('failed exports keep a tab dirty and successful exports assign a real path', async () => {
  const app = await createApp();
  app.start();
  await tick();
  const tab = app.tabs.getActiveTab();
  tab.isDirty = true;
  assert.equal(await app.tabs.onSave(tab), false);
  assert.equal(tab.isDirty, true);
  app.window.JSZip = class { file() {} async generateAsync() { return {}; } };
  app.tabs.openTab(null, app.model('unsaved content', 'plaintext'), 'Untitled');
  const untitled = app.tabs.getActiveTab();
  untitled.isDirty = true;
  assert.equal(await app.tabs.onSave(untitled), true);
  assert.equal(untitled.isDirty, false);
  assert.match(untitled.filePath, /\.txt$/);
  assert.equal((await app.window.api.readFile(untitled.filePath)).content, 'unsaved content');
});
