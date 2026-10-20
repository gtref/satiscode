const { contextBridge, ipcRenderer } = require('electron');
const hljs = require('highlight.js');
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
  highlightCode: (code, language) => hljs.getLanguage(language)
    ? hljs.highlight(code, { language }).value
    : null,
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  getWorkspacePath: () => ipcRenderer.invoke('app:workspacePath'),
  saveFile: (data) => ipcRenderer.invoke('file:save', data),
  listDirectory: (directoryPath) => ipcRenderer.invoke('directory:list', directoryPath),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  setGitWorkspace: (workspace) => gitUi?.setWorkspace(workspace),
  gitBlame: (workspace, filePath) => gitApi.run('blame', workspace, [filePath]),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setUserName: (userName) => ipcRenderer.invoke('settings:setUserName', userName),
  setTheme: (theme) => ipcRenderer.invoke('settings:setTheme', theme),
  setLanguage: (language) => ipcRenderer.invoke('settings:setLanguage', language),

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
  onPyrightExit: (callback) => ipcRenderer.on('pyright:exit', () => callback()),

  // --- FIXSON ---
  startFixson: (rootPath) => ipcRenderer.invoke('fixson:start', rootPath),
  sendFixsonMessage: (message) => ipcRenderer.send('fixson:message', message),
  stopFixson: () => ipcRenderer.send('fixson:stop'),
  onFixsonMessage: (callback) => ipcRenderer.on('fixson:message', (_event, message) => callback(message)),
  onFixsonStderr: (callback) => ipcRenderer.on('fixson:stderr', (_event, message) => callback(message)),
  onFixsonError: (callback) => ipcRenderer.on('fixson:error', (_event, message) => callback(message)),
  onFixsonExit: (callback) => ipcRenderer.on('fixson:exit', () => callback())
});
