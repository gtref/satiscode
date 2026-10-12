const assert = require('node:assert/strict');
const test = require('node:test');
const { GitUi } = require('./gitui');

class FakeElement {
  constructor(tagName, document) { this.tagName = tagName; this.ownerDocument = document; this.children = []; this.dataset = {}; this.disabled = false; this.value = ''; this.style = { setProperty(name, value) { this[name] = value; } }; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this[name] = value; }
  addEventListener() {}
  querySelector(selector) {
    const matches = (element) => selector.startsWith('#') ? element.id === selector.slice(1) : selector.startsWith('.') ? element.className?.split(' ').includes(selector.slice(1)) : selector === '[data-git-action="commit"]' && element.dataset.gitAction === 'commit';
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
    log: async () => '* \x1f0123456789abcdef\x1f\x1fAda Lovelace\x1f2 hours ago\x1f\x1fAdd feature\n| * \x1fabcdef9876543210\x1f0123456789abcdef 1111111111111111\x1fGrace Hopper\x1f1 hour ago\x1fHEAD -> main\x1fMerge branch'
  };
  const container = createContainer();
  const ui = new GitUi(container, { gitman });
  await ui.setWorkspace('/workspace');
  assert.equal(ui.state.commits.length, 2);
  assert.equal(ui.state.commits[0].message, 'Add feature');
  assert.match(container.querySelector('.git-commit-summary').textContent, /^Add feature /);
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

test('renders connector rows in order and positions commit markers in their graph lanes', async () => {
  const container = createContainer();
  const ui = new GitUi(container, { gitman: {
    setWorkspace() {}, status: async () => '',
    log: async () => '*   \x1fmerge\x1fleft right\x1fAda\x1ftoday\x1f\x1fMerge\n|\\  \n| * \x1fright\x1f\x1fGrace\x1ftoday\x1f\x1fBranch work\n|/  '
  } });
  await ui.setWorkspace('/workspace');
  const rows = container.querySelector('.git-history-list').children;
  assert.equal(rows.length, 4);
  assert.equal(rows[0].children[0].style['--commit-column'], '0.5ch');
  assert.equal(rows[2].children[0].style['--commit-column'], '2.5ch');
  assert.equal(rows[1].textContent, '|\\  ');
  assert.equal(rows[3].textContent, '|/  ');
  assert.equal(rows[1].children.length, 1);
  assert.equal(rows[1].children[0].style['--commit-column'], undefined);
  for (const row of rows) assert.equal(row.children[0].style.width, '4ch');
});

test('keeps status available on history failure and clears the error after recovery', async () => {
  const container = createContainer();
  const gitman = {
    setWorkspace() {}, status: async () => ' M changed.js',
    log: async () => { throw new Error('history permission denied'); }
  };
  const ui = new GitUi(container, { gitman });
  await ui.setWorkspace('/workspace');
  assert.equal(ui.state.mode, 'repository');
  assert.equal(ui.state.historyError, 'history permission denied');
  assert.match(container.textContent, /changed.js/);
  assert.match(container.textContent, /Unable to load commit history: history permission denied/);
  assert.doesNotMatch(container.textContent, /No commits yet/);
  assert.equal(container.querySelector('.git-message--error').role, 'alert');
  gitman.log = async () => '';
  await ui.refresh();
  assert.equal(ui.state.historyError, '');
  assert.match(container.textContent, /No commits yet/);
  assert.doesNotMatch(container.textContent, /Unable to load commit history/);
});
