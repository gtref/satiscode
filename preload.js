const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  getWorkspacePath: () => ipcRenderer.invoke('app:workspacePath'),
  saveFile: (data) => ipcRenderer.invoke('file:save', data),
  listDirectory: (directoryPath) => ipcRenderer.invoke('directory:list', directoryPath),
  exit: () => ipcRenderer.invoke('app:exit'),
  startClangd: (rootPath) => ipcRenderer.invoke('clangd:start', rootPath),
  sendClangdMessage: (message) => ipcRenderer.send('clangd:message', message),
  stopClangd: () => ipcRenderer.send('clangd:stop'),
  onClangdMessage: (callback) => ipcRenderer.on('clangd:message', (_event, message) => callback(message)),
  onClangdStderr: (callback) => ipcRenderer.on('clangd:stderr', (_event, message) => callback(message)),
  onClangdError: (callback) => ipcRenderer.on('clangd:error', (_event, message) => callback(message))
});