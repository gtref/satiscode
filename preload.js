const { contextBridge, ipcRenderer } = require('electron');
const { indexer } = require('./UI/codebase_indexer/cb_index');
const { GitUi } = require('./UI/git_sidebar/gitui');

let gitUi = null;
const gitApi = { run: (operation, workspace, args = []) => ipcRenderer.invoke('git:run', { operation, workspace, args }) };

globalThis.addEventListener('DOMContentLoaded', () => {
  const container = globalThis.document.getElementById('git-sidebar-mount');
  gitUi = new GitUi(container, { gitApi });
  gitUi.render();
  gitUi.initListeners();
});

contextBridge.exposeInMainWorld('api', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  getWorkspacePath: () => ipcRenderer.invoke('app:workspacePath'),
  saveFile: (data) => ipcRenderer.invoke('file:save', data),
  listDirectory: (directoryPath) => ipcRenderer.invoke('directory:list', directoryPath),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  setGitWorkspace: (workspace) => gitUi?.setWorkspace(workspace),
  gitStatus: (workspace) => gitApi.run('status', workspace),
  gitInit: (workspace) => gitApi.run('init', workspace),
  gitAddAll: (workspace) => gitApi.run('addAll', workspace),
  gitCommit: (workspace, message) => gitApi.run('commit', workspace, [message]),
  gitPull: (workspace) => gitApi.run('pull', workspace),
  gitPush: (workspace) => gitApi.run('push', workspace),

  updateCodebaseIndex: (documentId, text) => indexer.updateActiveDocument(documentId, text),
  queryCodebaseGhostText: (prefix) => indexer.queryGhostText(prefix),

  exit: () => ipcRenderer.invoke('app:exit'),

  // --- CLANGD ---
  startClangd: (rootPath) => ipcRenderer.invoke('clangd:start', rootPath),
  sendClangdMessage: (message) => ipcRenderer.send('clangd:message', message),
  stopClangd: () => ipcRenderer.send('clangd:stop'),
  onClangdMessage: (callback) => ipcRenderer.on('clangd:message', (_event, message) => callback(message)),
  onClangdStderr: (callback) => ipcRenderer.on('clangd:stderr', (_event, message) => callback(message)),
  onClangdError: (callback) => ipcRenderer.on('clangd:error', (_event, message) => callback(message)),

  // --- PYRIGHT ---
  startPyright: (rootPath) => ipcRenderer.invoke('pyright:start', rootPath),
  sendPyrightMessage: (message) => ipcRenderer.send('pyright:message', message),
  stopPyright: () => ipcRenderer.send('pyright:stop'),
  onPyrightMessage: (callback) => ipcRenderer.on('pyright:message', (_event, message) => callback(message)),
  onPyrightStderr: (callback) => ipcRenderer.on('pyright:stderr', (_event, message) => callback(message)),
  onPyrightError: (callback) => ipcRenderer.on('pyright:error', (_event, message) => callback(message)),
  onPyrightExit: (callback) => ipcRenderer.on('pyright:exit', () => callback())
});
