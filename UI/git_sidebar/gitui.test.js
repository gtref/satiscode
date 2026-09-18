const assert = require('node:assert/strict');
const test = require('node:test');
const { GitUi } = require('./gitui');
const { generateUnifiedDiff } = require('../../patchgen');

test('exports GitUi and stores the diff generator function', () => {
    const gitUi = new GitUi({}, {});

    assert.equal(gitUi.patch, generateUnifiedDiff);
});

test('renders the Git controls into its mount element', () => {
    const container = { innerHTML: '' };
    const gitUi = new GitUi(container, {});

    gitUi.render();

    assert.match(container.innerHTML, /id="git-add-btn"/);
    assert.match(container.innerHTML, /id="git-old-file"/);
    assert.match(container.innerHTML, /id="git-new-file"/);
    assert.match(container.innerHTML, /id="git-patch-btn"/);
});

test('the Add control stages all files', () => {
    const listeners = [];
    const container = {
        addEventListener: (_type, listener) => listeners.push(listener)
    };
    const gitUi = new GitUi(container, {});
    let addAllCalls = 0;
    gitUi.gitman = {
        init: () => Promise.resolve(''),
        addAll: () => {
            addAllCalls++;
            return Promise.resolve('');
        }
    };

    gitUi.init_listners();
    listeners.forEach((listener) => listener({ target: { id: 'git-add-btn' } }));

    assert.equal(addAllCalls, 1);
});

test('generates a patch synchronously from the selected file paths', () => {
    const listeners = [];
    const oldFile = { name: 'old.txt' };
    const newFile = { name: 'new.txt' };
    const inputs = {
        '#git-old-file': { files: [oldFile] },
        '#git-new-file': { files: [newFile] }
    };
    const container = {
        addEventListener: (_type, listener) => listeners.push(listener),
        querySelector: (selector) => inputs[selector]
    };
    const gitBar = {
        getPathForFile: (file) => `/selected/${file.name}`
    };
    const gitUi = new GitUi(container, gitBar);
    let selectedPaths;
    gitUi.patch = (oldFilePath, newFilePath) => {
        selectedPaths = [oldFilePath, newFilePath];
        return 'patch text';
    };

    gitUi.init_listners();
    listeners.forEach((listener) => listener({ target: { id: 'git-patch-btn' } }));

    assert.deepEqual(selectedPaths, ['/selected/old.txt', '/selected/new.txt']);
});
