const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let clangdProcess = null;
let clangdBuffer = Buffer.alloc(0);
let isQuitting = false;

function sendToClangd(message) {
  if (!clangdProcess || clangdProcess.stdin.destroyed) return;
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  clangdProcess.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
  clangdProcess.stdin.write(body);
}

function sendToRenderer(event, channel, ...args) {
  if (!event.sender.isDestroyed()) event.sender.send(channel, ...args);
}

function stopClangd() {
  if (clangdProcess) clangdProcess.kill();
  clangdProcess = null;
  clangdBuffer = Buffer.alloc(0);
}

function findProjectRoot(startPath) {
  let currentPath = path.resolve(startPath || process.cwd());
  while (true) {
    if (['compile_commands.json', '.clangd', '.git'].some((entry) => fs.existsSync(path.join(currentPath, entry)))) {
      return currentPath;
    }
    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) return path.resolve(startPath || process.cwd());
    currentPath = parentPath;
  }
}

function gracefulStopClangd() {
  if (!clangdProcess) return Promise.resolve();
  const processToStop = clangdProcess;
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (clangdProcess === processToStop) stopClangd();
      resolve();
    };
    const timeout = setTimeout(finish, 1000);
    processToStop.once('exit', finish);
    sendToClangd({ jsonrpc: '2.0', id: Date.now(), method: 'shutdown', params: null });
    setTimeout(() => {
      if (!settled && !processToStop.killed) {
        sendToClangd({ jsonrpc: '2.0', method: 'exit', params: null });
      }
    }, 250);
  });
}

function startClangd(event, rootPath) {
  stopClangd();
  const projectRoot = findProjectRoot(rootPath);
  const clangdCandidates = [
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'LLVM', 'bin', 'clangd.exe'),
    process.env.ProgramW6432 && path.join(process.env.ProgramW6432, 'LLVM', 'bin', 'clangd.exe'),
    'clangd'
  ].filter(Boolean);
  const clangdCommand = clangdCandidates.find((candidate) => candidate === 'clangd' || fs.existsSync(candidate)) || 'clangd';
  clangdProcess = spawn(clangdCommand, ['--background-index', '--header-insertion=never'], {
    cwd: projectRoot,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  const processStarted = new Promise((resolve, reject) => {
    clangdProcess.once('spawn', () => resolve({ projectRoot, command: clangdCommand }));
    clangdProcess.once('error', reject);
  });

  clangdProcess.stdout.on('data', (chunk) => {
    clangdBuffer = Buffer.concat([clangdBuffer, chunk]);
    while (true) {
      const headerEnd = clangdBuffer.indexOf('\r\n\r\n');
      if (headerEnd < 0) break;
      const header = clangdBuffer.subarray(0, headerEnd).toString('ascii');
      const lengthMatch = header.match(/Content-Length:\s*(\d+)/i);
      if (!lengthMatch) {
        clangdBuffer = clangdBuffer.subarray(headerEnd + 4);
        continue;
      }
      const bodyLength = Number(lengthMatch[1]);
      const bodyStart = headerEnd + 4;
      if (clangdBuffer.length < bodyStart + bodyLength) break;
      const body = clangdBuffer.subarray(bodyStart, bodyStart + bodyLength).toString('utf8');
      clangdBuffer = clangdBuffer.subarray(bodyStart + bodyLength);
      try {
        sendToRenderer(event, 'clangd:message', JSON.parse(body));
      } catch (error) {
        console.error('Invalid clangd message:', error);
      }
    }
  });

  clangdProcess.stderr.on('data', (chunk) => sendToRenderer(event, 'clangd:stderr', chunk.toString()));
  clangdProcess.on('error', (error) => sendToRenderer(event, 'clangd:error', error.message));
  clangdProcess.on('exit', () => {
    sendToRenderer(event, 'clangd:exit');
    clangdProcess = null;
  });

  return processStarted;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.webContents.on('console-message', (event) => {
    const { level, message, line, sourceId } = event;
    console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
  });
  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process exited:', details.reason);
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// File Open Handler
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile']
  });
  if (canceled) return null;
  const content = fs.readFileSync(filePaths[0], 'utf-8');
  return { path: filePaths[0], content };
});

// Folder Open Handler
ipcMain.handle('dialog:openFolder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (canceled || filePaths.length === 0) return null;
  return filePaths[0];
});

ipcMain.handle('file:read', async (_event, filePath) => ({
  path: filePath,
  content: await fs.promises.readFile(filePath, 'utf-8')
}));

ipcMain.handle('app:workspacePath', () => process.cwd());

// File Save Handler
ipcMain.handle('file:save', async (event, { filePath, content }) => {
  let targetPath = filePath;
  if (!targetPath) {
    const { canceled, filePath: savePath } = await dialog.showSaveDialog();
    if (canceled) return null;
    targetPath = savePath;
  }
  fs.writeFileSync(targetPath, content, 'utf-8');
  return targetPath;
});

ipcMain.handle('directory:list', async (_event, directoryPath) => {
  const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
  return entries
    .filter((entry) => !entry.name.startsWith('.') && entry.name !== 'node_modules')
    .map((entry) => ({ name: entry.name, path: path.join(directoryPath, entry.name), isDirectory: entry.isDirectory() }))
    .sort((left, right) => Number(right.isDirectory) - Number(left.isDirectory) || left.name.localeCompare(right.name));
});

ipcMain.handle('clangd:start', (event, rootPath) => startClangd(event, rootPath));
ipcMain.on('clangd:message', (_event, message) => sendToClangd(message));
ipcMain.on('clangd:stop', stopClangd);
ipcMain.handle('app:exit', async () => {
  isQuitting = true;
  await gracefulStopClangd();
  app.quit();
});
app.on('before-quit', (event) => {
  if (isQuitting) return;
  isQuitting = true;
  event.preventDefault();
  gracefulStopClangd().finally(() => app.quit());
});
app.on('will-quit', stopClangd);