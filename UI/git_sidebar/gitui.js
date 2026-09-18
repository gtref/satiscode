const GitManager = require('./gitman');
const { StatusStub } = require('./gitstub');

class GitUi {
  constructor(containerEl, options = {}) {
    this.containerEl = containerEl;
    this.gitman = options.gitman || new GitManager({ api: options.gitApi });
    this.workspace = null;
    this.state = { mode: 'empty', entries: [], message: 'Open a folder to use Git.', messageType: 'info' };
    this.listening = false;
  }

  async setWorkspace(workspace) {
    this.workspace = workspace || null;
    this.gitman.setWorkspace(this.workspace);
    if (!this.workspace) {
      this.state = { mode: 'empty', entries: [], message: 'Open a folder to use Git.', messageType: 'info' };
      this.render();
      return;
    }
    await this.refresh();
  }

  initListeners() {
    if (!this.containerEl || this.listening) return;
    this.listening = true;
    this.containerEl.addEventListener('click', (event) => this.handleClick(event));
    this.containerEl.addEventListener('input', (event) => {
      if (event.target.id === 'git-commit-message') this.renderActionState();
    });
  }

  init_listners() { this.initListeners(); }

  async handleClick(event) {
    const action = event.target.dataset?.gitAction;
    if (!action) return;
    if (action === 'refresh') return this.refresh();
    const operations = { init: 'init', stage: 'addAll', commit: 'commit', pull: 'pull', push: 'push' };
    const method = operations[action];
    if (!method) return;
    const message = action === 'commit' ? this.containerEl.querySelector('#git-commit-message')?.value.trim() : undefined;
    if (action === 'commit' && !message) return;
    await this.runAction(method, message);
  }

  async runAction(method, argument) {
    this.setMessage(`${this.actionLabel(method)}…`, 'loading');
    try {
      const output = await this.gitman[method](argument);
      await this.refresh(`${this.actionLabel(method)} completed${output ? `: ${output}` : '.'}`);
    } catch (error) {
      this.setMessage(error.message || String(error), 'error');
    }
  }

  actionLabel(method) {
    return { init: 'Initializing repository', addAll: 'Staging files', commit: 'Committing changes', pull: 'Pulling changes', push: 'Pushing changes' }[method];
  }

  async refresh(successMessage = '') {
    if (!this.workspace) return;
    this.state = { ...this.state, mode: 'loading', message: 'Loading repository status…', messageType: 'loading' };
    this.render();
    try {
      const raw = await this.gitman.status();
      this.state = { mode: 'repository', entries: StatusStub.parse(raw), message: successMessage || 'Repository status is up to date.', messageType: successMessage ? 'success' : 'info' };
    } catch (error) {
      if (/not a git repository/i.test(error.message || '')) {
        this.state = { mode: 'non-repository', entries: [], message: 'This folder is not a Git repository.', messageType: 'info' };
      } else {
        this.state = { mode: 'error', entries: [], message: error.message || String(error), messageType: 'error' };
      }
    }
    this.render();
  }

  setMessage(message, messageType) {
    this.state.message = message;
    this.state.messageType = messageType;
    this.render();
  }

  create(tagName, properties = {}, text = '') {
    const element = this.containerEl.ownerDocument.createElement(tagName);
    Object.assign(element, properties);
    if (text) element.textContent = text;
    return element;
  }

  button(label, action, disabled = false) {
    const button = this.create('button', { type: 'button', disabled }, label);
    button.dataset.gitAction = action;
    return button;
  }

  render() {
    if (!this.containerEl || !this.containerEl.ownerDocument) return;
    const panel = this.create('section', { className: 'git-panel' });
    panel.append(this.create('h2', { className: 'git-title' }, 'Source Control'));
    const status = this.create('p', { className: `git-message git-message--${this.state.messageType}`, role: this.state.messageType === 'error' ? 'alert' : 'status' }, this.state.message);
    panel.append(status);

    if (this.state.mode === 'non-repository') {
      panel.append(this.button('Init repository', 'init'));
    } else if (this.state.mode === 'repository' || this.state.mode === 'loading' || this.state.mode === 'error') {
      const busy = this.state.mode === 'loading' || this.state.messageType === 'loading';
      const toolbar = this.create('div', { className: 'git-actions' });
      toolbar.append(this.button('Refresh', 'refresh', busy), this.button('Stage all', 'stage', busy || !this.state.entries.length), this.button('Pull', 'pull', busy), this.button('Push', 'push', busy));
      panel.append(toolbar);
      const input = this.create('input', { id: 'git-commit-message', className: 'git-commit-input', type: 'text', placeholder: 'Commit message', disabled: busy || !this.state.entries.length });
      input.setAttribute('aria-label', 'Commit message');
      panel.append(input, this.button('Commit', 'commit', true));
      const list = this.create('ul', { className: 'git-status-list' });
      list.setAttribute('aria-label', 'Changed files');
      if (!this.state.entries.length) list.append(this.create('li', { className: 'git-clean' }, 'No changes'));
      for (const entry of this.state.entries) {
        const item = this.create('li', { className: 'git-status-entry' });
        item.append(this.create('span', { className: 'git-status-code' }, entry.code), this.create('span', { className: 'git-status-file', title: entry.file }, entry.file));
        list.append(item);
      }
      panel.append(list);
    }
    this.containerEl.replaceChildren(panel);
    this.renderActionState();
  }

  renderActionState() {
    const input = this.containerEl?.querySelector?.('#git-commit-message');
    const commit = this.containerEl?.querySelector?.('[data-git-action="commit"]');
    if (input && commit) commit.disabled = input.disabled || !input.value.trim();
  }
}

module.exports = { GitUi };
