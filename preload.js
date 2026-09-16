const { contextBridge, ipcRenderer } = require('electron');
const { indexer } = require('./UI/codebase_indexer/cb_index');

contextBridge.exposeInMainWorld('api', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  getWorkspacePath: () => ipcRenderer.invoke('app:workspacePath'),
  saveFile: (data) => ipcRenderer.invoke('file:save', data),
  listDirectory: (directoryPath) => ipcRenderer.invoke('directory:list', directoryPath),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),

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
  onPyrightExit: (callback) => ipcRenderer.on('pyright:exit', (_event) => callback())
});

