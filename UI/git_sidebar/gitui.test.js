const assert = require('node:assert/strict');
const test = require('node:test');
const { GitUi } = require('./gitui');

class FakeElement {
  constructor(tagName, document) { this.tagName = tagName; this.ownerDocument = document; this.children = []; this.dataset = {}; this.disabled = false; this.value = ''; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this[name] = value; }
  addEventListener() {}
  querySelector(selector) {
    const matches = (element) => selector.startsWith('#') ? element.id === selector.slice(1) : selector === '[data-git-action="commit"]' && element.dataset.gitAction === 'commit';
    const visit = (element) => matches(element) ? element : element.children.map(visit).find(Boolean);
    return visit(this);
  }
  get textContent() { return this._text || this.children.map((child) => child.textContent).join(' '); }
  set textContent(value) { this._text = value; }
}

function createContainer() {
  const document = { createElement: (tagName) => new FakeElement(tagName, document) };
  return new FakeElement('div', document);
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

test('renders empty, loading, repository, success, non-repository, and error states', async () => {
  const container = createContainer();
  const pending = deferred();
  const gitman = { setWorkspace() {}, status: () => pending.promise };
  const ui = new GitUi(container, { gitman });
  ui.render();
  assert.match(container.textContent, /Open a folder/);
  const refresh = ui.setWorkspace('/workspace');
  assert.match(container.textContent, /Loading repository status/);
  pending.resolve(' M changed.js\n?? new.js');
  await refresh;
  assert.match(container.textContent, /changed\.js/);
  ui.setMessage('Staging files completed.', 'success');
  assert.match(container.textContent, /completed/);
  gitman.status = async () => { throw new Error('fatal: not a git repository'); };
  await ui.refresh();
  assert.match(container.textContent, /Init repository/);
  gitman.status = async () => { throw new Error('permission denied'); };
  await ui.refresh();
  assert.match(container.textContent, /permission denied/);
});

test('actions invoke the expected operation and refresh status', async () => {
  let stageCalls = 0;
  let statusCalls = 0;
  const gitman = { setWorkspace() {}, status: async () => { statusCalls++; return ' M file.js'; }, addAll: async () => { stageCalls++; return ''; } };
  const ui = new GitUi(createContainer(), { gitman });
  await ui.setWorkspace('/workspace');
  await ui.runAction('addAll');
  assert.equal(stageCalls, 1);
  assert.equal(statusCalls, 2);
  assert.equal(ui.state.messageType, 'success');
});

test('renders graph-aware, expandable commit history', async () => {
  const gitman = {
    setWorkspace() {},
    status: async () => '',
    log: async () => '* \x1f0123456789abcdef\x1f\x1fAda Lovelace\x1f2 hours ago\x1fAdd feature\n| * \x1fabcdef9876543210\x1f0123456789abcdef 1111111111111111\x1fGrace Hopper\x1f1 hour ago\x1fMerge branch'
  };
  const container = createContainer();
  const ui = new GitUi(container, { gitman });
  await ui.setWorkspace('/workspace');
  assert.equal(ui.state.commits.length, 2);
  assert.equal(ui.state.commits[1].parents.length, 2);
  assert.match(container.textContent, /Add feature/);
  assert.match(container.textContent, /Merge branch/);
  assert.match(container.textContent, /Parents: 0123456, 1111111/);
  assert.match(container.textContent, /\| \*/);
});

test('clearing the workspace clears repository state', async () => {
  const ui = new GitUi(createContainer(), { gitman: { setWorkspace() {}, status: async () => '' } });
  await ui.setWorkspace('/workspace');
  await ui.setWorkspace(null);
  assert.equal(ui.state.mode, 'empty');
  assert.deepEqual(ui.state.entries, []);
});
